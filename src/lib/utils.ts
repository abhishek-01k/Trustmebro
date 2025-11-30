import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatProfit = (profit: number): string => {
  const sign = profit >= 0 ? "+" : "";
  return `${sign}${profit.toLocaleString()}`;
};

export const formatScore = (score: number): string => {
  if (score >= 1000000) {
    return `${(score / 1000000).toFixed(1)}M`;
  }
  if (score >= 1000) {
    return `${(score / 1000).toFixed(1)}k`;
  }
  return score.toLocaleString();
};

export const truncateToChars = (text: string, maxChars: number): string => {
  if (!text) return "";
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) {
    return trimmed;
  }
  return trimmed.slice(0, maxChars) + "...";
};