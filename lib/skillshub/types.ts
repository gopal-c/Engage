export type Proficiency = "beginner" | "intermediate" | "advanced" | "expert";
export type Seniority = "junior" | "mid" | "senior" | "lead";
export type Status = "pending" | "approved" | "rejected";

export type Skill = {
  name: string;
  category: string;
  proficiency: Proficiency;
  yearsExperience: number;
};

export type Project = {
  name: string;
  description: string;
  skillsUsed: string[];
  duration: string;
};

export type Education = {
  degree: string;
  institution: string;
  year: number;
  month?: number;
};

export type Profile = {
  id: string;
  userId: string | null;
  name: string;
  email: string;
  city: string;
  seniority: Seniority;
  yearsExperience: number;
  skills: Skill[];
  projects: Project[];
  education: Education[];
  avatarUrl: string | null;
  status: Status;
  createdAt: string;
  updatedAt: string;
  workEmail: string | null;
  workEmailVerified: boolean;
  workEmailVerificationToken: string | null;
  workEmailVerificationExpiresAt: string | null;
  joiningDate: string | null;
  dateOfBirth: string | null;
};

export type MilestoneCreator = "hr" | "employee";
export type MilestoneCategory =
  | "achievement"
  | "promotion"
  | "certification"
  | "education"
  | "milestone"
  | "celebration"
  | "other";

export type Milestone = {
  id: string;
  profileId: string;
  title: string;
  milestoneDate: string;
  category: MilestoneCategory;
  createdBy: MilestoneCreator;
  createdAt: string;
  updatedAt: string;
};
