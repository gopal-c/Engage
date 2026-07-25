export interface Employee {
  id: string;
  name: string;
  email: string;
  birthday: string; // MM-DD, extracted from skillshub.profiles.date_of_birth
  city: string;
  seniority: string;
  avatarUrl?: string;
}

export interface SendLog {
  id: string;
  employeeId: string;
  employeeName: string;
  sentAt: string;
  year: number;
  status: "sent" | "failed";
  error?: string;
}

export interface GenerateRequest {
  name: string;
  notes?: string;
}

export interface SendEmailRequest {
  employeeId: string;
  message: string;
}

export interface ScheduledSend {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  message: string;
  gmailUser: string;
  gmailAppPassword: string;
  fromName: string;
  cc: string[];
  ccBehavior?: "cc" | "bcc" | "none";
  mood: string;
  fuel: string;
  heroImageUrl?: string;
  paletteId?: string;
  scheduledAt: string;   // ISO UTC datetime
  status: "pending" | "sent" | "cancelled";
  createdAt: string;
  sentAt?: string;
}

export interface ExcludedUser {
  id: string;
  userId: string;
  name: string;
  email: string;
  reason?: string;
  excludedByName?: string;
  createdAt: string;
}

export interface AppSettings {
  fromName: string;
  replyTo: string;
  autoSendEnabled: boolean;
  sendTimeIST: string;
  sendTimeUTC: string;
  cronExpression: string;
  ccMode: "all" | "custom" | "none";
  customCCList: string[];
  bccOverride: boolean;
}
