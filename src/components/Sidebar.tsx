'use client'

import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList
} from "@/components/ui/command"
import UserCard from './UserCard'
import { v4 as uuid } from 'uuid'
import { Store, Users } from 'lucide-react'
import Link from 'next/link'


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
    <aside className='w-60 min-w-60 border-r min-h-screen p-4 flex'>
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
    </aside>
  )
}
