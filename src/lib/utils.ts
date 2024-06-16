import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const applyCnpjMask = (cnpj: string): string => cnpj.slice(0, 2) + `.` + cnpj.slice(2, 5) + `.` + cnpj.slice(5, 8) + `/` + cnpj.slice(8, 12) + `-` + cnpj.slice(12, 14)

export const removeCnpjMask = (cnpj: string): string => cnpj.replaceAll('.', '').replaceAll('-', '').replaceAll('/', '')

export const applyCpfMask = (cpf: string): string => cpf.slice(0, 3) + `.` + cpf.slice(3, 6) + `.` + cpf.slice(6, 9) + `-` + cpf.slice(9, 11)

export const removeCpfMask = (cpf: string): string => cpf.replaceAll('.', '').replaceAll('-', '')

export const captalize = (word: string): string => word.toLowerCase().split(` `).map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(` `)

export const formatDateTime = (date: string): string => new Date(date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

export const formatBirthdate = (date: string): string => date.split('-').reverse().join('/')

export const formatPhoneNumber = (phoneNumber: string): string => `(${phoneNumber.slice(0, 2)}) ${phoneNumber.length === 10 ? `${phoneNumber.slice(2, 6)}-${phoneNumber.slice(6, 10)}` : `${phoneNumber.slice(2, 7)}-${phoneNumber.slice(7, 11)}`}`

export const formatCurrency = (value: number): string => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

export const applyCepMask = (cep: string): string => cep.slice(0, 6) + `-` + cep.slice(6, 8)

export const applyCurrencyMaskReturningString = (value: string): string => {
  return value.replace(/[^\d,]/g, '')
}

export const transformCurrencyStringToNumber = (value: string): number => {
  return parseFloat(value.replace(',', '.'))
}

export const transformCurrencyNumberToString = (value: number): string => {
  return value.toFixed(2).replace('.', ',')
}

export const validateCurrencyInput = (value: string): boolean => {
  const splitted = value.split(',')
  if (![1, 2].includes(splitted.length)) return false
  if (splitted.length === 2 && ![1, 2].includes(splitted[1].length)) return false
  return true
}
