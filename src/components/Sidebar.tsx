'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { v4 as uuid } from 'uuid'

import {
  Command,
  CommandItem,
  CommandList
} from "@/components/ui/command"
import { TicketCheck, TicketPercent } from 'lucide-react'
import UserCard from './UserCard'
import { useAuth } from '@/contexts/AuthContext'

export default function Sidebar() {
  const pathname = usePathname()

  const commandListItems = [
    { name: 'Validar Voucher', link: '/painel/validar-voucher', icon: <TicketCheck /> }
  ]

  return (
    <aside className="w-60 min-w-60 border-r min-h-screen p-4 flex flex-grow flex-col bg-white fixed">
      <nav className="flex flex-grow gap-8 flex-col">
        <UserCard />
        <Command>
          <CommandList>
              {
                commandListItems.map((commandItem) => (
                  <Link href={commandItem.link} key={uuid()} passHref={true}>
                    <CommandItem className={`mb-4 pl-4 gap-4 ${pathname.includes(commandItem.link) && 'bg-accent'}`}>
                      {commandItem.icon}
                      {commandItem.name}
                    </CommandItem>
                  </Link>
                ))
              }
          </CommandList>
        </Command>
      </nav>

      <span className="text-center text-2xl font-bold text-primary">Exclusive Pass</span>

      <TicketPercent className="self-center" color="#881ded" size={128}/>
    </aside>
  )
}
