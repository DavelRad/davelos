import { clsx, type ClassValue } from "clsx";

/** Tiny class-name merge helper. */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
