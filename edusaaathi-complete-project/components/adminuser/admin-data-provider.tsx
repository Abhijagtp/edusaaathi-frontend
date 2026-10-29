"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { SITE_URL } from "@/lib/config";
import type { Course } from "@/lib/types";
import { slugify } from "@/lib/format";
import type { Activity, AdminSettings, AdminState, Consultant, ConsultantDraft, CourseDraft, Lead, LeadDraft, WebsiteContent } from "@/lib/adminuser/types";
import { interceptedFetch as fetch } from "@/lib/api-client";

type AdminDataValue = AdminState & {
  sourceCourses: Course[];
  hydrated: boolean;
  loading: boolean;
  backendOnline: boolean;
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
  refreshConsultants: () => Promise<void>;
  setLeadStatus: (id: string, status: Lead["status"]) => void;
  setLeadStatuses: (ids: string[], status: Lead["status"]) => void;
  assignLeads: (ids: string[], consultantId: string | null) => void;
  addLeadNote: (leadId: string, text: string) => void;
  addConsultant: (draft: ConsultantDraft) => Promise<{ id: string; initialPassword?: string }>;
  updateConsultant: (id: string, draft: ConsultantDraft) => void;
  setConsultantStatus: (id: string, status: "Active" | "Inactive") => void;
  saveWebsiteContent: (content: WebsiteContent) => void;
  saveSettings: (settings: AdminSettings) => void;
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

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function activityEntry(type: Activity["type"], title: string, description: string, leadId: string | null = null, consultantId: string | null = null): Activity {
  return { id: uid("activity"), leadId, consultantId, type, title, description, createdAt: new Date().toISOString(), actor: "EduSaathi Admin" };
}

function sanitizeLead(l: any): Lead {
  return {
    id: String(l.id || uid("lead")),
    studentName: l.studentName || l.fullName || l.full_name || "Unnamed Student",
    phone: l.phone || l.mobile || l.mobile_number || "",
    email: l.email || "",
    course: l.course || l.courseName || l.course_name || l.course_interest || "General Inquiry",
    source: (l.referral_code || l.referralCode || (typeof l.source === "string" && l.source.toLowerCase().includes("referral"))) ? "Consultant referral" : (l.source || "Website"),
    sourcePage: l.sourcePage || (l.city ? `City: ${l.city}` : "Website Form"),
    referredByConsultantId: l.referredByConsultantId ? String(l.referredByConsultantId) : (l.assigned_consultant ? String(l.assigned_consultant) : null),
    assignedConsultantId: l.assignedConsultantId ? String(l.assignedConsultantId) : (l.assigned_consultant ? String(l.assigned_consultant) : null),
    referralCode: l.referralCode || l.referral_code || null,
    status: l.status || "New",
    notes: Array.isArray(l.notes) ? l.notes : [],
    lastContactedAt: l.lastContactedAt || null,
    createdAt: l.createdAt || l.created_at || new Date().toISOString(),
  };
}

export function AdminDataProvider({ children, initialCourses = [] }: { children: React.ReactNode; initialCourses?: Course[] }) {
  const [state, setState] = useState<AdminState>(emptyState);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [backendOnline, setBackendOnline] = useState(true);
  const [notice, setNotice] = useState("");

  // ──── Initial backend sync on mount ────
  useEffect(() => {
    let cancelled = false;

    async function loadFromBackend() {
      setLoading(true);
      let anySuccess = false;

      try {
        const [leadsRes, consultantsRes, coursesRes] = await Promise.allSettled([
          fetch("/api/admin/leads").then((r) => r.ok ? r.json() : null),
          fetch("/api/admin/consultants").then((r) => r.ok ? r.json() : null),
          fetch("/api/admin/courses").then((r) => r.ok ? r.json() : null),
        ]);

        if (cancelled) return;

        const liveLeads = leadsRes.status === "fulfilled" && Array.isArray(leadsRes.value?.leads)
          ? leadsRes.value.leads.map(sanitizeLead) : null;
        const liveConsultants = consultantsRes.status === "fulfilled" && Array.isArray(consultantsRes.value?.consultants)
          ? consultantsRes.value.consultants : null;
        const liveCourses = coursesRes.status === "fulfilled" && Array.isArray(coursesRes.value?.courses)
          ? coursesRes.value.courses : null;

        if (liveLeads || liveConsultants || liveCourses) {
          anySuccess = true;
        }

        setState((curr) => ({
          ...curr,
          leads: liveLeads ?? [],
          consultants: liveConsultants ?? [],
          courses: liveCourses ?? initialCourses,
        }));

        setBackendOnline(anySuccess);
      } catch {
        setBackendOnline(false);
        // Start with just the courses from SSR, empty leads/consultants
        setState((curr) => ({
          ...curr,
          courses: initialCourses,
        }));
      } finally {
        if (!cancelled) {
          setLoading(false);
          setHydrated(true);
        }
      }
    }

    loadFromBackend();
    return () => { cancelled = true; };
  }, [initialCourses]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 3600);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const announce = useCallback((message: string) => setNotice(message), []);

  // ──── Course CRUD ────
  const addCourse = useCallback((draft: CourseDraft) => {
    const slug = slugify(draft.slug || draft.name);
    if (!slug) throw new Error("Add a valid course name and URL slug.");
    if (state.courses.some((course) => course.slug === slug)) throw new Error("A course with this URL slug already exists.");
    const courseId = uid("course");
    const course: Course = { ...draft, id: courseId, slug, updatedAt: new Date().toISOString() };

    fetch("/api/admin/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    }).then((res) => {
      if (res.ok) return res.json();
    }).then((data) => {
      if (data?.course) {
        setState((curr) => ({
          ...curr,
          courses: curr.courses.map((c) => c.id === courseId ? { ...c, ...data.course, id: data.course.id || courseId } : c),
        }));
      }
    }).catch(() => null);

    setState((current) => ({
      ...current,
      courses: [course, ...current.courses],
      activities: [activityEntry("course", "Course added", `${course.name} was added to the catalog.`), ...current.activities],
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
        activities: [activityEntry("course", "Course updated", `${updated.name} was updated.`), ...current.activities],
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
        activities: [activityEntry("course", published ? "Course marked published" : "Course moved to draft", `${course.name} publication status updated.`), ...current.activities],
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
      activities: [activityEntry("course", "Course removed", `${existing.name} was removed.`), ...current.activities],
    }));
    announce("Course removed.");
  }, [announce, state.courses]);

  // ──── Lead CRUD ────
  const addLead = useCallback((draft: LeadDraft) => {
    const now = new Date().toISOString();
    const leadId = uid("lead");
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
    }).then((res) => {
      if (res.ok) return res.json();
    }).then((data) => {
      if (data?.lead) {
        const synced = sanitizeLead(data.lead);
        setState((curr) => ({
          ...curr,
          leads: curr.leads.map((l) => l.id === leadId ? { ...synced, id: synced.id || leadId } : l),
        }));
      }
    }).catch(() => null);

    setState((current) => ({
      ...current,
      leads: [newLead, ...current.leads],
      activities: [activityEntry("lead-created", "Lead created", `${newLead.studentName} was added to the lead list.`, leadId, newLead.assignedConsultantId), ...current.activities],
    }));
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
      const nextActivities = existing.assignedConsultantId !== updated.assignedConsultantId
        ? [activityEntry("assigned", "Lead reassigned", `${updated.studentName} was reassigned.`, leadId, updated.assignedConsultantId), ...current.activities]
        : current.activities;
      return { ...current, leads: current.leads.map((lead) => lead.id === leadId ? updated : lead), activities: nextActivities };
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
        activities: [
          activityEntry("lead-created", "Lead deleted", `${existing?.studentName || "Lead"} was removed from the database.`),
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
          announce(`Synced ${cleanLeads.length} leads from database.`);
        }
      }
    } catch {
      announce("Failed to sync leads. Backend may be offline.");
    }
  }, [announce]);

  const refreshConsultants = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/consultants", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.consultants)) {
          setState((curr) => ({
            ...curr,
            consultants: data.consultants,
          }));
          announce(`Synced ${data.consultants.length} consultants from database.`);
        }
      }
    } catch {
      announce("Failed to sync consultants. Backend may be offline.");
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
        activities: [activityEntry("status-changed", "Lead status changed", `${lead.studentName} moved from ${lead.status} to ${status}.`, leadId, lead.assignedConsultantId), ...current.activities],
      };
    });
    announce(`Lead status changed to ${status}.`);
  }, [announce]);

  const setLeadStatuses = useCallback((ids: string[], status: Lead["status"]) => {
    if (!ids.length) return;
    const selected = new Set(ids);

    ids.forEach((leadId) => {
      fetch(`/api/admin/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }).catch(() => null);
    });

    setState((current) => {
      const changedLeads = current.leads.filter((lead) => selected.has(lead.id) && lead.status !== status);
      if (!changedLeads.length) return current;
      const changes = changedLeads.map((lead) => activityEntry("status-changed", "Lead status changed", `${lead.studentName} moved from ${lead.status} to ${status}.`, lead.id, lead.assignedConsultantId));
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

    ids.forEach((leadId) => {
      fetch(`/api/admin/leads/${leadId}`, {
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
        activities: first ? [activityEntry("assigned", "Leads reassigned", `${ids.length} lead${ids.length === 1 ? "" : "s"} assigned to a consultant.`, null, consultantId), ...current.activities] : current.activities,
      };
    });
    announce(`${ids.length} lead${ids.length === 1 ? "" : "s"} reassigned.`);
  }, [announce]);

  const addLeadNote = useCallback((leadId: string, text: string) => {
    const cleanText = text.trim();
    if (!cleanText) return;
    const note = { id: uid("note"), text: cleanText, createdAt: new Date().toISOString(), author: "Admin" };

    // Send note to backend
    fetch(`/api/admin/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: cleanText }),
    }).catch(() => null);

    // Optimistically add note to local state
    setState((current) => {
      const lead = current.leads.find((item) => item.id === leadId);
      if (!lead) return current;
      return {
        ...current,
        leads: current.leads.map((item) => item.id === leadId ? { ...item, notes: [note, ...item.notes] } : item),
        activities: [activityEntry("note-added", "Note added", `${lead.studentName}: ${cleanText}`, leadId, lead.assignedConsultantId), ...current.activities],
      };
    });
    announce("Note added to lead.");
  }, [announce]);

  // ──── Consultant CRUD ────
  const addConsultant = useCallback(async (draft: ConsultantDraft) => {
    const code = draft.referralCode.trim().toUpperCase();
    if (state.consultants.some((consultant) => consultant.referralCode.toLowerCase() === code.toLowerCase())) throw new Error("That referral code is already in use.");

    let initialPassword = draft.password || undefined;
    let backendConsultant: any = null;

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
        if (data.initialPassword) initialPassword = data.initialPassword;
        if (data.consultant) backendConsultant = data.consultant;
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create consultant in backend.");
      }
    } catch (e: any) {
      throw new Error(e?.message || "Failed to create consultant. Backend may be offline.");
    }

    const consultantId = backendConsultant?.id ? String(backendConsultant.id) : uid("consultant");
    const consultant: Consultant = {
      ...draft,
      ...(backendConsultant || {}),
      referralCode: backendConsultant?.referralCode || code,
      id: consultantId,
      referralClicks: backendConsultant?.referralClicks || 0,
      createdAt: backendConsultant?.createdAt || new Date().toISOString(),
    };

    setState((current) => ({
      ...current,
      consultants: [consultant, ...current.consultants],
      activities: [activityEntry("consultant", "Consultant added", `${consultant.name} was added.`, null, consultantId), ...current.activities],
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
      return { ...current, consultants: current.consultants.map((item) => item.id === consultantId ? { ...item, status } : item), activities: [activityEntry("consultant", `Consultant ${status.toLowerCase()}`, `${consultant.name} is now ${status.toLowerCase()}.`, null, consultantId), ...current.activities] };
    });
    announce(`Consultant marked ${status.toLowerCase()}.`);
  }, [announce]);

  // ──── Settings & Content ────
  const saveWebsiteContent = useCallback((content: WebsiteContent) => {
    setState((current) => ({ ...current, websiteContent: content, activities: [activityEntry("content", "Website content saved", "Homepage and enquiry form settings were updated."), ...current.activities] }));
    announce("Website content saved.");
  }, [announce]);

  const saveSettings = useCallback((settings: AdminSettings) => {
    setState((current) => ({ ...current, settings, activities: [activityEntry("settings", "Admin settings saved", "Settings were updated."), ...current.activities] }));
    announce("Settings saved.");
  }, [announce]);

  const derivedReferrals = useMemo(() => {
    return state.leads
      .filter((l) => Boolean(l.referralCode || l.source === "Consultant referral" || l.referredByConsultantId))
      .map((l) => {
        const matchingConsultant = state.consultants.find((c) =>
          Boolean(l.referralCode && c.referralCode && l.referralCode.trim().toUpperCase() === c.referralCode.trim().toUpperCase())
          || Boolean(c.userId && l.assignedConsultantId === c.userId)
          || Boolean(c.id && l.assignedConsultantId === c.id)
        );
        return {
          id: `ref-${l.id}`,
          leadId: l.id,
          consultantId: matchingConsultant?.id || l.referredByConsultantId || l.assignedConsultantId || "",
          campaign: l.referralCode ? `Referral (${l.referralCode})` : "Direct Referral",
          createdAt: l.createdAt,
        };
      });
  }, [state.leads, state.consultants]);

  const value = useMemo<AdminDataValue>(() => ({
    ...state,
    referrals: derivedReferrals.length ? derivedReferrals : state.referrals,
    sourceCourses: initialCourses, hydrated, loading, backendOnline, notice, announce, addCourse, updateCourse, setCoursePublished, deleteCourse, addLead, updateLead, deleteLead, refreshLeads, refreshConsultants, setLeadStatus, setLeadStatuses, assignLeads, addLeadNote,
    addConsultant, updateConsultant, setConsultantStatus,
    saveWebsiteContent, saveSettings,
  }), [state, derivedReferrals, initialCourses, hydrated, loading, backendOnline, notice, announce, addCourse, updateCourse, setCoursePublished, deleteCourse, addLead, updateLead, deleteLead, refreshLeads, refreshConsultants, setLeadStatus, setLeadStatuses, assignLeads, addLeadNote, addConsultant, updateConsultant, setConsultantStatus, saveWebsiteContent, saveSettings]);

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>;
}

export function useAdminData(): AdminDataValue {
  const value = useContext(AdminDataContext);
  if (!value) throw new Error("useAdminData must be used within AdminDataProvider.");
  return value;
}
