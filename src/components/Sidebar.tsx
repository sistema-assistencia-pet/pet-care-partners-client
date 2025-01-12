'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { v4 as uuid } from 'uuid'

import {
  Command,
  CommandItem,
  CommandList
} from "@/components/ui/command"
import { Handshake, Map, Settings2, Store, Users, CircleUserRound, TicketCheck, TicketPercent } from 'lucide-react'
import UserCard from './UserCard'
import { useAuth } from '@/contexts/AuthContext'
import { ROLE } from '@/lib/enums'

export default function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()

  const commandListItems = [
    { name: 'Associados', link: '/painel/associados', icon: <Users />, onlyMaster: false },
    { name: 'Clientes', link: '/painel/clientes', icon: <Handshake />, onlyMaster: true },
    { name: 'Estabelecimentos', link: '/painel/estabelecimentos', icon: <Store />, onlyMaster: true },
    { name: 'Vouchers', link: '/painel/vouchers', icon: <TicketCheck />, onlyMaster: false },
    { name: 'Categorias', link: '/painel/categorias', icon: <Settings2 />, onlyMaster: true },
    { name: 'Cidades', link: '/painel/cidades', icon: <Map />, onlyMaster: true },
    { name: 'Usuários', link: '/painel/usuarios', icon: <CircleUserRound />, onlyMaster: false }
  ]

  return (
    <aside className="w-60 min-w-60 border-r min-h-screen p-4 flex flex-grow flex-col bg-white fixed">
      <nav className="flex flex-grow gap-8 flex-col">
        <UserCard />
        <Command>
          <CommandList>
              {
                commandListItems.map((commandItem) => !(user?.roleId === ROLE.CLIENT_ADMIN && commandItem.onlyMaster) && (
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

      <TicketPercent className="self-center" color="#881ded" size={128}/>
    </aside>
  )
}
