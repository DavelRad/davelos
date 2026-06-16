import type { LucideIcon } from "lucide-react";

export type SectionId =
  | "home"
  | "work"
  | "projects"
  | "stack"
  | "about"
  | "ask"
  | "contact";

export interface NavItem {
  id: SectionId;
  label: string;
  index: string; // "01"
  icon: LucideIcon;
}

export interface Stat {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
}

export interface WorkEntry {
  id: string;
  company: string;
  role: string;
  period: string;
  location: string;
  summary: string;
  highlights: string[];
  tags: string[];
  url?: string;
  accent?: boolean;
}

export interface Project {
  id: string;
  name: string;
  award: string;
  description: string;
  tags: string[];
  url?: string;
}

export interface StackGroup {
  label: string;
  items: string[];
}

export interface ContactLink {
  label: string;
  value: string;
  href: string;
}

/** A canned answer entry for the Ask Davel mock router. */
export interface QAEntry {
  keywords: string[];
  answer: string;
}
