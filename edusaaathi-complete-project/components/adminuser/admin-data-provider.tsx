"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { SITE_URL } from "@/lib/config";
import type { Course } from "@/lib/types";
import { slugify } from "@/lib/format";
import { ADMIN_STORAGE_KEY, createInitialAdminState } from "@/lib/adminuser/mock-data";
import type { Activity, AdminSettings, AdminState, Consultant, ConsultantDraft, CourseDraft, Lead, LeadDraft, WebsiteContent } from "@/lib/adminuser/types";

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
  deleteLead: (id: string) => void;
  refreshLeads: () => Promise<void>;
  setLeadStatus: (id: string, status: Lead["status"]) => void;
  setLeadStatuses: (ids: string[], status: Lead["status"]) => void;
  assignLeads: (ids: string[], consultantId: string | null) => void;
  addLeadNote: (leadId: string, text: string) => void;
  addConsultant: (draft: ConsultantDraft) => Promise<{ id: string; initialPassword?: string }>;
  updateConsultant: (id: string, draft: ConsultantDraft) => void;
  setConsultantStatus: (id: string, status: "Active" | "Inactive") => void;
  saveWebsiteContent: (content: WebsiteContent) => void;
  saveSettings: (settings: AdminSettings) => void;
  resetMockData: () => void;
};

const emptyState: AdminState = {
  courses: [], leads: [], consultants: [], referrals: [], activities: [],
  websiteContent: {
    homepageHeading: "", homepageDescription: "", contactEmail: "", contactPhone: "", whatsappNumber: "",
    enquiryFormEnabled: true, requireConsent: true, showCourseField: true,
  },
  settings: {
    organizationName: "Edusaaathi Education Consultancy", websiteBaseUrl: SITE_URL, assignmentMethod: "Manual",
    referralCodePrefix: "", referralCookieDays: 30, emailNotifications: true, weeklySummary: false,
  },
};

const AdminDataContext = createContext<AdminDataValue | null>(null);

