'use client'

import { httpClient } from '@/lib/httpClient'
import { useEffect, useState } from 'react'

export default function Home() {
  const [members, setMembers] = useState<any>([])

  useEffect(() => {
    const fetchMembers = async () => {
      const { data: { members } } = await httpClient.get('/member',{
        params: {
          skip: 0,
          take: 10
        }
      })

      setMembers(members)
    }

    fetchMembers()
  }, [])

  return (
    <div>
      {
        members.map((member: any, index: number) => (
          <p key={index}>
            {JSON.stringify(member)}
          </p>
        ))
      }
    </div>
  );
}
