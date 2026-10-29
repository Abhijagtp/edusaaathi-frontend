"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  addMyLeadNoteState, CONSULTANT_STORAGE_KEY, createInitialConsultantState,
  restoreConsultantState, updateMyLeadState, updateMyProfileState,
} from "@/lib/consultant/mock-service";
import type {
  ConsultantLead, ConsultantLeadUpdate, ConsultantPortalState, ConsultantProfile, ConsultantProfileDraft,
} from "@/lib/consultant/types";
import { interceptedFetch as fetch } from "@/lib/api-client";

type ConsultantPortalValue = ConsultantPortalState & {
  hydrated: boolean;
  notice: string;
  announce: (message: string) => void;
  updateMyLead: (id: string, updates: ConsultantLeadUpdate) => void;
  addLeadNote: (id: string, note: string) => void;
  updateMyProfile: (draft: ConsultantProfileDraft) => void;
  resetDemoData: () => void;
  refreshConsultantData: () => Promise<void>;
};

const ConsultantPortalContext = createContext<ConsultantPortalValue | null>(null);

export function ConsultantPortalProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConsultantPortalState>(() => createInitialConsultantState());
  const [hydrated, setHydrated] = useState(false);
  const [notice, setNotice] = useState("");

  const syncConsultantBackend = useCallback(async () => {
    try {
      const [dashRes, leadsRes] = await Promise.allSettled([
        fetch("/api/consultant/dashboard").then((r) => r.ok ? r.json() : null),
        fetch("/api/consultant/leads").then((r) => r.ok ? r.json() : null),
      ]);

      const dashData = dashRes.status === "fulfilled" ? dashRes.value : null;
      const leadsData = leadsRes.status === "fulfilled" ? leadsRes.value?.leads : null;

      setState((curr) => {
        let nextProfile = curr.profile;
        let code = (curr.profile.referralCode || "").toUpperCase();
        let cid = String(curr.profile.id || "");
        let cuid = String(curr.profile.userId || cid);

        if (dashData && dashData.consultant) {
          const c = dashData.consultant;
          code = (c.referral_code || curr.profile.referralCode || "").toUpperCase();
          cid = String(c.id);
          cuid = String(c.user_id || c.id);
          nextProfile = {
            id: cid,
            userId: cuid,
            fullName: c.full_name || curr.profile.fullName,
            email: c.email || curr.profile.email,
            phone: c.phone_number || curr.profile.phone,
            referralCode: code || curr.profile.referralCode,
            isActive: true,
            createdAt: curr.profile.createdAt,
          };
        }

        const liveLeads: ConsultantLead[] = Array.isArray(leadsData) ? leadsData : curr.leads;
        const liveReferralLeads = liveLeads
          .filter((l) => (code && l.referralCode && l.referralCode.toUpperCase() === code) || l.referredByConsultantId === cid || l.referredByConsultantId === cuid || l.source === "Consultant referral")
          .map((l) => ({
            id: `ref-${l.id}`,
            fullName: l.fullName,
            capturedAt: l.createdAt,
            interestedCourse: l.interestedCourse,
            currentStatus: l.status,
            authorizedLeadId: l.id,
          }));

        return {
          ...curr,
          profile: nextProfile,
          leads: liveLeads,
          referralLeads: liveReferralLeads,
        };
      });
    } catch {
      // Fallback to local state
    }
  }, []);

  useEffect(() => {
    let restored: ConsultantPortalState;
    try {
      const saved = window.localStorage.getItem(CONSULTANT_STORAGE_KEY);
      restored = saved ? restoreConsultantState(JSON.parse(saved)) : createInitialConsultantState();
    } catch {
      restored = createInitialConsultantState();
    }
    setState(restored);
    setHydrated(true);
  }, []);

  // Synchronize live consultant profile, metrics, and assigned leads from backend
  useEffect(() => {
    if (!hydrated) return;
    void syncConsultantBackend();
  }, [hydrated, syncConsultantBackend]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(CONSULTANT_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // The portal remains usable in memory
    }
  }, [hydrated, state]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const announce = useCallback((message: string) => setNotice(message), []);

  const updateMyLead = useCallback((id: string, updates: ConsultantLeadUpdate) => {
    if (!state) return;
    
    // Call backend API
    fetch(`/api/consultant/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: updates.status }),
    }).catch(() => null);

    setState(updateMyLeadState(state, id, updates));
    announce(updates.status === "Converted" ? "Lead marked as enrolled / converted." : updates.status === "Lost" ? "Lead marked as lost." : "Lead status updated.");
  }, [state, announce]);

  const addLeadNote = useCallback((id: string, note: string) => {
    if (!state) return;

    fetch(`/api/consultant/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    }).catch(() => null);

    setState(addMyLeadNoteState(state, id, note));
    announce("Note saved successfully.");
  }, [state, announce]);

  const updateMyProfile = useCallback((draft: ConsultantProfileDraft) => {
    if (!state) return;

    const parts = (draft.fullName || "").split(" ");
    const firstName = parts[0] || "";
    const lastName = parts.slice(1).join(" ") || "";

    fetch("/api/consultant/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        phone_number: draft.phone,
      }),
    }).catch(() => null);

    setState(updateMyProfileState(state, draft));
    announce("Profile changes saved.");
  }, [state, announce]);

  const resetDemoData = useCallback(() => {
    setState(createInitialConsultantState());
    announce("Consultant workspace data has been reset.");
  }, [announce]);

  const value = useMemo<ConsultantPortalValue>(() => ({
    ...state, hydrated, notice, announce, updateMyLead, addLeadNote, updateMyProfile, resetDemoData, refreshConsultantData: syncConsultantBackend,
  }), [state, hydrated, notice, announce, updateMyLead, addLeadNote, updateMyProfile, resetDemoData, syncConsultantBackend]);

  return <ConsultantPortalContext.Provider value={value}>{children}</ConsultantPortalContext.Provider>;
}

export function useConsultantPortal(): ConsultantPortalValue {
  const value = useContext(ConsultantPortalContext);
  if (!value) throw new Error("useConsultantPortal must be used within ConsultantPortalProvider.");
  return value;
}
