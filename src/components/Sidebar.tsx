'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { v4 as uuid } from 'uuid'

import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList
} from "@/components/ui/command"
import logo from '../../public/logo-clube-rede-black-png.png'
import { Handshake, Map, Settings2, Store, Users, CircleUserRound, TicketCheck } from 'lucide-react'
import UserCard from './UserCard'

export default function Sidebar() {
  const pathname = usePathname()

  const commandListItems = [
    { name: 'Associados', link: '/painel/associados', icon: <Users /> },
    { name: 'Clientes', link: '/painel/clientes', icon: <Handshake /> },
    { name: 'Estabelecimentos', link: '/painel/estabelecimentos', icon: <Store /> },
    { name: 'Vouchers', link: '/painel/vouchers', icon: <TicketCheck /> },
    { name: 'Categorias', link: '/painel/categorias', icon: <Settings2 /> },
    { name: 'Cidades', link: '/painel/cidades', icon: <Map /> },
    { name: 'Usuários', link: '/painel/usuarios', icon: <CircleUserRound /> }
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

      <Image className="rounded-md p-8" src={logo} alt="Logo do Clube Rede" priority />
    </aside>
  )
}
