'use client'

interface DashBoradLayoutProps {
  children?: React.ReactNode
  counterText?: string
  title: string
}

export default function DashboardLayout({ children, counterText, title }: DashBoradLayoutProps) {
  return (
    <div className="flex flex-col p-8 w-full h-full">
      <div className='flex flex-row gap-8 justify-between w-full'>
        <h1 className="text-2xl mb-4 font-bold">{title}</h1>
        {
          counterText && (
            <div
              className="cursor-default text-center font-semibold py-2"
            >
              {counterText}
            </div>
          )
        }
      </div>
      {children}
    </div>
  )
}
