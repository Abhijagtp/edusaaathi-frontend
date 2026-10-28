import { SITE_URL } from "@/lib/config";
/** Replaceable client-side service boundary for the consultant portal demo. UI components consume it through ConsultantProvider; this is not a backend or authorization layer. */
import {
  CONSULTANT_LEAD_STATUSES,
  type ConsultantActivity, type ConsultantLead, type ConsultantLeadStatus,
  type ConsultantLeadUpdate, type ConsultantNote, type ConsultantPortalState, type ConsultantProfileDraft, type ReferralLeadSummary,
} from "./types";

/** Mock identity for this frontend prototype. Production identity must come from the authenticated DRF session. */
export const MOCK_CONSULTANT_ID = "consultant-rahul";
export const CONSULTANT_STORAGE_KEY = "edusathi-consultant-portal-mock-v1";

function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function dateTimeAt(offset: number, hour: number, minute = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

export function consultantLocalDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : localDateKey(date);
}

export function consultantLocalTime(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

/** Normalize Indian mobile numbers once for `tel:`/`wa.me`; 10-digit local numbers get +91. */
export function normalizeConsultantPhone(phone?: string | null): string | null {
  if (!phone || typeof phone !== "string") return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  let normalized = digits;
  if (normalized.startsWith("0091")) normalized = normalized.slice(2);
  if (normalized.startsWith("0") && normalized.length === 11) normalized = normalized.slice(1);
  if (normalized.length === 10) normalized = `91${normalized}`;
  if (normalized.length < 11 || normalized.length > 15) return null;
  return `+${normalized}`;
}

export function getConsultantPhoneHref(phone?: string | null): string | null {
  const normalized = normalizeConsultantPhone(phone);
  return normalized ? `tel:${normalized}` : null;
}

export function getConsultantWhatsAppHref(phone?: string | null, studentName?: string | null, course?: string | null, consultantName?: string | null): string | null {
  const normalized = normalizeConsultantPhone(phone);
  if (!normalized) return null;
  const name = (studentName && typeof studentName === "string" ? studentName.trim() : "") || "there";
  const firstName = name.split(/\s+/)[0] || name;
  const cName = (consultantName && typeof consultantName === "string" ? consultantName.trim() : "") || "Consultant";
  const courseName = (course && typeof course === "string" ? course.trim() : "") || "courses";
  const message = `Hi ${firstName}, this is ${cName} from Edusaaathi regarding your interest in ${courseName}. Let me know a suitable time to connect.`;
  return `https://wa.me/${normalized.replace(/^\+/, "")}?text=${encodeURIComponent(message)}`;
}

type LeadSeed = {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  interestedCourse: string;
  source: ConsultantLead["source"];
  referrer: "rahul" | "aditi" | null;
  status: ConsultantLeadStatus;
  age: number;
  contactedAge: number | null;
  convertedAge?: number;
  city: string;
  education: string;
  note?: string;
};

const leadSeeds: LeadSeed[] = [
  { id: "lead-2101", fullName: "Riya Shah", phone: "+91 98201 44011", email: "riya.shah@example.com", interestedCourse: "BCA", source: "Website", referrer: null, status: "New", age: 2, contactedAge: null, city: "Mumbai", education: "Class 12 · Commerce", note: "Asked for the upcoming intake timeline." },
  { id: "lead-2102", fullName: "Rohan Verma", phone: "+91 98702 33114", email: "rohan.verma@example.com", interestedCourse: "MBA", source: "Consultant referral", referrer: "rahul", status: "Contacted", age: 7, contactedAge: 3, city: "Pune", education: "B.Com · 2024", note: "Prefers a call after 6 PM." },
  { id: "lead-2103", fullName: "Myra Iyer", phone: "+91 97690 85216", email: "myra.iyer@example.com", interestedCourse: "BBA", source: "Website", referrer: null, status: "In progress", age: 11, contactedAge: 8, city: "Thane", education: "Class 12 · Arts", note: "Compare the BBA and integrated management options." },
  { id: "lead-2104", fullName: "Kabir Nair", phone: "+91 98920 71104", email: "kabir.nair@example.com", interestedCourse: "MCA", source: "Consultant referral", referrer: "rahul", status: "Converted", age: 24, contactedAge: 15, convertedAge: 12, city: "Navi Mumbai", education: "B.Sc. IT · 2025", note: "Admission documents received." },
  { id: "lead-2105", fullName: "Sana Kapoor", phone: "+91 98193 27108", email: "sana.kapoor@example.com", interestedCourse: "B.Com", source: "WhatsApp", referrer: null, status: "Contacted", age: 31, contactedAge: 25, city: "Mumbai", education: "Class 12 · Commerce" },
  { id: "lead-2106", fullName: "Arjun Rao", phone: "+91 99204 09117", email: "arjun.rao@example.com", interestedCourse: "B.Tech", source: "Walk-in", referrer: null, status: "Lost", age: 45, contactedAge: 39, city: "Panvel", education: "Diploma · Engineering", note: "Chose a different programme this intake." },
  { id: "lead-2107", fullName: "Priya Menon", phone: "+91 98670 14520", email: "priya.menon@example.com", interestedCourse: "BA Psychology", source: "Education fair", referrer: null, status: "New", age: 53, contactedAge: null, city: "Mumbai", education: "Class 12 · Humanities" },
  { id: "lead-2108", fullName: "Dev Patel", phone: "+91 98331 56222", email: "dev.patel@example.com", interestedCourse: "BCA", source: "Consultant referral", referrer: "aditi", status: "In progress", age: 68, contactedAge: 60, city: "Surat", education: "Class 12 · Science", note: "Waiting for a fee comparison." },
  { id: "lead-2109", fullName: "Ananya Desai", phone: "+91 98198 43027", email: "ananya.desai@example.com", interestedCourse: "MBA", source: "Website", referrer: null, status: "Contacted", age: 81, contactedAge: 75, city: "Mumbai", education: "BBA · 2023" },
  { id: "lead-2110", fullName: "Ishita Kulkarni", phone: "+91 99201 74108", email: "ishita.kulkarni@example.com", interestedCourse: "BBA", source: "Consultant referral", referrer: "rahul", status: "Converted", age: 99, contactedAge: 91, convertedAge: 86, city: "Pune", education: "Class 12 · Commerce", note: "Enrolled for the July intake." },
  { id: "lead-2111", fullName: "Omkar Shah", phone: "+91 98202 63041", email: "omkar.shah@example.com", interestedCourse: "B.Sc. IT", source: "Website", referrer: null, status: "In progress", age: 117, contactedAge: 109, city: "Mumbai", education: "Class 12 · Science" },
  { id: "lead-2112", fullName: "Tara Nair", phone: "+91 98675 51638", email: "tara.nair@example.com", interestedCourse: "MCA", source: "Consultant referral", referrer: "rahul", status: "Contacted", age: 132, contactedAge: 124, city: "Navi Mumbai", education: "BCA · 2025" },
  { id: "lead-2113", fullName: "Vihaan Iyer", phone: "+91 97691 80355", email: "vihaan.iyer@example.com", interestedCourse: "BCA", source: "Website", referrer: null, status: "New", age: 153, contactedAge: null, city: "Thane", education: "Class 12 · Science" },
  { id: "lead-2114", fullName: "Zoya Sheikh", phone: "+91 98925 19064", email: "zoya.sheikh@example.com", interestedCourse: "MBA", source: "Consultant referral", referrer: "rahul", status: "Converted", age: 176, contactedAge: 167, convertedAge: 163, city: "Mumbai", education: "B.Com · 2023", note: "Joined the weekend MBA cohort." },
  { id: "lead-2115", fullName: "Saanvi Rao", phone: "+91 98207 46291", email: "saanvi.rao@example.com", interestedCourse: "B.Com", source: "Website", referrer: null, status: "Lost", age: 197, contactedAge: 189, city: "Nashik", education: "Class 12 · Commerce" },
  { id: "lead-2116", fullName: "Neil Bhat", phone: "+91 98191 30744", email: "neil.bhat@example.com", interestedCourse: "B.Tech", source: "Consultant referral", referrer: "rahul", status: "Contacted", age: 221, contactedAge: 212, city: "Mumbai", education: "Diploma · Computer Engineering" },
];

function createLead(seed: LeadSeed): ConsultantLead {
  const createdAt = dateTimeAt(-seed.age, 10 + (seed.age % 7), 20);
  const lastContactedAt = seed.contactedAge === null ? null : dateTimeAt(-seed.contactedAge, 15, 10);
  return {
    id: seed.id,
    fullName: seed.fullName,
    phone: seed.phone,
    email: seed.email,
    interestedCourse: seed.interestedCourse,
    source: seed.source,
    referralCode: seed.referrer === "rahul" ? "RAHUL01" : seed.referrer === "aditi" ? "ADITI02" : null,
    referredByConsultantId: seed.referrer === "rahul" ? MOCK_CONSULTANT_ID : seed.referrer === "aditi" ? "consultant-aditi" : null,
    referredByConsultantName: seed.referrer === "rahul" ? "Rahul Mehta" : seed.referrer === "aditi" ? "Aditi Shah" : null,
    assignedConsultantId: MOCK_CONSULTANT_ID,
    status: seed.status,
    createdAt,
    lastContactedAt,
    convertedAt: seed.convertedAge === undefined ? null : dateTimeAt(-seed.convertedAge, 12, 10),
    updatedAt: lastContactedAt ?? createdAt,
    city: seed.city,
    educationalBackground: seed.education,
    notes: seed.note ? [{ id: `${seed.id}-note-1`, text: seed.note, createdAt: dateTimeAt(-Math.max(0, seed.contactedAge ?? seed.age - 1), 16), author: "Rahul Mehta" }] : [],
  };
}

function referralOnlySummary(id: string, fullName: string, age: number, interestedCourse: string, currentStatus: ConsultantLeadStatus): ReferralLeadSummary {
  return { id, fullName, capturedAt: dateTimeAt(-age, 9, 40), interestedCourse, currentStatus, authorizedLeadId: null };
}

function makeActivity(id: string, leadId: string, activityType: ConsultantActivity["activityType"], description: string, offset: number, hour: number): ConsultantActivity {
  return { id, leadId, actorName: "Rahul Mehta", activityType, description, createdAt: dateTimeAt(-offset, hour, 15) };
}

export function createInitialConsultantState(): ConsultantPortalState {
  const profile = {
    id: MOCK_CONSULTANT_ID,
    fullName: "Rahul Mehta",
    email: "rahul.mehta@edusathi.example",
    phone: "+91 98765 01001",
    referralCode: "RAHUL01",
    isActive: true,
    createdAt: dateTimeAt(-245, 10, 0),
  };
  const leads = leadSeeds.map(createLead);
  const leadMap = new Map(leads.map((lead) => [lead.id, lead]));
  const referralLeads = [
    ...leads.filter((lead) => lead.referredByConsultantId === profile.id).map((lead) => ({
      id: `ref-${lead.id}`,
      fullName: lead.fullName,
      capturedAt: lead.createdAt,
      interestedCourse: lead.interestedCourse,
      currentStatus: lead.status,
      authorizedLeadId: lead.assignedConsultantId === profile.id ? lead.id : null,
    })),
    referralOnlySummary("referral-3001", "Aarav Desai", 16, "BCA", "New"),
    referralOnlySummary("referral-3002", "Meera Patel", 43, "MBA", "Converted"),
    referralOnlySummary("referral-3003", "Siddhi Kamat", 67, "B.Com", "In progress"),
  ].sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));

  const activities: ConsultantActivity[] = [
    makeActivity("activity-2101", "lead-2101", "lead-assigned", "A new BCA enquiry was assigned to you.", 0, 9),
    makeActivity("activity-2103", "lead-2103", "note-added", "Counselor note logged for Myra Iyer.", 1, 15),
    makeActivity("activity-2102", "lead-2102", "note-added", "Initial MBA discovery call note logged.", 2, 17),
    makeActivity("activity-2104", "lead-2104", "lead-converted", "Kabir confirmed his MCA admission.", 12, 13),
    makeActivity("activity-2108", "lead-2108", "note-added", "Shared updated fee comparison note.", 1, 13),
    makeActivity("activity-2110", "lead-2110", "lead-converted", "Ishita enrolled for the July BBA intake.", 86, 12),
    makeActivity("activity-2114", "lead-2114", "lead-converted", "Zoya joined the weekend MBA cohort.", 163, 12),
    makeActivity("activity-2116", "lead-2116", "lead-assigned", "A B.Tech enquiry was added to your queue.", 212, 10),
  ].filter((item) => leadMap.has(item.leadId));

  return { profile, leads, referralLeads, activities };
}

