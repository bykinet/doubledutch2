export interface UserProfile {
  uid: string;
  nickname: string;
  provider: "password" | "google.com" | "phone-virtual" | "anonymous";
  email: string | null;
  phoneE164: string | null;
  createdAt: number;
  lastLoginAt: number;
}

export interface PrivateProfile {
  managementId: string;
}
