import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-amber-600'
  return 'text-red-600'
}

export function getScoreBg(score: number): string {
  if (score >= 80) return 'bg-green-50 text-green-700 border-green-200'
  if (score >= 60) return 'bg-amber-50 text-amber-700 border-amber-200'
  return 'bg-red-50 text-red-700 border-red-200'
}

export function getScoreBarColor(score: number): string {
  if (score >= 80) return 'bg-green-500'
  if (score >= 60) return 'bg-amber-500'
  return 'bg-red-500'
}

export function formatDate(d: string): string {
  try { return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) }
  catch { return d }
}

export function formatDateTime(d: string): string {
  try { return new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }
  catch { return d }
}

export function getGrade(score: number): { grade: string; color: string } {
  if (score >= 90) return { grade: 'A', color: 'text-green-700 bg-green-100' }
  if (score >= 80) return { grade: 'B', color: 'text-blue-700 bg-blue-100' }
  if (score >= 70) return { grade: 'C', color: 'text-amber-700 bg-amber-100' }
  if (score >= 60) return { grade: 'D', color: 'text-orange-700 bg-orange-100' }
  return { grade: 'F', color: 'text-red-700 bg-red-100' }
}
