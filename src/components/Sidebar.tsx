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

export default function Sidebar() {
  const commandListItems = [
    {
      group: 'Sessões',
      items: [
        { name: 'Clientes', link: '/painel/clientes', icon: <Store /> },
        { name: 'Associados', link: '/painel/associados', icon: <Users /> },
      ]
    }
  ]

  return (
    <aside className='w-60 min-w-60 border-r min-h-screen p-4 flex'>
      <nav className='flex flex-grow gap-4 flex-col'>
        <UserCard name='Philippe Dias' />
        <Command>
          <CommandList>
            {
              commandListItems.map((commandListItem) => (
                <CommandGroup heading={commandListItem.group} key={uuid()}>
                  {
                    commandListItem.items.map((commandItem) => (
                      <CommandItem>
                        {commandItem.icon}
                        {commandItem.name}
                      </CommandItem>
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