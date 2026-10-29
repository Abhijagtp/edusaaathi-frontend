import type { Course } from "@/lib/types";

export type LeadStatus = "New" | "Contacted" | "In progress" | "Converted" | "Lost";
export type LeadSource = "Website" | "Consultant referral" | "WhatsApp" | "Walk-in" | "Education fair";
export type AccountStatus = "Active" | "Inactive";
export type AssignmentMethod = "Manual" | "Round robin" | "Fewest open leads";

export type LeadNote = {
  id: string;
  text: string;
  createdAt: string;
  author: string;
};

export type Lead = {
  id: string;
  studentName: string;
  phone: string;
  email: string;
  course: string;
  source: LeadSource;
  sourcePage: string;
  referredByConsultantId: string | null;
  assignedConsultantId: string | null;
  referralCode?: string | null;
  status: LeadStatus;
  lastContactedAt: string | null;
  createdAt: string;
  notes: LeadNote[];
};

export type Consultant = {
  id: string;
  userId?: string;
  name: string;
  email: string;
  phone: string;
  referralCode: string;
  status: AccountStatus;
  referralClicks: number;
  totalLeads?: number;
  createdAt: string;
};

export type Referral = {
  id: string;
  leadId: string;
  consultantId: string;
  createdAt: string;
  campaign: string;
};

export type Activity = {
  id: string;
  leadId: string | null;
  consultantId: string | null;
  type: "lead-created" | "status-changed" | "assigned" | "note-added" | "consultant" | "course" | "content" | "settings";
  title: string;
  description: string;
  createdAt: string;
  actor: string;
};

export type WebsiteContent = {
  homepageHeading: string;
  homepageDescription: string;
  contactEmail: string;
  contactPhone: string;
  whatsappNumber: string;
  enquiryFormEnabled: boolean;
  requireConsent: boolean;
  showCourseField: boolean;
};

export type AdminSettings = {
  organizationName: string;
  websiteBaseUrl: string;
  assignmentMethod: AssignmentMethod;
  referralCodePrefix: string;
  referralCookieDays: number;
  emailNotifications: boolean;
  weeklySummary: boolean;
};

export type AdminState = {
  courses: Course[];
  leads: Lead[];
  consultants: Consultant[];
  referrals: Referral[];
  activities: Activity[];
  websiteContent: WebsiteContent;
  settings: AdminSettings;
};

export type LeadDraft = Omit<Lead, "id" | "createdAt" | "lastContactedAt" | "notes"> & {
  id?: string;
  lastContactedAt?: string | null;
};

export type ConsultantDraft = Pick<Consultant, "name" | "email" | "phone" | "referralCode" | "status"> & {
  id?: string;
  password?: string;
};
export type CourseDraft = Omit<Course, "id" | "updatedAt"> & { id?: string };

