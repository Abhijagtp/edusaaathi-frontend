"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { SITE_URL } from "@/lib/config";
import type { Course } from "@/lib/types";
import { slugify } from "@/lib/format";
import { ADMIN_STORAGE_KEY, createInitialAdminState } from "@/lib/adminuser/mock-data";
import type { Activity, AdminSettings, AdminState, Consultant, ConsultantDraft, CourseDraft, FollowUp, FollowUpDraft, Lead, LeadDraft, WebsiteContent } from "@/lib/adminuser/types";

type AdminDataValue = AdminState & {
  sourceCourses: Course[];
  hydrated: boolean;
  notice: string;
  announce: (message: string) => void;
  addCourse: (draft: CourseDraft) => string;
  updateCourse: (id: string, draft: CourseDraft) => void;
  setCoursePublished: (id: string, published: boolean) => void;
  deleteCourse: (id: string) => void;
  addLead: (draft: LeadDraft) => string;
  updateLead: (id: string, draft: LeadDraft) => void;
  setLeadStatus: (id: string, status: Lead["status"]) => void;
  setLeadStatuses: (ids: string[], status: Lead["status"]) => void;
  assignLeads: (ids: string[], consultantId: string | null) => void;
  addLeadNote: (leadId: string, text: string) => void;
  addConsultant: (draft: ConsultantDraft) => string;
  updateConsultant: (id: string, draft: ConsultantDraft) => void;
  setConsultantStatus: (id: string, status: "Active" | "Inactive") => void;
  addFollowUp: (draft: FollowUpDraft) => string;
  updateFollowUp: (id: string, draft: FollowUpDraft) => void;
  completeFollowUp: (id: string) => void;
  saveWebsiteContent: (content: WebsiteContent) => void;
  saveSettings: (settings: AdminSettings) => void;
  resetMockData: () => void;
};

const emptyState: AdminState = {
  courses: [], leads: [], consultants: [], referrals: [], followUps: [], activities: [],
  websiteContent: {
    homepageHeading: "", homepageDescription: "", contactEmail: "", contactPhone: "", whatsappNumber: "",
    enquiryFormEnabled: true, requireConsent: true, showCourseField: true,
  },
  settings: {
    organizationName: "Edusaaathi Education Consultancy", websiteBaseUrl: SITE_URL, assignmentMethod: "Manual",
    referralCodePrefix: "", referralCookieDays: 30, emailNotifications: true, followUpReminders: true, weeklySummary: false,
  },
};

const AdminDataContext = createContext<AdminDataValue | null>(null);

