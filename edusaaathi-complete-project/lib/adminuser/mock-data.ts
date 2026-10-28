import { SITE_URL } from "@/lib/config";
import type { Course } from "@/lib/types";
import type { Activity, AdminSettings, AdminState, Consultant, Lead, LeadSource, LeadStatus, Referral, WebsiteContent } from "./types";

export const ADMIN_STORAGE_KEY = "edusathi-adminuser-mock-v1";
export const ADMINISTRATOR_NAME = "Ananya Sharma";

export const COURSE_OPTIONS = ["BCA", "BBA", "MBA", "B.Tech", "MCA", "B.Com", "B.Sc. IT", "BA Psychology"];
export const LEAD_STATUSES: LeadStatus[] = ["New", "Contacted", "In progress", "Converted", "Lost"];
export const LEAD_SOURCES: LeadSource[] = ["Website", "Consultant referral", "WhatsApp", "Walk-in", "Education fair"];

function toLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function shiftedDate(days: number, hour = 11, minute = 30): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

export function localDateString(date = new Date()): string {
  return toLocalDate(date);
}

export function dateOffset(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toLocalDate(date);
}

const consultants: Consultant[] = [
  { id: "consultant-rahul", name: "Rahul Mehta", email: "rahul.mehta@edusathi.example", phone: "+91 98765 01001", referralCode: "RAHUL01", status: "Active", referralClicks: 426, createdAt: shiftedDate(-210) },
  { id: "consultant-aditi", name: "Aditi Shah", email: "aditi.shah@edusathi.example", phone: "+91 98765 01002", referralCode: "ADITI02", status: "Active", referralClicks: 318, createdAt: shiftedDate(-186) },
  { id: "consultant-priya", name: "Priya Iyer", email: "priya.iyer@edusathi.example", phone: "+91 98765 01003", referralCode: "PRIYA03", status: "Active", referralClicks: 277, createdAt: shiftedDate(-153) },
  { id: "consultant-vivek", name: "Vivek Nair", email: "vivek.nair@edusathi.example", phone: "+91 98765 01004", referralCode: "VIVEK04", status: "Active", referralClicks: 198, createdAt: shiftedDate(-126) },
  { id: "consultant-neha", name: "Neha Kulkarni", email: "neha.kulkarni@edusathi.example", phone: "+91 98765 01005", referralCode: "NEHA05", status: "Inactive", referralClicks: 156, createdAt: shiftedDate(-98) },
];

