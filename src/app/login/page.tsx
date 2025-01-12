'use client'

import { destroyCookie } from 'nookies'
import Image from 'next/image'
import { useEffect, useState } from 'react'
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
import { removeCpfMask } from '@/lib/utils'
import { sendRequest } from '@/lib/sendRequest'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from "@/components/ui/use-toast"
import { TicketPercent } from 'lucide-react'

export default function LoginPage() {
  // ------------------ Destroy session cookie on login page load ------------------
  const SESSION_COOKIE_NAME = process.env.NEXT_PUBLIC_SESSION_COOKIE_NAME as string

  useEffect(
    () => {
      destroyCookie(null, SESSION_COOKIE_NAME)
    }, []
  )

  // ------------------------------ Page Setup ------------------------------
  const { toast } = useToast()
  const { signIn } = useAuth()
  const { push } = useRouter()

  // --------------------- Control Rendered Component ----------------------
  enum COMPONENT {
    LOGIN = 1,
    REQUEST_RESET_PASSWORD = 2,
    RESET_PASSWORD = 3
  }

  const [component, setComponent] = useState<COMPONENT>(COMPONENT.LOGIN)

  // ------------------------------- Login -------------------------------
  const loginSchema = z.object({
    cpf: z
      .string({ required_error: 'O CPF é obrigatório.'})
      .length(11, 'O CPF deve ter 11 caracteres.'),
    password: z
      .string({ required_error: 'A senha é obrigatória.'})
      .min(8, 'A senha deve ter pelo menos 8 caracteres.'),
  })

  type LoginSchema = z.infer<typeof loginSchema>

  const loginForm = useForm<LoginSchema>({
    criteriaMode: 'all',
    defaultValues: { cpf: '', password: '' },
    mode: 'onBlur',
    resolver: zodResolver(loginSchema),
  })

  const submitLogin = async ({ cpf, password }: LoginSchema) => {
    try {
      await signIn({ cpf, password })

      toast({ description: 'Login realizado com sucesso!' })

      push('/painel/associados')
    } catch (error: any) {
      toast({
        description: error?.message,
        variant: "destructive"
      })

      push('/login')
    }
  }

  const renderLogin = () => (
    <Card className="w-80">
      <CardHeader className="flex flex-col justify-center text-center items-center">
        <TicketPercent color="#881ded" size={128}/>
        <CardDescription>Faça login para entrar no painel.</CardDescription>
      </CardHeader>

      <form onSubmit={loginForm.handleSubmit((data) => submitLogin(data))}>
        <CardContent>
          <div className="grid w-full items-center gap-4">

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="cpf">CPF</Label>
              <Input { ...loginForm.register("cpf") } type="text" />
              {loginForm.formState.errors.cpf && <span className="text-red-500 text-xs">{loginForm.formState.errors.cpf.message}</span>}
            </div>

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input { ...loginForm.register("password") } type="password" />
              {loginForm.formState.errors.password && <span className="text-red-500 text-xs">{loginForm.formState.errors.password.message}</span>}
            </div>

            <Button
              className='py-0 h-4'
              onClick={() => setComponent(COMPONENT.REQUEST_RESET_PASSWORD)}
              size="sm"
              type="button"
              variant="link"
            >
              Esqueci minha senha
            </Button>

          </div>
        </CardContent>

        <CardFooter className="flex justify-center">
          <Button disabled={!loginForm.formState.isValid} type="submit" className="w-full">Entrar</Button>
        </CardFooter>
      </form>
    </Card>
  )

  // ------------------------- Request Reset Password -------------------------
  const requestResetPasswordSchema = z.object({
    cpf: z
      .string({ required_error: 'O CPF é obrigatório.'})
      .min(11, 'O CPF deve ter 11 caracteres sem máscara ou 14 com máscara.')
      .max(14, 'O CPF deve ter 11 caracteres sem máscara ou 14 com máscara.'),
  })
  
  type RequestResetPasswordSchema = z.infer<typeof requestResetPasswordSchema>

  const requestResetPasswordForm = useForm<RequestResetPasswordSchema>({
    criteriaMode: 'all',
    defaultValues: { cpf: '' },
    mode: 'onBlur',
    resolver: zodResolver(requestResetPasswordSchema),
  })

  const submitRequestResetPassword = async ({ cpf }: RequestResetPasswordSchema) => {
    const response = await sendRequest({
      endpoint: '/auth/user/request-reset-password',
      method: 'POST',
      data: { cpf: removeCpfMask(cpf.trim()) },
    })

    if (response.error) {
      toast({
        description: response.message,
        variant: 'destructive'
      })
    } else {
      toast({
        description: response.message,
        variant: 'success'
      })

      setComponent(COMPONENT.RESET_PASSWORD)
    }
  }

  const renderRequestResetPassword = () => (
    <Card className="w-80">
      <CardHeader className="flex flex-col justify-center items-center text-center">
        <TicketPercent color="#881ded" size={128}/>
        <CardDescription>Digite o CPF para requisitar uma nova senha.</CardDescription>
      </CardHeader>

      <form onSubmit={requestResetPasswordForm.handleSubmit((data) => submitRequestResetPassword(data))}>
        <CardContent>
          <div className="grid w-full items-center gap-4">

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="cpf">CPF</Label>
              <Input { ...requestResetPasswordForm.register("cpf") } type="text" />
              {requestResetPasswordForm.formState.errors.cpf && <span className="text-red-500 text-xs">{requestResetPasswordForm.formState.errors.cpf.message}</span>}
            </div>

          </div>
        </CardContent>

        <CardFooter className="flex justify-center">
          <Button disabled={!requestResetPasswordForm.formState.isValid} type="submit" className="w-full">Enviar</Button>
        </CardFooter>
      </form>
    </Card>
  )

  // ------------------------- Reset Password -------------------------
  const resetPasswordSchema = z.object({
    cpf: z
      .string({ required_error: 'O CPF é obrigatório.'})
      .min(11, 'O CPF deve ter 11 caracteres sem máscara ou 14 com máscara.')
      .max(14, 'O CPF deve ter 11 caracteres sem máscara ou 14 com máscara.'),
    resetPasswordCode: z
      .string({ required_error: 'O Código de Recuperação é obrigatório.'})
      .length(6, 'O Código de Recuperação deve ter 6 caracteres.'),
    newPassword: z
      .string({ required_error: 'A nova Senha é obrigatório.'})
      .min(8, 'A nova Senha deve ter pelo menos 8 caracteres.'),
    repeatNewPassword: z
      .string({ required_error: 'A nova Senha é obrigatório.'})
      .min(8, 'A nova senha deve ter pelo menos 8 caracteres.'),
  })
  
  type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>

  const resetPasswordForm = useForm<ResetPasswordSchema>({
    criteriaMode: 'all',
    defaultValues: { cpf: '' },
    mode: 'onBlur',
    resolver: zodResolver(resetPasswordSchema),
  })

  const submitResetPassword = async (
    { cpf, resetPasswordCode, newPassword, repeatNewPassword }: ResetPasswordSchema
  ) => {
    if (newPassword !== repeatNewPassword) {
      toast({
        description: 'As senhas não coincidem.',
        variant: 'destructive'
      })
      return
    }

    const response = await sendRequest({
      endpoint: '/auth/user/reset-password',
      method: 'POST',
      data: {
        cpf: removeCpfMask(cpf.trim()),
        resetPasswordCode: resetPasswordCode.trim(),
        newPassword: newPassword.trim()
      },
    })

    if (response.error) {
      toast({
        description: response.message,
        variant: 'destructive'
      })
    } else {
      toast({
        description: response.message,
        variant: 'success'
      })

      window.location.reload()
    }
  }

  const renderResetPassword = () => (
    <Card className="w-80">
      <CardHeader className="flex flex-col justify-center items-center text-center">
        <TicketPercent color="#881ded" size={128}/>
        <CardDescription>Insira o Código de Redefinição e crie uma nova Senha.</CardDescription>
      </CardHeader>

      <form onSubmit={resetPasswordForm.handleSubmit((data) => submitResetPassword(data))}>
        <CardContent>
          <div className="grid w-full items-center gap-4">

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="cpf">CPF</Label>
              <Input { ...resetPasswordForm.register("cpf") } type="text" />
              {resetPasswordForm.formState.errors.cpf && <span className="text-red-500 text-xs">{resetPasswordForm.formState.errors.cpf.message}</span>}
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="resetPasswordCode">Código de Redefinição de Senha</Label>
              <Input { ...resetPasswordForm.register("resetPasswordCode") } type="text" />
              {resetPasswordForm.formState.errors.resetPasswordCode && <span className="text-red-500 text-xs">{resetPasswordForm.formState.errors.resetPasswordCode.message}</span>}
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <Input { ...resetPasswordForm.register("newPassword") } type="password" />
              {resetPasswordForm.formState.errors.newPassword && <span className="text-red-500 text-xs">{resetPasswordForm.formState.errors.newPassword.message}</span>}
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="repeatNewPassword">Repita a Nova Senha</Label>
              <Input { ...resetPasswordForm.register("repeatNewPassword") } type="password" />
              {resetPasswordForm.formState.errors.repeatNewPassword && <span className="text-red-500 text-xs">{resetPasswordForm.formState.errors.repeatNewPassword.message}</span>}
            </div>

          </div>
        </CardContent>

        <CardFooter className="flex justify-center">
          <Button disabled={!resetPasswordForm.formState.isValid} type="submit" className="w-full">Enviar</Button>
        </CardFooter>
      </form>
    </Card>
  )

  // ------------------------------ Return ------------------------------
  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      { component === COMPONENT.LOGIN && renderLogin() }
      { component === COMPONENT.REQUEST_RESET_PASSWORD && renderRequestResetPassword() }
      { component === COMPONENT.RESET_PASSWORD && renderResetPassword() }
    </main>
  )
}