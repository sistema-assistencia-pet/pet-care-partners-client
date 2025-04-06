'use client'

import { useEffect, useState } from 'react'

import { Button } from './ui/button'
import { endSession } from '@/lib/auth'
import { useAuth } from '@/contexts/AuthContext'

export default function UserCard() {
  const [userName, setUserName] = useState<string>('')
  const { user } = useAuth()

  useEffect(() => {
    const userNameSplitted = user?.name.split(' ')
    const userNameFormatted = userNameSplitted
      ?.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')

    setUserName(userNameFormatted || '')
  }, [user])

  return (
    <div className="flex items-center justify-between gap-4 border rounded-md p-2 w-52 bg-slate-50">
      <div className="avatar rounded-full min-h-12 min-w-12 bg-[#43963c] text-white font-bold flex items-center justify-center text-xl">
        <span>
          {userName.charAt(0)}
        </span>
      </div>
      <div className='flex flex-col flex-grow justify-center'>
        <p className="font-bold text-center" title={user?.name}>
          {(userName.length > 15) ? userName.substring(0, 12) + '...' : userName}
        </p>
        <Button variant="ghost" className='max-h-6 py-1' onClick={() => endSession()}>
          Sair
        </Button>
      </div>
    </div>
  )
}
