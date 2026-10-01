import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toPersianDigits(str: string | number): string {
  if (str === null || str === undefined) return '';
  return str.toString().replace(/\d/g, (x) => persianNumbers[parseInt(x)]);
}
