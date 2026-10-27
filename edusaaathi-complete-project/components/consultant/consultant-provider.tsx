"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  addMyLeadNoteState, completeMyFollowUpState, CONSULTANT_STORAGE_KEY, createInitialConsultantState,
  createMyFollowUpState, restoreConsultantState, updateMyFollowUpState, updateMyLeadState, updateMyProfileState,
} from "@/lib/consultant/mock-service";
import type {
  ConsultantFollowUpDraft, ConsultantLeadUpdate, ConsultantPortalState, ConsultantProfileDraft,
} from "@/lib/consultant/types";

type ConsultantPortalValue = ConsultantPortalState & {
  hydrated: boolean;
  notice: string;
  announce: (message: string) => void;
  updateMyLead: (id: string, updates: ConsultantLeadUpdate) => void;
  addLeadNote: (id: string, note: string) => void;
  createFollowUp: (draft: ConsultantFollowUpDraft) => void;
  updateFollowUp: (id: string, draft: ConsultantFollowUpDraft) => void;
  completeFollowUp: (id: string) => void;
  updateMyProfile: (draft: ConsultantProfileDraft) => void;
  resetDemoData: () => void;
};

const ConsultantPortalContext = createContext<ConsultantPortalValue | null>(null);

export function ConsultantPortalProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConsultantPortalState>(() => createInitialConsultantState());
  const [hydrated, setHydrated] = useState(false);
  const [notice, setNotice] = useState("");

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

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(CONSULTANT_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // The portal remains usable in memory when browser storage is unavailable.
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
    setState(updateMyLeadState(state, id, updates));
    announce(updates.status === "Converted" ? "Lead marked as converted in this demo." : updates.status === "Lost" ? "Lead marked as lost in this demo." : "Lead updated in this demo.");
  }, [state, announce]);

  const addLeadNote = useCallback((id: string, note: string) => {
    if (!state) return;
    setState(addMyLeadNoteState(state, id, note));
    announce("Note saved to this browser's demo data.");
  }, [state, announce]);

  const createFollowUp = useCallback((draft: ConsultantFollowUpDraft) => {
    if (!state) return;
    setState(createMyFollowUpState(state, draft));
    announce("Follow-up scheduled in this browser's demo data.");
  }, [state, announce]);

  const updateFollowUp = useCallback((id: string, draft: ConsultantFollowUpDraft) => {
    if (!state) return;
    setState(updateMyFollowUpState(state, id, draft));
    announce("Follow-up rescheduled in this browser's demo data.");
  }, [state, announce]);

  const completeFollowUp = useCallback((id: string) => {
    if (!state) return;
    const next = completeMyFollowUpState(state, id);
    if (next === state) return;
    setState(next);
    announce("Follow-up marked complete.");
  }, [state, announce]);

  const updateMyProfile = useCallback((draft: ConsultantProfileDraft) => {
    if (!state) return;
    setState(updateMyProfileState(state, draft));
    announce("Profile changes saved in this browser.");
  }, [state, announce]);

  const resetDemoData = useCallback(() => {
    setState(createInitialConsultantState());
    announce("Consultant demo data has been reset.");
  }, [announce]);

  const value = useMemo<ConsultantPortalValue>(() => ({
    ...state, hydrated, notice, announce, updateMyLead, addLeadNote, createFollowUp, updateFollowUp, completeFollowUp, updateMyProfile, resetDemoData,
  }), [state, hydrated, notice, announce, updateMyLead, addLeadNote, createFollowUp, updateFollowUp, completeFollowUp, updateMyProfile, resetDemoData]);

  return <ConsultantPortalContext.Provider value={value}>{children}</ConsultantPortalContext.Provider>;
}

export function useConsultantPortal(): ConsultantPortalValue {
  const value = useContext(ConsultantPortalContext);
  if (!value) throw new Error("useConsultantPortal must be used within ConsultantPortalProvider.");
  return value;
}
