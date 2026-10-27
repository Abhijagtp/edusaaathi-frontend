export type Course = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  duration: string;
  eligibility: string;
  fees: string | null;
  highlights: string[];
  admissionInfo: string;
  image: string | null;
  imageAlt: string | null;
  published: boolean;
  updatedAt: string;
};

export type LeadStatus =
  | "New"
  | "Contacted"
  | "Interested"
  | "Converted"
  | "Not Interested";

export type Lead = {
  id: string;
  fullName: string;
  mobile: string;
  courseSlug: string;
  courseName: string;
  city: string;
  status: LeadStatus;
  createdAt: string;
};

export const LEAD_STATUSES: LeadStatus[] = [
  "New",
  "Contacted",
  "Interested",
  "Converted",
  "Not Interested",
];