/** Validate persisted mock data and re-scope it to the one mock consultant before exposing it to the UI. */
export function restoreConsultantState(raw: unknown): ConsultantPortalState {
  const seed = createInitialConsultantState();
  if (!raw || typeof raw !== "object") return seed;
  const saved = raw as Partial<ConsultantPortalState>;
  if (!saved.profile || saved.profile.id !== MOCK_CONSULTANT_ID || !Array.isArray(saved.leads)) return seed;
  const allowedLeadIds = new Set(seed.leads.map((lead) => lead.id));
  const leads = saved.leads.filter((lead): lead is ConsultantLead => Boolean(
    lead && typeof lead === "object" && allowedLeadIds.has(lead.id) && lead.assignedConsultantId === MOCK_CONSULTANT_ID,
  )).map((lead) => {
    const original = seed.leads.find((item) => item.id === lead.id)!;
    const status = CONSULTANT_LEAD_STATUSES.includes(lead.status) ? lead.status : original.status;
    const notes = Array.isArray(lead.notes) ? lead.notes.filter((note) => note && typeof note.text === "string").map((note) => ({
      id: typeof note.id === "string" ? note.id : `note-${Math.random().toString(36).slice(2, 8)}`,
      text: note.text.slice(0, 1200),
      author: typeof note.author === "string" ? note.author.slice(0, 80) : seed.profile.fullName,
      createdAt: typeof note.createdAt === "string" ? note.createdAt : new Date().toISOString(),
    })) : original.notes;
    return {
      ...original,
      status,
      lastContactedAt: lead.lastContactedAt === null || typeof lead.lastContactedAt === "string" ? lead.lastContactedAt : original.lastContactedAt,
      convertedAt: status === "Converted" ? (typeof lead.convertedAt === "string" ? lead.convertedAt : original.convertedAt) : null,
      updatedAt: typeof lead.updatedAt === "string" ? lead.updatedAt : original.updatedAt,
      notes,
    };
  });
  const leadIds = new Set(leads.map((lead) => lead.id));
  const referralLeads = seed.referralLeads.map((item) => {
    const lead = item.authorizedLeadId ? leads.find((candidate) => candidate.id === item.authorizedLeadId) : undefined;
    return lead ? { ...item, currentStatus: lead.status } : item;
  });
  const activities = Array.isArray(saved.activities) ? saved.activities.filter((item): item is ConsultantActivity => Boolean(
    item && typeof item === "object" && leadIds.has(item.leadId) && typeof item.description === "string",
  )) : seed.activities;
  const allowedProfile = saved.profile;
  return {
    profile: {
      ...seed.profile,
      fullName: typeof allowedProfile.fullName === "string" ? allowedProfile.fullName.slice(0, 80) : seed.profile.fullName,
      email: typeof allowedProfile.email === "string" ? allowedProfile.email.slice(0, 160) : seed.profile.email,
      phone: typeof allowedProfile.phone === "string" ? allowedProfile.phone.slice(0, 24) : seed.profile.phone,
    },
    leads,
    referralLeads,
    activities,
  };
}

