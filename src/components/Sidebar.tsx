'use client'

import Image from 'next/image'
import { v4 as uuid } from 'uuid'
import Link from 'next/link'

import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList
} from "@/components/ui/command"
import logo from '../../public/logo-f4u-png.png'
import { Store, Users } from 'lucide-react'
import UserCard from './UserCard'

export default function Sidebar() {
  const commandListItems = [
    {
      group: 'Sessões',
      items: [
        { name: 'Associados', link: '/painel/associados', icon: <Users /> },
        { name: 'Clientes', link: '/painel/clientes', icon: <Store /> },
      ]
    }
  ]

  return (
    <aside className='w-60 min-w-60 border-r min-h-screen p-4 flex flex-grow flex-col bg-white'>
      <nav className='flex flex-grow gap-8 flex-col'>
        <UserCard />
        <Command>
          <CommandList>
            {
              commandListItems.map((commandListItem) => (
                <CommandGroup className="flex flex-col gap-4" heading={commandListItem.group} key={uuid()}>
                  {
                    commandListItem.items.map((commandItem) => (
                      <Link href={commandItem.link} key={uuid()} passHref={true}>
                        <CommandItem className="mb-4 pl-4 gap-4">
                          {commandItem.icon}
                          {commandItem.name}
                        </CommandItem>
                      </Link>
                    ))
                  }
                </CommandGroup>
              ))
            }
          </CommandList>
        </Command>
      </nav>

      <Image className="rounded-md px-2" src={logo} alt="Farma4U" />
    </aside>
  )
}
