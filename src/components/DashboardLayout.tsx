'use client'

interface DashBoradLayoutProps {
  children?: React.ReactNode
  title: string
}

export default function DashboardLayout({ children, title }: DashBoradLayoutProps) {
  return (
    <div className="flex flex-col p-8">
      <h1 className="text-2xl font-bold">{title}</h1>
      {children}
    </div>
  )
}
