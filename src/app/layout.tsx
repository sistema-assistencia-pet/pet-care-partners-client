import type { Metadata } from "next"
import { Inter } from "next/font/google"

import "./globals.css"
import AuthProvider from '@/contexts/AuthContext'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pet Care - Sistema",
  description: "Painel de validação de vouchers do sistema Pet Care",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
