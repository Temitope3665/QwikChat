import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getShortName(full_name: string = ''): string {
    if (full_name.includes(" ")) {
        const names = full_name.split(" ");
        return `${names[0].charAt(0)}${names[1].charAt(0)}`.toUpperCase()
    }
    return `${full_name.slice(0,2)}`.toUpperCase()
}