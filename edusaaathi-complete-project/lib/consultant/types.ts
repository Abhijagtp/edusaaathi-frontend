export const CONSULTANT_LEAD_STATUSES = ["New", "Contacted", "In progress", "Converted", "Lost"] as const;
export type ConsultantLeadStatus = (typeof CONSULTANT_LEAD_STATUSES)[number];

export const CONSULTANT_LEAD_SOURCES = ["Website", "Consultant referral", "WhatsApp", "Walk-in", "Education fair"] as const;
export type ConsultantLeadSource = (typeof CONSULTANT_LEAD_SOURCES)[number];

export type ConsultantProfile = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  referralCode: string;
  isActive: boolean;
  createdAt: string;
};

export type ConsultantNote = {
  id: string;
  text: string;
  createdAt: string;
  author: string;
};

export type ConsultantLead = {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  interestedCourse: string;
  source: ConsultantLeadSource;
  referralCode: string | null;
  referredByConsultantId: string | null;
  referredByConsultantName: string | null;
  assignedConsultantId: string;
  status: ConsultantLeadStatus;
  createdAt: string;
  lastContactedAt: string | null;
  convertedAt: string | null;
  updatedAt: string;
  city?: string;
  educationalBackground?: string;
  notes: ConsultantNote[];
};

export type ConsultantActivityType =
  | "lead-assigned"
  | "status-updated"
  | "lead-converted"
  | "note-added";

export type ConsultantActivity = {
  id: string;
  leadId: string;
  actorName: string;
  activityType: ConsultantActivityType;
  description: string;
  createdAt: string;
};

export type ReferralLeadSummary = {
  id: string;
  fullName: string;
  capturedAt: string;
  interestedCourse: string;
  currentStatus: ConsultantLeadStatus;
  authorizedLeadId: string | null;
};

export type ConsultantPortalState = {
  profile: ConsultantProfile;
  leads: ConsultantLead[];
  referralLeads: ReferralLeadSummary[];
  activities: ConsultantActivity[];
};

export type ConsultantProfileDraft = Pick<ConsultantProfile, "fullName" | "email" | "phone">;
export type ConsultantLeadUpdate = Partial<Pick<ConsultantLead, "status" | "lastContactedAt">>;