const leadSeed: Array<{
  id: string; studentName: string; phone: string; email: string; course: string; source: LeadSource;
  page: string; referrer: string | null; assignee: string | null; status: LeadStatus; age: number;
  contacted: number | null; city: string; note?: string;
}> = [
  { id: "lead-1001", studentName: "Aarav Patel", phone: "+91 98765 11001", email: "aarav.patel@example.com", course: "BCA", source: "Website", page: "/courses/bca", referrer: null, assignee: "consultant-aditi", status: "New", age: 0, contacted: null, city: "Mumbai", note: "Asked about eligibility after Class 12." },
  { id: "lead-1002", studentName: "Sana Khan", phone: "+91 98765 11002", email: "sana.khan@example.com", course: "MBA", source: "Consultant referral", page: "/apply", referrer: "consultant-rahul", assignee: "consultant-priya", status: "Contacted", age: 1, contacted: 0, city: "Pune", note: "Prefers an evening call." },
  { id: "lead-1003", studentName: "Ishita Desai", phone: "+91 98765 11003", email: "ishita.desai@example.com", course: "B.Tech", source: "Website", page: "/courses/b-tech", referrer: null, assignee: null, status: "New", age: 1, contacted: null, city: "Ahmedabad" },
  { id: "lead-1004", studentName: "Kabir Rao", phone: "+91 98765 11004", email: "kabir.rao@example.com", course: "MCA", source: "WhatsApp", page: "/", referrer: null, assignee: "consultant-vivek", status: "In progress", age: 2, contacted: 1, city: "Bengaluru", note: "Requested a call after 5 PM." },
  { id: "lead-1005", studentName: "Meera Nair", phone: "+91 98765 11005", email: "meera.nair@example.com", course: "BBA", source: "Consultant referral", page: "/apply", referrer: "consultant-aditi", assignee: "consultant-rahul", status: "Converted", age: 3, contacted: 2, city: "Navi Mumbai" },
  { id: "lead-1006", studentName: "Vivaan Joshi", phone: "+91 98765 11006", email: "vivaan.joshi@example.com", course: "B.Com", source: "Website", page: "/courses/b-com", referrer: null, assignee: "consultant-priya", status: "Contacted", age: 4, contacted: 3, city: "Thane" },
  { id: "lead-1007", studentName: "Ananya Reddy", phone: "+91 98765 11007", email: "ananya.reddy@example.com", course: "B.Sc. IT", source: "Education fair", page: "/", referrer: null, assignee: "consultant-vivek", status: "Lost", age: 5, contacted: 4, city: "Hyderabad" },
  { id: "lead-1008", studentName: "Reyansh Shah", phone: "+91 98765 11008", email: "reyansh.shah@example.com", course: "BCA", source: "Consultant referral", page: "/apply", referrer: "consultant-priya", assignee: "consultant-priya", status: "In progress", age: 6, contacted: 3, city: "Surat" },
  { id: "lead-1009", studentName: "Diya Menon", phone: "+91 98765 11009", email: "diya.menon@example.com", course: "MBA", source: "Website", page: "/courses/mba", referrer: null, assignee: "consultant-aditi", status: "Converted", age: 7, contacted: 6, city: "Kochi" },
  { id: "lead-1010", studentName: "Arjun Chawla", phone: "+91 98765 11010", email: "arjun.chawla@example.com", course: "B.Tech", source: "Walk-in", page: "Office enquiry", referrer: null, assignee: "consultant-rahul", status: "Contacted", age: 8, contacted: 5, city: "Nashik" },
  { id: "lead-1011", studentName: "Tara Sethi", phone: "+91 98765 11011", email: "tara.sethi@example.com", course: "MCA", source: "Consultant referral", page: "/apply", referrer: "consultant-vivek", assignee: "consultant-aditi", status: "New", age: 9, contacted: null, city: "Jaipur" },
  { id: "lead-1012", studentName: "Rohan Kulkarni", phone: "+91 98765 11012", email: "rohan.kulkarni@example.com", course: "BBA", source: "Website", page: "/courses/bba", referrer: null, assignee: "consultant-priya", status: "In progress", age: 10, contacted: 8, city: "Mumbai" },
  { id: "lead-1013", studentName: "Myra Thomas", phone: "+91 98765 11013", email: "myra.thomas@example.com", course: "BA Psychology", source: "WhatsApp", page: "/", referrer: null, assignee: "consultant-neha", status: "Contacted", age: 12, contacted: 10, city: "Chennai" },
  { id: "lead-1014", studentName: "Aditya Verma", phone: "+91 98765 11014", email: "aditya.verma@example.com", course: "BCA", source: "Consultant referral", page: "/apply", referrer: "consultant-rahul", assignee: "consultant-vivek", status: "Converted", age: 13, contacted: 12, city: "Indore" },
  { id: "lead-1015", studentName: "Sara Fernandes", phone: "+91 98765 11015", email: "sara.fernandes@example.com", course: "B.Com", source: "Website", page: "/courses/b-com", referrer: null, assignee: null, status: "New", age: 14, contacted: null, city: "Goa" },
  { id: "lead-1016", studentName: "Krish Malhotra", phone: "+91 98765 11016", email: "krish.malhotra@example.com", course: "MBA", source: "Consultant referral", page: "/apply", referrer: "consultant-aditi", assignee: "consultant-rahul", status: "Lost", age: 16, contacted: 14, city: "Delhi" },
  { id: "lead-1017", studentName: "Nisha Shetty", phone: "+91 98765 11017", email: "nisha.shetty@example.com", course: "B.Tech", source: "Website", page: "/courses/b-tech", referrer: null, assignee: "consultant-vivek", status: "Contacted", age: 18, contacted: 16, city: "Mangaluru" },
  { id: "lead-1018", studentName: "Devansh Gupta", phone: "+91 98765 11018", email: "devansh.gupta@example.com", course: "MCA", source: "Education fair", page: "Education fair", referrer: null, assignee: "consultant-priya", status: "In progress", age: 20, contacted: 18, city: "Nagpur" },
  { id: "lead-1019", studentName: "Aisha Das", phone: "+91 98765 11019", email: "aisha.das@example.com", course: "BBA", source: "Consultant referral", page: "/apply", referrer: "consultant-priya", assignee: null, status: "New", age: 22, contacted: null, city: "Kolkata" },
  { id: "lead-1020", studentName: "Omkar Patil", phone: "+91 98765 11020", email: "omkar.patil@example.com", course: "BCA", source: "Website", page: "/courses/bca", referrer: null, assignee: "consultant-aditi", status: "Converted", age: 24, contacted: 22, city: "Pune" },
  { id: "lead-1021", studentName: "Ira Banerjee", phone: "+91 98765 11021", email: "ira.banerjee@example.com", course: "B.Sc. IT", source: "Consultant referral", page: "/apply", referrer: "consultant-vivek", assignee: "consultant-vivek", status: "Contacted", age: 27, contacted: 25, city: "Kolkata" },
  { id: "lead-1022", studentName: "Yash Bhatia", phone: "+91 98765 11022", email: "yash.bhatia@example.com", course: "MBA", source: "Website", page: "/courses/mba", referrer: null, assignee: "consultant-rahul", status: "Lost", age: 31, contacted: 29, city: "Mumbai" },
  { id: "lead-1023", studentName: "Pooja Soman", phone: "+91 98765 11023", email: "pooja.soman@example.com", course: "MCA", source: "Consultant referral", page: "/apply", referrer: "consultant-neha", assignee: "consultant-aditi", status: "Converted", age: 35, contacted: 32, city: "Pune" },
  { id: "lead-1024", studentName: "Neil D'Souza", phone: "+91 98765 11024", email: "neil.dsouza@example.com", course: "B.Tech", source: "Website", page: "/courses/b-tech", referrer: null, assignee: "consultant-priya", status: "Contacted", age: 41, contacted: 39, city: "Mumbai" },
  { id: "lead-1025", studentName: "Riya Ghosh", phone: "+91 98765 11025", email: "riya.ghosh@example.com", course: "B.Com", source: "Walk-in", page: "Office enquiry", referrer: null, assignee: "consultant-neha", status: "New", age: 48, contacted: null, city: "Thane" },
  { id: "lead-1026", studentName: "Kunal Sinha", phone: "+91 98765 11026", email: "kunal.sinha@example.com", course: "BCA", source: "Consultant referral", page: "/apply", referrer: "consultant-rahul", assignee: "consultant-priya", status: "Converted", age: 53, contacted: 50, city: "Ahmedabad" },
  { id: "lead-1027", studentName: "Mira Roy", phone: "+91 98765 11027", email: "mira.roy@example.com", course: "MBA", source: "Website", page: "/courses/mba", referrer: null, assignee: "consultant-aditi", status: "In progress", age: 61, contacted: 57, city: "Bengaluru" },
  { id: "lead-1028", studentName: "Siddharth Pillai", phone: "+91 98765 11028", email: "siddharth.pillai@example.com", course: "BBA", source: "Consultant referral", page: "/apply", referrer: "consultant-aditi", assignee: "consultant-vivek", status: "Lost", age: 72, contacted: 68, city: "Kochi" },
];

