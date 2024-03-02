'use client'

import { endSession } from '@/lib/auth'
import { Button } from './ui/button'
import { useAuth } from '@/contexts/AuthContext'

export default function UserCard() {
  const { user } = useAuth()

  return (
    <div className="flex items-center justify-between gap-4 border rounded-md p-2 w-52">
      <div className="avatar rounded-full min-h-12 min-w-12 bg-emerald-500 text-white font-bold flex items-center justify-center text-xl">
        <span>
          {user && user.name.charAt(0)}
        </span>
      </div>
      <div className='flex flex-col flex-grow justify-center'>
        <p className="font-bold text-center" title={user?.name}>
          {(user?.name.length !== undefined && user?.name.length > 15) ? user?.name.substring(0, 12) + '...' : user?.name}
        </p>
        <Button variant="ghost" className='max-h-6 py-1' onClick={() => endSession()}>
          Sair
        </Button>
      </div>
    </div>
  )
}
