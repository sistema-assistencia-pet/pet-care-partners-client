import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const applyCnpjMask = (cnpj: string): string => cnpj.slice(0, 2) + `.` + cnpj.slice(2, 5) + `.` + cnpj.slice(5, 8) + `/` + cnpj.slice(8, 12) + `-` + cnpj.slice(12, 14)

export const captalize = (word: string): string => word.toLowerCase().split(` `).map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(` `)

export const formatDate = (date: string): string => new Date(date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

export const removeCnpjMask = (cnpj: string): string => cnpj.replaceAll('.', '').replaceAll('-', '').replaceAll('/', '')