function pushActivity(state: ConsultantPortalState, leadId: string, activityType: ConsultantActivity["activityType"], description: string): ConsultantActivity[] {
  const item: ConsultantActivity = {
    id: `activity-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    leadId,
    actorName: state.profile.fullName,
    activityType,
    description,
    createdAt: new Date().toISOString(),
  };
  return [item, ...state.activities].slice(0, 120);
}

export function getMyLeads(state: ConsultantPortalState): ConsultantLead[] {
  return state.leads.filter((lead) => lead.assignedConsultantId === state.profile.id).slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getMyLeadById(state: ConsultantPortalState, id: string): ConsultantLead | null {
  return state.leads.find((lead) => lead.id === id && lead.assignedConsultantId === state.profile.id) ?? null;
}

export function updateMyLeadState(state: ConsultantPortalState, id: string, updates: ConsultantLeadUpdate): ConsultantPortalState {
  const lead = getMyLeadById(state, id);
  if (!lead) throw new Error("This lead is not assigned to your consultant account.");
  const now = new Date().toISOString();
  const updated: ConsultantLead = {
    ...lead,
    ...updates,
    updatedAt: now,
    convertedAt: updates.status === "Converted" ? (lead.convertedAt ?? now) : updates.status && lead.status === "Converted" ? null : lead.convertedAt,
    lastContactedAt: updates.status === "Contacted" && !updates.lastContactedAt ? now : updates.lastContactedAt ?? lead.lastContactedAt,
  };
  const activities = updates.status && updates.status !== lead.status
    ? pushActivity(state, id, updates.status === "Converted" ? "lead-converted" : "status-updated", `${lead.fullName} moved from ${lead.status} to ${updates.status}.`)
    : state.activities;
  const referralLeads = state.referralLeads.map((item) => item.authorizedLeadId === id ? { ...item, currentStatus: updated.status } : item);
  return { ...state, leads: state.leads.map((item) => item.id === id ? updated : item), referralLeads, activities };
}

export function addMyLeadNoteState(state: ConsultantPortalState, id: string, text: string): ConsultantPortalState {
  const lead = getMyLeadById(state, id);
  const clean = text.trim();
  if (!lead) throw new Error("This lead is not assigned to your consultant account.");
  if (!clean) throw new Error("Enter a note before saving.");
  const note: ConsultantNote = { id: `note-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`, text: clean.slice(0, 1200), createdAt: new Date().toISOString(), author: state.profile.fullName };
  return {
    ...state,
    leads: state.leads.map((item) => item.id === id ? { ...item, notes: [note, ...item.notes], updatedAt: note.createdAt } : item),
    activities: pushActivity(state, id, "note-added", `Added a note to ${lead.fullName}'s record.`),
  };
}