function id(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function activity(type: Activity["type"], title: string, description: string, leadId: string | null = null, consultantId: string | null = null): Activity {
  return { id: id("activity"), leadId, consultantId, type, title, description, createdAt: new Date().toISOString(), actor: "EduSaathi Admin" };
}

function sanitizeLead(l: any): Lead {
  return {
    id: String(l.id || id("lead")),
    studentName: l.studentName || l.fullName || l.full_name || "Unnamed Student",
    phone: l.phone || l.mobile || l.mobile_number || "",
    email: l.email || "",
    course: l.course || l.courseName || l.course_name || l.course_interest || "General Inquiry",
    source: l.source || "Website",
    sourcePage: l.sourcePage || (l.city ? `City: ${l.city}` : undefined),
    referredByConsultantId: l.referredByConsultantId ? String(l.referredByConsultantId) : null,
    assignedConsultantId: l.assignedConsultantId ? String(l.assignedConsultantId) : null,
    status: l.status || "New",
    notes: Array.isArray(l.notes) ? l.notes : [],
    lastContactedAt: l.lastContactedAt || null,
    createdAt: l.createdAt || l.created_at || new Date().toISOString(),
  };
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
      ? {
          ...initialState,
          ...restored,
          leads: Array.isArray(restored.leads) ? restored.leads.map(sanitizeLead) : initialState.leads,
          courses: Array.isArray(restored.courses) ? restored.courses : initialCourses
        }
      : initialState);
    setHydrated(true);
  }, [initialCourses]);

  // Synchronize live data from Django Backend APIs
  useEffect(() => {
    if (!hydrated) return;

    async function syncBackendData() {
      try {
        const [leadsRes, consultantsRes, coursesRes] = await Promise.allSettled([
          fetch("/api/admin/leads").then((r) => r.ok ? r.json() : null),
          fetch("/api/admin/consultants").then((r) => r.ok ? r.json() : null),
          fetch("/api/admin/courses").then((r) => r.ok ? r.json() : null),
        ]);

        const liveLeads = leadsRes.status === "fulfilled" && Array.isArray(leadsRes.value?.leads) ? leadsRes.value.leads.map(sanitizeLead) : null;
        const liveConsultants = consultantsRes.status === "fulfilled" && consultantsRes.value?.consultants?.length ? consultantsRes.value.consultants : null;
        const liveCourses = coursesRes.status === "fulfilled" && coursesRes.value?.courses?.length ? coursesRes.value.courses : null;

        if (liveLeads || liveConsultants || liveCourses) {
          setState((curr) => ({
            ...curr,
            leads: liveLeads && liveLeads.length > 0 ? liveLeads : curr.leads,
            consultants: liveConsultants && liveConsultants.length > 0 ? liveConsultants : curr.consultants,
            courses: liveCourses && liveCourses.length > 0 ? liveCourses : curr.courses,
          }));
        }
      } catch {
        // Fallback to stored state
      }
    }

    syncBackendData();
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try { window.localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(state)); } catch { /* Local browser storage */ }
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
    
    // Call backend API
    fetch("/api/admin/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    }).catch(() => null);

    setState((current) => ({
      ...current,
      courses: [course, ...current.courses],
      activities: [activity("course", "Course added", `${course.name} was added to the catalog.`), ...current.activities],
    }));
    announce("Course added successfully.");
    return courseId;
  }, [announce, state.courses]);

  const updateCourse = useCallback((courseId: string, draft: CourseDraft) => {
    const slug = slugify(draft.slug || draft.name);
    if (!slug) throw new Error("Add a valid course name and URL slug.");
    if (state.courses.some((course) => course.id !== courseId && course.slug === slug)) throw new Error("A course with this URL slug already exists.");
    
    fetch(`/api/admin/courses/${courseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    }).catch(() => null);

    setState((current) => {
      const existing = current.courses.find((course) => course.id === courseId);
      if (!existing) return current;
      const updated: Course = { ...existing, ...draft, id: courseId, slug, updatedAt: new Date().toISOString() };
      return {
        ...current,
        courses: current.courses.map((course) => course.id === courseId ? updated : course),
        activities: [activity("course", "Course updated", `${updated.name} was updated.`), ...current.activities],
      };
    });
    announce("Course updated successfully.");
  }, [announce, state.courses]);

  const setCoursePublished = useCallback((courseId: string, published: boolean) => {
    fetch(`/api/admin/courses/${courseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published }),
    }).catch(() => null);

    setState((current) => {
      const course = current.courses.find((item) => item.id === courseId);
      if (!course || course.published === published) return current;
      return {
        ...current,
        courses: current.courses.map((item) => item.id === courseId ? { ...item, published, updatedAt: new Date().toISOString() } : item),
        activities: [activity("course", published ? "Course marked published" : "Course moved to draft", `${course.name} publication status updated.`), ...current.activities],
      };
    });
    announce(published ? "Course marked published." : "Course moved to draft.");
  }, [announce]);

  const deleteCourse = useCallback((courseId: string) => {
    const existing = state.courses.find((course) => course.id === courseId);
    if (!existing) return;

    fetch(`/api/admin/courses/${courseId}`, {
      method: "DELETE",
    }).catch(() => null);

    setState((current) => ({
      ...current,
      courses: current.courses.filter((course) => course.id !== courseId),
      activities: [activity("course", "Course removed", `${existing.name} was removed.`), ...current.activities],
    }));
    announce("Course removed.");
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

    fetch("/api/admin/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    }).catch(() => null);

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
    announce("Lead saved.");
    return leadId;
  }, [announce]);

  const updateLead = useCallback((leadId: string, draft: LeadDraft) => {
    fetch(`/api/admin/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    }).catch(() => null);

    setState((current) => {
      const existing = current.leads.find((lead) => lead.id === leadId);
      if (!existing) return current;
      const updated: Lead = { ...existing, ...draft, id: existing.id, createdAt: existing.createdAt, notes: existing.notes };
      let referrals = current.referrals;
      if (existing.referredByConsultantId !== updated.referredByConsultantId) {
        referrals = referrals.filter((referral) => referral.leadId !== leadId);
        if (updated.referredByConsultantId) referrals = [{ id: id("referral"), leadId, consultantId: updated.referredByConsultantId, createdAt: new Date().toISOString(), campaign: "Attribution updated" }, ...referrals];
      }
      const nextActivities = existing.assignedConsultantId !== updated.assignedConsultantId
        ? [activity("assigned", "Lead reassigned", `${updated.studentName} was reassigned.`, leadId, updated.assignedConsultantId), ...current.activities]
        : current.activities;
      return { ...current, leads: current.leads.map((lead) => lead.id === leadId ? updated : lead), referrals, activities: nextActivities };
    });
    announce("Lead updated.");
  }, [announce]);

  const deleteLead = useCallback((leadId: string) => {
    fetch(`/api/admin/leads/${leadId}`, {
      method: "DELETE",
    }).catch(() => null);

    setState((current) => {
      const existing = current.leads.find((lead) => lead.id === leadId);
      return {
        ...current,
        leads: current.leads.filter((lead) => lead.id !== leadId),
        referrals: current.referrals.filter((referral) => referral.leadId !== leadId),
        activities: [
          activity("lead-created", "Lead deleted", `${existing?.studentName || "Lead"} was removed from the database.`),
          ...current.activities,
        ],
      };
    });
    announce("Lead deleted successfully.");
  }, [announce]);

  const refreshLeads = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/leads", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.leads)) {
          const cleanLeads = data.leads.map(sanitizeLead);
          setState((curr) => ({
            ...curr,
            leads: cleanLeads,
          }));
          announce(`Synced ${cleanLeads.length} leads with PostgreSQL.`);
        }
      }
    } catch {
      // ignore
    }
  }, [announce]);

  const setLeadStatus = useCallback((leadId: string, status: Lead["status"]) => {
    fetch(`/api/admin/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch(() => null);

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

    ids.forEach((id) => {
      fetch(`/api/admin/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }).catch(() => null);
    });

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
    const selected = new Set(ids);

    ids.forEach((id) => {
      fetch(`/api/admin/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedConsultantId: consultantId }),
      }).catch(() => null);
    });

    setState((current) => {
      const first = current.leads.find((lead) => selected.has(lead.id));
      return {
        ...current,
        leads: current.leads.map((lead) => selected.has(lead.id) ? { ...lead, assignedConsultantId: consultantId } : lead),
        activities: first ? [activity("assigned", "Leads reassigned", `${ids.length} lead${ids.length === 1 ? "" : "s"} assigned to a consultant.`, null, consultantId), ...current.activities] : current.activities,
      };
    });
    announce(`${ids.length} lead${ids.length === 1 ? "" : "s"} reassigned.`);
  }, [announce]);

  const addLeadNote = useCallback((leadId: string, text: string) => {
    const cleanText = text.trim();
    if (!cleanText) return;
    const note = { id: id("note"), text: cleanText, createdAt: new Date().toISOString(), author: "Admin" };

    fetch(`/api/admin/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: cleanText }),
    }).catch(() => null);

    setState((current) => {
      const lead = current.leads.find((item) => item.id === leadId);
      if (!lead) return current;
      return {
        ...current,
        leads: current.leads.map((item) => item.id === leadId ? { ...item, notes: [note, ...item.notes] } : item),
        activities: [activity("note-added", "Note added", `${lead.studentName}: ${cleanText}`, leadId, lead.assignedConsultantId), ...current.activities],
      };
    });
    announce("Note added to lead.");
  }, [announce]);

  const addConsultant = useCallback(async (draft: ConsultantDraft) => {
    const code = draft.referralCode.trim().toUpperCase();
    if (state.consultants.some((consultant) => consultant.referralCode.toLowerCase() === code.toLowerCase())) throw new Error("That referral code is already in use.");
    const consultantId = id("consultant");
    const consultant: Consultant = { ...draft, referralCode: code, id: consultantId, referralClicks: 0, createdAt: new Date().toISOString() };

    let initialPassword = draft.password || undefined;

    try {
      const res = await fetch("/api/admin/consultants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name,
          email: draft.email,
          phone: draft.phone,
          password: draft.password,
          referralCode: code,
          agencyName: "Education Consultancy",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.initialPassword) {
          initialPassword = data.initialPassword;
        }
        if (data.consultant) {
          setState((curr) => ({
            ...curr,
            consultants: curr.consultants.map((c) => c.id === consultantId ? { ...c, ...data.consultant } : c),
          }));
        }
      }
    } catch {
      // Backend sync fallback
    }

    setState((current) => ({
      ...current,
      consultants: [consultant, ...current.consultants],
      activities: [activity("consultant", "Consultant added", `${consultant.name} was added.`, null, consultantId), ...current.activities]
    }));
    announce(`Consultant ${consultant.name} added successfully.`);
    return { id: consultantId, initialPassword };
  }, [announce, state.consultants]);

  const updateConsultant = useCallback((consultantId: string, draft: ConsultantDraft) => {
    const code = draft.referralCode.trim().toUpperCase();
    if (state.consultants.some((consultant) => consultant.id !== consultantId && consultant.referralCode.toLowerCase() === code.toLowerCase())) throw new Error("That referral code is already in use.");
    
    fetch(`/api/admin/consultants/${consultantId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    }).catch(() => null);

    setState((current) => ({ ...current, consultants: current.consultants.map((consultant) => consultant.id === consultantId ? { ...consultant, ...draft, id: consultantId, referralCode: code } : consultant) }));
    announce("Consultant details updated.");
  }, [announce, state.consultants]);

  const setConsultantStatus = useCallback((consultantId: string, status: "Active" | "Inactive") => {
    fetch(`/api/admin/consultants/${consultantId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch(() => null);

    setState((current) => {
      const consultant = current.consultants.find((item) => item.id === consultantId);
      if (!consultant) return current;
      return { ...current, consultants: current.consultants.map((item) => item.id === consultantId ? { ...item, status } : item), activities: [activity("consultant", `Consultant ${status.toLowerCase()}`, `${consultant.name} is now ${status.toLowerCase()}.`, null, consultantId), ...current.activities] };
    });
    announce(`Consultant marked ${status.toLowerCase()}.`);
  }, [announce]);

  const saveWebsiteContent = useCallback((content: WebsiteContent) => {
    setState((current) => ({ ...current, websiteContent: content, activities: [activity("content", "Website content saved", "Homepage and enquiry form settings were updated."), ...current.activities] }));
    announce("Website content saved.");
  }, [announce]);

  const saveSettings = useCallback((settings: AdminSettings) => {
    setState((current) => ({ ...current, settings, activities: [activity("settings", "Admin settings saved", "Settings were updated."), ...current.activities] }));
    announce("Settings saved.");
  }, [announce]);

  const resetMockData = useCallback(() => {
    setState(createInitialAdminState(initialCourses));
    announce("Demo data has been reset.");
  }, [announce, initialCourses]);

  const value = useMemo<AdminDataValue>(() => ({
    ...state, sourceCourses: initialCourses, hydrated, notice, announce, addCourse, updateCourse, setCoursePublished, deleteCourse, addLead, updateLead, deleteLead, refreshLeads, setLeadStatus, setLeadStatuses, assignLeads, addLeadNote,
    addConsultant, updateConsultant, setConsultantStatus,
    saveWebsiteContent, saveSettings, resetMockData,
  }), [state, initialCourses, hydrated, notice, announce, addCourse, updateCourse, setCoursePublished, deleteCourse, addLead, updateLead, deleteLead, refreshLeads, setLeadStatus, setLeadStatuses, assignLeads, addLeadNote, addConsultant, updateConsultant, setConsultantStatus, saveWebsiteContent, saveSettings, resetMockData]);

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>;
}

export function useAdminData(): AdminDataValue {
  const value = useContext(AdminDataContext);
  if (!value) throw new Error("useAdminData must be used within AdminDataProvider.");
  return value;
}
