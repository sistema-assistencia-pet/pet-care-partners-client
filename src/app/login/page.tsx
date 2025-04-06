'use client'

import { destroyCookie } from 'nookies'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardHeader,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from "@/components/ui/use-toast"
import { PawPrint } from 'lucide-react'

export default function LoginPage() {
  // ------------------ Destroy session cookie on login page load ------------------
  const SESSION_COOKIE_NAME = process.env.NEXT_PUBLIC_PET_CARE_PARTNER_SESSION_COOKIE_NAME as string

  useEffect(
    () => {
      destroyCookie(null, SESSION_COOKIE_NAME)
    }, []
  )

  // ------------------------------ Page Setup ------------------------------
  const { toast } = useToast()
  const { signIn } = useAuth()
  const { push } = useRouter()

  // ------------------------------- Login -------------------------------
  const loginSchema = z.object({
    cnpj: z
      .string({ required_error: 'O CNPJ é obrigatório.'})
      .length(14, 'O CNPJ deve ter 14 caracteres.'),
    password: z
      .string({ required_error: 'A senha é obrigatória.'})
      .min(8, 'A senha deve ter pelo menos 8 caracteres.'),
  })

  type LoginSchema = z.infer<typeof loginSchema>

  const loginForm = useForm<LoginSchema>({
    criteriaMode: 'all',
    defaultValues: { cnpj: '', password: '' },
    mode: 'onBlur',
    resolver: zodResolver(loginSchema),
  })

  const submitLogin = async ({ cnpj, password }: LoginSchema) => {
    try {
      await signIn({ cnpj, password })

      toast({ description: 'Login realizado com sucesso!' })

      push('/painel/validar-voucher')
    } catch (error: any) {
      toast({
        description: error?.message,
        variant: "destructive"
      })

      push('/login')
    }
  }

  // ------------------------------ Return ------------------------------
  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <Card className="w-80">
        <CardHeader className="flex flex-col justify-center text-center items-center">
          <PawPrint color="#4f1381" size={128}/>
          <span className="text-center text-2xl font-bold text-secondary mb-4">Pet Care</span>
          <CardDescription>Bem vindo, parceiro! Faça login para entrar no painel e validar nossos vouchers.</CardDescription>
        </CardHeader>

        <form onSubmit={loginForm.handleSubmit((data) => submitLogin(data))}>
          <CardContent>
            <div className="grid w-full items-center gap-4">

              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input { ...loginForm.register("cnpj") } type="text" />
                {loginForm.formState.errors.cnpj && <span className="text-red-500 text-xs">{loginForm.formState.errors.cnpj.message}</span>}
              </div>

              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="password">Senha</Label>
                <Input { ...loginForm.register("password") } type="password" />
                {loginForm.formState.errors.password && <span className="text-red-500 text-xs">{loginForm.formState.errors.password.message}</span>}
              </div>

            </div>
          </CardContent>

          <CardFooter className="flex justify-center">
            <Button disabled={!loginForm.formState.isValid} type="submit" className="w-full">Entrar</Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  )
}