export function updateMyProfileState(state: ConsultantPortalState, draft: ConsultantProfileDraft): ConsultantPortalState {
  const fullName = draft.fullName.trim();
  const email = draft.email.trim().toLowerCase();
  const phone = draft.phone.trim();
  if (fullName.length < 2) throw new Error("Enter your full name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address.");
  if (!normalizeConsultantPhone(phone)) throw new Error("Enter a valid Indian phone number.");
  return { ...state, profile: { ...state.profile, fullName, email, phone } };
}

export function getMyReferralStats(state: ConsultantPortalState, origin?: string) {
  const referrals = state.referralLeads;
  const converted = referrals.filter((lead) => lead.currentStatus === "Converted").length;
  const inProgress = referrals.filter((lead) => lead.currentStatus === "In progress" || lead.currentStatus === "Contacted").length;
  const baseUrl = (origin && origin.trim()) || (typeof window !== "undefined" ? window.location.origin : SITE_URL);
  return {
    total: referrals.length,
    newLeads: referrals.filter((lead) => lead.currentStatus === "New").length,
    inProgress,
    converted,
    conversionRate: referrals.length ? Math.round((converted / referrals.length) * 100) : 0,
    referralUrl: `${baseUrl}/courses?ref=${encodeURIComponent(state.profile.referralCode)}`,
  };
}

