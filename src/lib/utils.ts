import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ------------------- CNPJ Mask -------------------
export const applyCnpjMask = (cnpj: string): string => cnpj.slice(0, 2) + `.` + cnpj.slice(2, 5) + `.` + cnpj.slice(5, 8) + `/` + cnpj.slice(8, 12) + `-` + cnpj.slice(12, 14)

export const removeCnpjMask = (cnpj: string): string => cnpj.replaceAll('.', '').replaceAll('-', '').replaceAll('/', '')

// ------------------- CPF Mask -------------------
export const applyCpfMask = (cpf: string): string => cpf.slice(0, 3) + `.` + cpf.slice(3, 6) + `.` + cpf.slice(6, 9) + `-` + cpf.slice(9, 11)

export const removeCpfMask = (cpf: string): string => cpf.replaceAll('.', '').replaceAll('-', '')

// ------------------- CEP Mask -------------------
export const applyCepMask = (cep: string): string => cep.slice(0, 5) + `-` + cep.slice(5, 8)

// ------------------- Phone Number Mask -------------------
export const applyPhoneNumberMask = (phoneNumber: string): string => `(${phoneNumber.slice(0, 2)}) ${phoneNumber.length === 10 ? `${phoneNumber.slice(2, 6)}-${phoneNumber.slice(6, 10)}` : `${phoneNumber.slice(2, 7)}-${phoneNumber.slice(7, 11)}`}`

// ------------------- Remove Characters -------------------
export const leaveOnlyDigits = (value: string): string => value.replace(/[^0-9]/g, ``)

export const removeSpecialCharacters = (value: string): string => {
  return value.replace(/[^a-zA-Z0-9]/g, '');
};

// ------------------- Format String -------------------
export const captalize = (word: string): string => word.toLowerCase().split(` `).map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(` `)

// ------------------- Date and Time -------------------
export const formatDateTime = (date: string): string => new Date(date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

export const convertISODateToPTBR = (date: string): string => date.split('-').reverse().join('/')

export const convertPTBRDateToISO = (date: string): string => date.split('/').reverse().join('-')

// ------------------- Currency -------------------
export const formatCurrency = (value: string): string => {
  let formattedValue = value.replace(/\D/g, "")

  formattedValue = formattedValue.replace(/^0+/, '');
  formattedValue = formattedValue.replace(/(\d)(\d{2})$/, "$1,$2")
  formattedValue = formattedValue.replace(/(?=(\d{3})+(\D))\B/g, ".")

  if(formattedValue.length === 1) formattedValue = `0,0${formattedValue}`
  if(formattedValue.length === 2) formattedValue = `0,${formattedValue}`

  return formattedValue;
};

export const transformCurrencyFromCentsToBRLString = (cents: number): string => (cents / 100).toFixed(2).replace('.', ',')

export const transformCurrencyFromBRLStringToCents = (BRLString: string): number => parseInt(leaveOnlyDigits(BRLString))
