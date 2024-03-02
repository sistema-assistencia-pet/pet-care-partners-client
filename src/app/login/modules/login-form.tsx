import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginForm() {
  const [cpf, setCpf] = useState<string>('')
  const [password, setPassword] = useState<string>('')

  const router = useRouter()
  const { signIn } = useAuth()

  const submitLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      await signIn({ cpf, password })
      router.push('/painel')
    } catch (error) {
      router.push('/login')
    }
  }

  return (
    <Card className="w-80">
      <CardHeader className="flex flex-col justify-center text-center">
        <CardTitle>Farma4U</CardTitle>
        <CardDescription>Faça login para entrar no painel.</CardDescription>
      </CardHeader>
      <form onSubmit={submitLogin}>
        <CardContent>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                name="cpf"
                onChange={(event) => setCpf(event.target.value)}
                required
                value={cpf}
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                name="password"
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                required
                value={password}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button type="submit">Entrar</Button>
        </CardFooter>
      </form>
    </Card>
  )
}