function createLead(seed: (typeof leadSeed)[number]): Lead {
  return {
    id: seed.id,
    studentName: seed.studentName,
    phone: seed.phone,
    email: seed.email,
    course: seed.course,
    source: seed.source,
    sourcePage: seed.page,
    referredByConsultantId: seed.referrer,
    assignedConsultantId: seed.assignee,
    status: seed.status,
    lastContactedAt: seed.contacted === null ? null : shiftedDate(-seed.contacted, 15, 20),
    createdAt: shiftedDate(-seed.age, 10 + (seed.age % 7), 15),
    notes: seed.note ? [{ id: `${seed.id}-note-1`, text: seed.note, createdAt: shiftedDate(-Math.max(seed.contacted ?? seed.age, 0), 16, 0), author: "Ananya Sharma" }] : [],
  };
}

function initialActivities(leads: Lead[]): Activity[] {
  return [
    { id: "activity-1", leadId: "lead-1001", consultantId: null, type: "lead-created", title: "New website enquiry received", description: "Aarav Patel asked about the BCA course guide.", createdAt: leads[0].createdAt, actor: "Website form" },
    { id: "activity-2", leadId: "lead-1002", consultantId: "consultant-rahul", type: "lead-created", title: "Referral lead added", description: "Sana Khan was referred by Rahul Mehta and assigned to Priya Iyer.", createdAt: leads[1].createdAt, actor: "Rahul Mehta" },
    { id: "activity-3", leadId: "lead-1005", consultantId: "consultant-aditi", type: "status-changed", title: "Lead converted", description: "Meera Nair moved to Converted.", createdAt: shiftedDate(-2, 12, 30), actor: "Aditi Shah" },
    { id: "activity-4", leadId: "lead-1004", consultantId: "consultant-vivek", type: "note-added", title: "Counselor note logged", description: "Counselor note logged for Kabir Rao.", createdAt: shiftedDate(-1, 11, 10), actor: "Vivek Nair" },
    { id: "activity-5", leadId: null, consultantId: "consultant-priya", type: "consultant", title: "Referral link shared", description: "Priya Iyer shared her consultant referral link.", createdAt: shiftedDate(-2, 16, 20), actor: "Priya Iyer" },
    { id: "activity-6", leadId: "lead-1007", consultantId: "consultant-vivek", type: "note-added", title: "Lead marked as not proceeding", description: "Ananya Reddy is no longer exploring this intake.", createdAt: shiftedDate(-4, 15, 0), actor: "Vivek Nair" },
    { id: "activity-7", leadId: "lead-1006", consultantId: "consultant-priya", type: "assigned", title: "Lead assigned", description: "Vivaan Joshi was assigned to Priya Iyer.", createdAt: shiftedDate(-3, 13, 30), actor: "Ananya Sharma" },
  ];
}

