'use client'

import { Button } from './ui/button'

interface UserCardProps {
  name: string
}

export default function UserCard({ name }: UserCardProps) {
  return (
    <div className="flex items-center justify-between gap-4 border rounded-md p-2 w-52">
      <div className="avatar rounded-full min-h-12 min-w-12 bg-emerald-500 text-white font-bold flex items-center justify-center text-xl">
        <span>
          {name.charAt(0)}
        </span>
      </div>
      <div className='flex flex-col flex-grow justify-center'>
        <p className="font-bold text-center" title={name}>
          {name.length > 15 ? name.substring(0, 12) + '...' : name}
        </p>
        <Button variant="ghost" className='max-h-6 py-1'>
          Sair
        </Button>
      </div>
    </div>
  )
}