function id(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function activity(type: Activity["type"], title: string, description: string, leadId: string | null = null, consultantId: string | null = null): Activity {
  return { id: id("activity"), leadId, consultantId, type, title, description, createdAt: new Date().toISOString(), actor: "Ananya Sharma" };
}

export function AdminDataProvider({ children, initialCourses = [] }: { children: React.ReactNode; initialCourses?: Course[] }) {
  const [state, setState] = useState<AdminState>(emptyState);
  const [hydrated, setHydrated] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const initialState = createInitialAdminState(initialCourses);
    let restored: AdminState | null = null;
    try {
      const raw = window.localStorage.getItem(ADMIN_STORAGE_KEY);
      if (raw) restored = JSON.parse(raw) as AdminState;
    } catch {
      restored = null;
    }
    setState(restored?.leads && restored.consultants
      ? { ...initialState, ...restored, courses: Array.isArray(restored.courses) ? restored.courses : initialCourses }
      : initialState);
    setHydrated(true);
  }, [initialCourses]);

  useEffect(() => {
    if (!hydrated) return;
    try { window.localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(state)); } catch { /* Local browser storage is optional in demo mode. */ }
  }, [state, hydrated]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 3600);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const announce = useCallback((message: string) => setNotice(message), []);

  const addCourse = useCallback((draft: CourseDraft) => {
    const slug = slugify(draft.slug || draft.name);
    if (!slug) throw new Error("Add a valid course name and URL slug.");
    if (state.courses.some((course) => course.slug === slug)) throw new Error("A course with this URL slug already exists.");
    const courseId = id("course");
    const course: Course = { ...draft, id: courseId, slug, updatedAt: new Date().toISOString() };
    setState((current) => ({
      ...current,
      courses: [course, ...current.courses],
      activities: [activity("course", "Course added", `${course.name} was added to the local demo catalog.`), ...current.activities],
    }));
    announce("Course added to the local demo catalog. It has not been published to the website.");
    return courseId;
  }, [announce, state.courses]);

  const updateCourse = useCallback((courseId: string, draft: CourseDraft) => {
    const slug = slugify(draft.slug || draft.name);
    if (!slug) throw new Error("Add a valid course name and URL slug.");
    if (state.courses.some((course) => course.id !== courseId && course.slug === slug)) throw new Error("A course with this URL slug already exists.");
    setState((current) => {
      const existing = current.courses.find((course) => course.id === courseId);
      if (!existing) return current;
      const updated: Course = { ...existing, ...draft, id: courseId, slug, updatedAt: new Date().toISOString() };
      return {
        ...current,
        courses: current.courses.map((course) => course.id === courseId ? updated : course),
        activities: [activity("course", "Course updated", `${updated.name} was updated in the local demo catalog.`), ...current.activities],
      };
    });
    announce("Course updated in the local demo catalog only.");
  }, [announce, state.courses]);

  const setCoursePublished = useCallback((courseId: string, published: boolean) => {
    setState((current) => {
      const course = current.courses.find((item) => item.id === courseId);
      if (!course || course.published === published) return current;
      return {
        ...current,
        courses: current.courses.map((item) => item.id === courseId ? { ...item, published, updatedAt: new Date().toISOString() } : item),
        activities: [activity("course", published ? "Course marked published" : "Course moved to draft", `${course.name} visibility changed in this browser only.`), ...current.activities],
      };
    });
    announce(published ? "Course marked published in this local demo. The public website was not changed." : "Course moved to draft in this local demo.");
  }, [announce]);

  const deleteCourse = useCallback((courseId: string) => {
    const existing = state.courses.find((course) => course.id === courseId);
    if (!existing) return;
    setState((current) => ({
      ...current,
      courses: current.courses.filter((course) => course.id !== courseId),
      activities: [activity("course", "Course removed", `${existing.name} was removed from the local demo catalog.`), ...current.activities],
    }));
    announce("Course removed from the local demo catalog only.");
  }, [announce, state.courses]);

  const addLead = useCallback((draft: LeadDraft) => {
    const now = new Date().toISOString();
    const leadId = id("lead");
    const newLead: Lead = {
      ...draft,
      id: leadId,
      createdAt: now,
      lastContactedAt: draft.lastContactedAt ?? null,
      notes: [],
    };
    setState((current) => {
      const referral = newLead.referredByConsultantId ? [{
        id: id("referral"), leadId, consultantId: newLead.referredByConsultantId, createdAt: now, campaign: "Admin entered referral",
      }] : [];
      return {
        ...current,
        leads: [newLead, ...current.leads],
        referrals: [...referral, ...current.referrals],
        activities: [activity("lead-created", "Lead created", `${newLead.studentName} was added to the lead list.`, leadId, newLead.assignedConsultantId), ...current.activities],
      };
    });
    announce("Lead added to the local demo data.");
    return leadId;
  }, [announce]);

  const updateLead = useCallback((leadId: string, draft: LeadDraft) => {
    setState((current) => {
      const existing = current.leads.find((lead) => lead.id === leadId);
      if (!existing) return current;
      const updated: Lead = { ...existing, ...draft, id: existing.id, createdAt: existing.createdAt, notes: existing.notes };
      let referrals = current.referrals;
      if (existing.referredByConsultantId !== updated.referredByConsultantId) {
        referrals = referrals.filter((referral) => referral.leadId !== leadId);
        if (updated.referredByConsultantId) referrals = [{ id: id("referral"), leadId, consultantId: updated.referredByConsultantId, createdAt: new Date().toISOString(), campaign: "Attribution updated in demo" }, ...referrals];
      }
      const nextActivities = existing.assignedConsultantId !== updated.assignedConsultantId
        ? [activity("assigned", "Lead reassigned", `${updated.studentName} was reassigned.`, leadId, updated.assignedConsultantId), ...current.activities]
        : current.activities;
      return { ...current, leads: current.leads.map((lead) => lead.id === leadId ? updated : lead), referrals, activities: nextActivities };
    });
    announce("Lead updated in the local demo data.");
  }, [announce]);

  const setLeadStatus = useCallback((leadId: string, status: Lead["status"]) => {
    setState((current) => {
      const lead = current.leads.find((item) => item.id === leadId);
      if (!lead || lead.status === status) return current;
      return {
        ...current,
        leads: current.leads.map((item) => item.id === leadId ? { ...item, status } : item),
        activities: [activity("status-changed", "Lead status changed", `${lead.studentName} moved from ${lead.status} to ${status}.`, leadId, lead.assignedConsultantId), ...current.activities],
      };
    });
    announce(`Lead status changed to ${status}.`);
  }, [announce]);

  const setLeadStatuses = useCallback((ids: string[], status: Lead["status"]) => {
    if (!ids.length) return;
    const selected = new Set(ids);
    setState((current) => {
      const changedLeads = current.leads.filter((lead) => selected.has(lead.id) && lead.status !== status);
      if (!changedLeads.length) return current;
      const changes = changedLeads.map((lead) => activity("status-changed", "Lead status changed", `${lead.studentName} moved from ${lead.status} to ${status}.`, lead.id, lead.assignedConsultantId));
      return {
        ...current,
        leads: current.leads.map((lead) => selected.has(lead.id) ? { ...lead, status } : lead),
        activities: [...changes, ...current.activities],
      };
    });
    announce(`${ids.length} selected leads updated to ${status}.`);
  }, [announce]);

  const assignLeads = useCallback((ids: string[], consultantId: string | null) => {
    if (!ids.length) return;
    setState((current) => {
      const selected = new Set(ids);
      const first = current.leads.find((lead) => selected.has(lead.id));
      return {
        ...current,
        leads: current.leads.map((lead) => selected.has(lead.id) ? { ...lead, assignedConsultantId: consultantId } : lead),
        activities: first ? [activity("assigned", "Leads reassigned", `${ids.length} lead${ids.length === 1 ? "" : "s"} assigned to a new consultant.`, null, consultantId), ...current.activities] : current.activities,
      };
    });
    announce(`${ids.length} lead${ids.length === 1 ? "" : "s"} reassigned. Original referral attribution was preserved.`);
  }, [announce]);

  const addLeadNote = useCallback((leadId: string, text: string) => {
    const cleanText = text.trim();
    if (!cleanText) return;
    const note = { id: id("note"), text: cleanText, createdAt: new Date().toISOString(), author: "Ananya Sharma" };
    setState((current) => {
      const lead = current.leads.find((item) => item.id === leadId);
      if (!lead) return current;
      return {
        ...current,
        leads: current.leads.map((item) => item.id === leadId ? { ...item, notes: [note, ...item.notes] } : item),
        activities: [activity("note-added", "Note added", `${lead.studentName}: ${cleanText}`, leadId, lead.assignedConsultantId), ...current.activities],
      };
    });
    announce("Note added to this lead.");
  }, [announce]);

  const addConsultant = useCallback((draft: ConsultantDraft) => {
    const code = draft.referralCode.trim().toUpperCase();
    if (state.consultants.some((consultant) => consultant.referralCode.toLowerCase() === code.toLowerCase())) throw new Error("That referral code is already in use.");
    const consultantId = id("consultant");
    const consultant: Consultant = { ...draft, referralCode: code, id: consultantId, referralClicks: 0, createdAt: new Date().toISOString() };
    setState((current) => ({ ...current, consultants: [consultant, ...current.consultants], activities: [activity("consultant", "Consultant added", `${consultant.name} was added to the team.`, null, consultantId), ...current.activities] }));
    announce("Consultant added to the local demo data.");
    return consultantId;
  }, [announce, state.consultants]);

  const updateConsultant = useCallback((consultantId: string, draft: ConsultantDraft) => {
    const code = draft.referralCode.trim().toUpperCase();
    if (state.consultants.some((consultant) => consultant.id !== consultantId && consultant.referralCode.toLowerCase() === code.toLowerCase())) throw new Error("That referral code is already in use.");
    setState((current) => ({ ...current, consultants: current.consultants.map((consultant) => consultant.id === consultantId ? { ...consultant, ...draft, id: consultantId, referralCode: code } : consultant) }));
    announce("Consultant details updated.");
  }, [announce, state.consultants]);

  const setConsultantStatus = useCallback((consultantId: string, status: "Active" | "Inactive") => {
    setState((current) => {
      const consultant = current.consultants.find((item) => item.id === consultantId);
      if (!consultant) return current;
      return { ...current, consultants: current.consultants.map((item) => item.id === consultantId ? { ...item, status } : item), activities: [activity("consultant", `Consultant ${status.toLowerCase()}`, `${consultant.name} is now ${status.toLowerCase()}. Historical leads and referrals are unchanged.`, null, consultantId), ...current.activities] };
    });
    announce(`Consultant marked ${status.toLowerCase()}. Historical lead attribution is preserved.`);
  }, [announce]);

  const addFollowUp = useCallback((draft: FollowUpDraft) => {
    const followUpId = draft.id || id("follow-up");
    const createdAt = new Date().toISOString();
    setState((current) => {
      const existing = current.followUps.find((item) => item.id === draft.id);
      const followUp: FollowUp = {
        id: followUpId, leadId: draft.leadId, consultantId: draft.consultantId, date: draft.date, time: draft.time, notes: draft.notes,
        status: existing?.status ?? "Pending", createdAt: existing?.createdAt ?? createdAt, completedAt: existing?.completedAt ?? null,
      };
      const lead = current.leads.find((item) => item.id === draft.leadId);
      return {
        ...current,
        followUps: existing ? current.followUps.map((item) => item.id === followUpId ? followUp : item) : [followUp, ...current.followUps],
        activities: [activity("follow-up", existing ? "Follow-up rescheduled" : "Follow-up scheduled", `${lead?.studentName ?? "Lead"}: ${draft.date} at ${draft.time}.`, draft.leadId, draft.consultantId), ...current.activities],
      };
    });
    announce(draft.id ? "Follow-up rescheduled." : "Follow-up scheduled.");
    return followUpId;
  }, [announce]);

  const updateFollowUp = useCallback((followUpId: string, draft: FollowUpDraft) => {
    setState((current) => {
      const existing = current.followUps.find((item) => item.id === followUpId);
      if (!existing) return current;
      const updated: FollowUp = { ...existing, ...draft, id: followUpId };
      return { ...current, followUps: current.followUps.map((item) => item.id === followUpId ? updated : item), activities: [activity("follow-up", "Follow-up updated", `A follow-up for ${draft.date} at ${draft.time} was updated.`, draft.leadId, draft.consultantId), ...current.activities] };
    });
    announce("Follow-up updated.");
  }, [announce]);

  const completeFollowUp = useCallback((followUpId: string) => {
    setState((current) => {
      const followUp = current.followUps.find((item) => item.id === followUpId);
      if (!followUp || followUp.status === "Completed") return current;
      const lead = current.leads.find((item) => item.id === followUp.leadId);
      return {
        ...current,
        followUps: current.followUps.map((item) => item.id === followUpId ? { ...item, status: "Completed", completedAt: new Date().toISOString() } : item),
        activities: [activity("follow-up", "Follow-up completed", `${lead?.studentName ?? "Lead"} follow-up completed.`, followUp.leadId, followUp.consultantId), ...current.activities],
      };
    });
    announce("Follow-up marked complete.");
  }, [announce]);

  const saveWebsiteContent = useCallback((content: WebsiteContent) => {
    setState((current) => ({ ...current, websiteContent: content, activities: [activity("content", "Website content saved", "Homepage and enquiry form settings were updated in this browser."), ...current.activities] }));
    announce("Website content saved in this browser only.");
  }, [announce]);

  const saveSettings = useCallback((settings: AdminSettings) => {
    setState((current) => ({ ...current, settings, activities: [activity("settings", "Admin settings saved", "Settings were updated in this browser."), ...current.activities] }));
    announce("Settings saved in this browser only.");
  }, [announce]);

  const resetMockData = useCallback(() => {
    setState(createInitialAdminState(initialCourses));
    announce("Demo data has been reset in this browser.");
  }, [announce, initialCourses]);

  const value = useMemo<AdminDataValue>(() => ({
    ...state, sourceCourses: initialCourses, hydrated, notice, announce, addCourse, updateCourse, setCoursePublished, deleteCourse, addLead, updateLead, setLeadStatus, setLeadStatuses, assignLeads, addLeadNote,
    addConsultant, updateConsultant, setConsultantStatus, addFollowUp, updateFollowUp, completeFollowUp,
    saveWebsiteContent, saveSettings, resetMockData,
  }), [state, initialCourses, hydrated, notice, announce, addCourse, updateCourse, setCoursePublished, deleteCourse, addLead, updateLead, setLeadStatus, setLeadStatuses, assignLeads, addLeadNote, addConsultant, updateConsultant, setConsultantStatus, addFollowUp, updateFollowUp, completeFollowUp, saveWebsiteContent, saveSettings, resetMockData]);

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>;
}

export function useAdminData(): AdminDataValue {
  const value = useContext(AdminDataContext);
  if (!value) throw new Error("useAdminData must be used within AdminDataProvider.");
  return value;
}
