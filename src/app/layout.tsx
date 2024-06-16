import type { Metadata } from "next"
import { Inter } from "next/font/google"

import "./globals.css"
import AuthProvider from '@/contexts/AuthContext'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Clube Rede",
  description: "Milhas e vantagens para você viajar mais",
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