export function getMyDashboard(state: ConsultantPortalState, now = new Date()) {
  const leads = getMyLeads(state);
  const totalNotes = leads.reduce((sum, lead) => sum + (lead.notes?.length || 0), 0);
  const referralStats = getMyReferralStats(state);
  const pipeline = CONSULTANT_LEAD_STATUSES.map((status) => ({
    status,
    count: leads.filter((lead) => lead.status === status).length,
  }));
  return {
    totalAssigned: leads.length,
    newLeads: leads.filter((lead) => lead.status === "New").length,
    notesLogged: totalNotes,
    converted: leads.filter((lead) => lead.status === "Converted").length,
    referralLeads: referralStats.total,
    conversionRate: leads.length ? Math.round((leads.filter((lead) => lead.status === "Converted").length / leads.length) * 100) : 0,
    pipeline,
    recentLeads: leads.slice(0, 8),
    referralStats,
    recentActivities: state.activities.filter((item) => leads.some((lead) => lead.id === item.leadId)).slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8),
  };
}

function inDateRange(value: string | null | undefined, start: Date): boolean {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date >= start;
}

export function getMyPerformance(state: ConsultantPortalState, rangeDays = 180, now = new Date()) {
  const start = new Date(now);
  start.setDate(start.getDate() - rangeDays + 1);
  const leadsInRange = state.leads.filter((lead) => inDateRange(lead.createdAt, start));
  const contactedInRange = leadsInRange.filter((lead) => Boolean(lead.lastContactedAt)).length;
  const convertedInRange = leadsInRange.filter((lead) => lead.status === "Converted").length;
  const referralsInRange = state.referralLeads.filter((lead) => inDateRange(lead.capturedAt, start));
  const notesLoggedInRange = leadsInRange.reduce((sum, lead) => sum + (lead.notes?.length || 0), 0);
  const months = Array.from({ length: 6 }, (_, index) => {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const nextMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
    const inMonth = (value: string | null | undefined) => {
      if (!value) return false;
      const date = new Date(value);
      return date >= monthStart && date < nextMonth;
    };
    const assignedCohort = state.leads.filter((lead) => inMonth(lead.createdAt));
    const referralCohort = state.referralLeads.filter((lead) => inMonth(lead.capturedAt));
    return {
      key: `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, "0")}`,
      label: new Intl.DateTimeFormat("en-IN", { month: "short" }).format(monthStart),
      assigned: assignedCohort.length,
      contacted: assignedCohort.filter((lead) => Boolean(lead.lastContactedAt)).length,
      converted: assignedCohort.filter((lead) => lead.status === "Converted").length,
      notesLogged: assignedCohort.reduce((sum, lead) => sum + (lead.notes?.length || 0), 0),
      referralLeads: referralCohort.length,
      referralConverted: referralCohort.filter((lead) => lead.currentStatus === "Converted").length,
    };
  });
  const statusDistribution = CONSULTANT_LEAD_STATUSES.map((status) => ({
    status,
    count: leadsInRange.filter((lead) => lead.status === status).length,
  }));
  return {
    rangeDays,
    totalAssigned: leadsInRange.length,
    contacted: contactedInRange,
    converted: convertedInRange,
    conversionRate: leadsInRange.length ? Math.round((convertedInRange / leadsInRange.length) * 100) : 0,
    referralLeads: referralsInRange.length,
    notesLogged: notesLoggedInRange,
    months,
    statusDistribution,
    leadsInRange,
    referralsInRange,
  };
}

export function syncReferralStatus(referrals: ReferralLeadSummary[], lead: ConsultantLead): ReferralLeadSummary[] {
  return referrals.map((item) => item.authorizedLeadId === lead.id ? { ...item, currentStatus: lead.status } : item);
}