export function createInitialAdminState(courses: Course[] = []): AdminState {
  const leads = leadSeed.map(createLead);
  const referrals: Referral[] = leads
    .filter((lead) => lead.referredByConsultantId)
    .map((lead, index) => ({
      id: `referral-${index + 1}`,
      leadId: lead.id,
      consultantId: lead.referredByConsultantId!,
      createdAt: lead.createdAt,
      campaign: index % 2 === 0 ? "Course guide share" : "Counsellor introduction",
    }));
  const websiteContent: WebsiteContent = {
    homepageHeading: "Find the Right Course. Build Your Future.",
    homepageDescription: "Explore courses, understand eligibility and get guidance from Edusaaathi to take the next step in your education journey.",
    contactEmail: "",
    contactPhone: "",
    whatsappNumber: "",
    enquiryFormEnabled: true,
    requireConsent: true,
    showCourseField: true,
  };
  const settings: AdminSettings = {
    organizationName: "Edusaaathi Education Consultancy",
    websiteBaseUrl: SITE_URL,
    assignmentMethod: "Manual",
    referralCodePrefix: "",
    referralCookieDays: 30,
    emailNotifications: true,
    weeklySummary: false,
  };
  return {
    courses: courses.map((course) => ({ ...course })),
    leads,
    consultants,
    referrals,
    activities: initialActivities(leads),
    websiteContent,
    settings,
  };
}

export function getConsultantName(consultants: Consultant[], id: string | null | undefined): string {
  if (!id) return "Unassigned";
  return consultants.find((consultant) => consultant.id === id)?.name ?? "Former consultant";
}

export function getReferralUrl(baseUrl: string, code: string): string {
  let cleanBase = SITE_URL;
  try {
    const parsed = new URL((baseUrl || SITE_URL).trim());
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      cleanBase = `${parsed.origin}${parsed.pathname.replace(/\/+$/, "")}`;
    }
  } catch {
    // Keep the configured public SITE_URL when the editable demo value is invalid.
  }
  return `${cleanBase}/apply?ref=${encodeURIComponent(code)}`;
}

export function getLeadWhatsAppHref(phone?: string | null, studentName?: string | null, course?: string | null): string | null {
  if (!phone || typeof phone !== "string") return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  let normalized = digits;
  if (normalized.startsWith("0091")) normalized = normalized.slice(2);
  if (normalized.startsWith("0") && normalized.length === 11) normalized = normalized.slice(1);
  if (normalized.length === 10) normalized = `91${normalized}`;
  if (normalized.startsWith("91") && normalized.length === 12) {
    // Already includes India's country code; keep it once.
  }
  if (normalized.length < 11 || normalized.length > 15) return null;
  const name = (studentName && typeof studentName === "string" ? studentName.trim() : "") || "there";
  const courseName = (course && typeof course === "string" ? course.trim() : "") || "our programs";
  const message = `Hi ${name}, I'm reaching out from Edusaaathi about your interest in ${courseName}. Let me know a suitable time to connect.`;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

function csvCell(value: string | number | null | undefined): string {
  const raw = String(value ?? "");
  const safe = /^\s*[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function downloadCsvFile(rows: Array<Array<string | number | null | undefined>>, filename: string): void {
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function exportLeadsCsv(leads: Lead[], consultants: Consultant[], filename = "edusaaathi-leads.csv"): void {
  const rows: Array<Array<string | number | null | undefined>> = [
    ["Student name", "Phone", "Email", "Course", "Source", "Referred by", "Assigned consultant", "Status", "Last contacted", "Created"],
    ...leads.map((lead) => [
      lead.studentName,
      lead.phone,
      lead.email,
      lead.course,
      lead.source,
      getConsultantName(consultants, lead.referredByConsultantId),
      getConsultantName(consultants, lead.assignedConsultantId),
      lead.status,
      lead.lastContactedAt || "",
      lead.createdAt,
    ]),
  ];
  downloadCsvFile(rows, filename);
}
