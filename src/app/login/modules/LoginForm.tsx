import Image from 'next/image'
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
import logo from '../../../../public/logo-f4u-png.png'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from "@/components/ui/use-toast"

const loginSchema = z.object({
  cpf: z
    .string({ invalid_type_error: 'O CPF é obrigatório.'})
    .length(11, 'O CPF deve ter 11 caracteres.'),
  password: z
    .string({ invalid_type_error: 'A senha é obrigatória.'})
    .min(8, 'A senha deve ter pelo menos 8 caracteres.'),
})

type LoginSchema = z.infer<typeof loginSchema>

export default function LoginForm() {
  const {
    formState: { errors, isValid },
    handleSubmit,
    register
  } = useForm<LoginSchema>({
    criteriaMode: 'all',
    defaultValues: { cpf: '', password: '' },
    mode: 'onBlur',
    resolver: zodResolver(loginSchema),
  })
  const { toast } = useToast()

  const { signIn } = useAuth()
  const { push } = useRouter()

  const submitLogin = async ({ cpf, password }: LoginSchema) => {
    try {
      await signIn({ cpf, password })

      toast({
        description: "Login efetuado com sucesso!"
      })

      push('/painel/associados')
    } catch (error: any) {
      toast({
        description: error?.message,
        variant: "destructive"
      })

      push('/login')
    }
  }

  return (
    <Card className="w-80">
      <CardHeader className="flex flex-col justify-center text-center">
        <Image className="rounded-md px-2" src={logo} alt="Farma4U" />
        <CardDescription>Faça login para entrar no painel.</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit((data) => submitLogin(data))}>
        <CardContent>
          <div className="grid w-full items-center gap-4">

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="cpf">CPF</Label>
              <Input { ...register("cpf") } type="text" />
              {errors.cpf && <span className="text-red-500 text-xs">{errors.cpf.message}</span>}
            </div>

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input { ...register("password") } type="password" />
              {errors.password && <span className="text-red-500 text-xs">{errors.password.message}</span>}
            </div>

          </div>
        </CardContent>

        <CardFooter className="flex justify-center">
          <Button disabled={!isValid} type="submit">Entrar</Button>
        </CardFooter>
      </form>
    </Card>
  )
}
