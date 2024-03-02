
import Sidebar from '@/components/Sidebar'

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
      <div className={`flex items-start justify-between`}>
        {children}
      </div>
  )
}
