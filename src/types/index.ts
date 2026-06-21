export type UserRole = "admin" | "guru" | "siswa" | "guest";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Attachment {
  name: string;
  type: string;
  size: string;
  url?: string;
}

export interface Material {
  id: string;
  title: string;
  type: string;
  category: string;
  author: string;
  updatedAt: string;
  content: string;
  fileUrl?: string;
  attachments?: Attachment[];
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
}

export interface Documentation {
  id: string;
  photoUrl: string;
  origin: string;
  description: string;
  date: string;
}

export interface UkkFile {
  id: string;
  name: string;
  url: string;
  type: string; // "PDF", "Video", "Image", "Link", etc.
}

export interface UkkProject {
  id: string;
  date: string;
  title: string;
  studentName: string;
  class: string;
  category: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  externalLink: string;
  grade?: string;
  feedback?: string;
  academicYear?: string;
  files?: UkkFile[];
}

export interface Facility {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
}

export interface ProfileDocument {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  fileName: string;
}

export interface ProfileJurusan {
  vision: string;
  mission: string[];
  about: string;
  facilities: Facility[];
  documents: ProfileDocument[];
}

