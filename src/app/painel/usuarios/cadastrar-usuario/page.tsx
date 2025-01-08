'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { v4 as uuid } from 'uuid'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
import {
  applyCnpjMask,
  captalize,
  formatDateTime,
  removeCpfMask
} from '@/lib/utils'
import DashboardLayout from '@/components/DashboardLayout'
import { DetailsRow } from '@/components/DetailsRow'
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { InputContainer } from '@/components/InputContainer'
import InputMask from "react-input-mask"
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { sendRequest } from '@/lib/sendRequest'
import { ROLE } from '@/lib/enums'
import { useToast } from '@/components/ui/use-toast'
import { SELECT_DEFAULT_VALUE } from '@/lib/constants'

export default function RegisterUser() {
  // --------------------------- PAGE SETUP ---------------------------
  const { back } = useRouter()
  const { toast } = useToast()
  
  // --------------------------- CREATE USER ---------------------------
  interface IUserToBeCreated {
    clientId: string | null
    cpf: string
    email: string
    name: string
    password: string
    roleId: number
  }

  const createUserFormSchema = z.object({
    cpf: z
      .string({ required_error: 'O campo CPF é obrigatório.' })
      .min(11, { message: 'O campo CPF deve ter pelo menos 11 caracteres.' })
      .max(14, { message: 'O campo CPF deve ter no máximo 14 caracteres.' }),
    name: z
      .string({ required_error: 'O campo Nome é obrigatório.' })
      .min(3, {  message: 'O campo Nome deve ter pelo menos 3 caracteres.' }),
    email: z
      .string({ required_error: 'O campo E-mail é obrigatório.' })
      .email({ message: 'O campo E-mail deve ser um e-mail válido.' }),
    password: z
      .string({ required_error: 'O campo Senha é obrigatório.' })
      .min(8, { message: 'O campo Senha deve ter pelo menos 8 caracteres.' }),
    clientId: z
      .string({ required_error: 'O campo ID do Cliente é obrigatório.' })
      .nullable(),
    roleId: z
      .string({ required_error: 'O campo Nível de Acesso é obrigatório.' })
  })
  
  type CreateUserFormSchema = z.infer<typeof createUserFormSchema>
  
  const CREATE_USER_FORM_DEFAULT_VALUES: CreateUserFormSchema = {
    cpf: '',
    name: '',
    email: '',
    clientId: SELECT_DEFAULT_VALUE,
    password: '',
    roleId: SELECT_DEFAULT_VALUE
  }

  const createUserForm = useForm<CreateUserFormSchema>({
    mode: 'onBlur',
    defaultValues: CREATE_USER_FORM_DEFAULT_VALUES,
    resolver: zodResolver(createUserFormSchema)
  })

  const formatCreateUserData = (createUserData: CreateUserFormSchema): IUserToBeCreated => ({
    ...createUserData,
    cpf: removeCpfMask(createUserData.cpf ?? ''),
    roleId: parseInt(createUserData.roleId),
    clientId: createUserData.clientId === SELECT_DEFAULT_VALUE ? null : createUserData.clientId
  })

  const createUser = async (createUserData: CreateUserFormSchema): Promise<void> => {
    const formattedCreateUserData = formatCreateUserData(createUserData)

    const response = await sendRequest<{ userId: string }>({
      endpoint: '/user',
      method: 'POST',
      data: formattedCreateUserData
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

      back()
    }
  }

  // --------------------------- FETCH CLIENTS ---------------------------
  interface IClient {
    id: string
    cnpj: string
    fantasyName: string
    segment: string
    availableBalanceInCents: number
    createdAt: string
    city: {
      id: number
      name: string
    } | null
    state: {
      id: number
      name: string
    } | null
  }

  const [clients, setClients] = useState<IClient[]>([])

  const formatClient = (client: IClient): IClient => ({
    ...client,
    cnpj: applyCnpjMask(client.cnpj),
    fantasyName: captalize(client.fantasyName),
    segment: captalize(client.segment),
    createdAt: formatDateTime(client.createdAt),
    city: client.city ? {
      id: client.city.id,
      name: captalize(client.city.name)
    } : null,
    state: client.state ? {
      id: client.state.id,
      name: captalize(client.state.name)
    } : null
  })

  const fetchClients = async () => {
    const response = await sendRequest<{ clients: IClient[] }>({
      endpoint: '/client',
      method: 'GET',
    })

    if (response.error) {
      toast({
        description: response.message,
        variant: 'destructive'
      })

      setClients([])

      return
    }

    const formattedClients = response.data.clients.map((client) => formatClient(client))

    setClients(formattedClients)
  }

  // ------------------- WATCH CLIENT TO CONTROL ROLE -------------------
  const selectedClientId = createUserForm.watch('clientId')

  // --------------------------- USE EFFECT ---------------------------
  // Carrega lista de clientes quando a página carrega
  useEffect(() => {
    fetchClients()
  }, [])

  // Filtra lista de níveis de acesso de acordo com o cliente selecionado
  useEffect(() => {
    if (selectedClientId === SELECT_DEFAULT_VALUE) {
      createUserForm.setValue('roleId', ROLE.MASTER.toString())
    } else {
      createUserForm.setValue('roleId', ROLE.CLIENT_ADMIN.toString())
    }
  }, [selectedClientId])

  // --------------------------- RETURN ---------------------------
  return (
    <DashboardLayout title="Cadastrar Novo Usuário">
      <Form { ...createUserForm }>
        <form
          className='flex flex-col my-4 gap-4'
          onSubmit={createUserForm.handleSubmit((data) => createUser(data))}
        >
          <DetailsRow>
            <InputContainer size="w-1/4">
              <Label htmlFor="cpf">CPF</Label>
              <InputMask
                className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                mask="999.999.999-99"
                { ...createUserForm.register("cpf",) }
              />
              {
                createUserForm.formState.errors.cpf
                  && <span className="text-red-500 text-xs">{createUserForm.formState.errors.cpf.message}</span>
              }
            </InputContainer>
            <InputContainer size="w-3/4">
              <Label htmlFor="name">Nome</Label>
              <Input className="bg-white" { ...createUserForm.register("name") } />
              {
                createUserForm.formState.errors.name
                  && <span className="text-red-500 text-xs">{createUserForm.formState.errors.name.message}</span>
              }
            </InputContainer>
          </DetailsRow>

          <DetailsRow>
            <InputContainer size="w-1/3">
              <Label htmlFor="email">E-mail</Label>
              <Input className="bg-white" { ...createUserForm.register("email") } />
              {
                createUserForm.formState.errors.email
                  && <span className="text-red-500 text-xs">{createUserForm.formState.errors.email.message}</span>
              }
            </InputContainer>
            <InputContainer size="w-1/3">
              <Label htmlFor="password">Senha</Label>
              <Input type="password" className="bg-white" { ...createUserForm.register("password") } />
              {
                createUserForm.formState.errors.password
                  && <span className="text-red-500 text-xs">{createUserForm.formState.errors.password.message}</span>
              }
            </InputContainer>
            <InputContainer size="w-1/3">
              <Label htmlFor="clientId">Cliente</Label>
              <FormField
                control={createUserForm.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <Select onValueChange={field.onChange} defaultValue={field.value === null ? SELECT_DEFAULT_VALUE : field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem key={uuid()} value={SELECT_DEFAULT_VALUE}>SEM CLIENTE - USUÁRIO DO SISTEMA</SelectItem>
                        {
                          clients.map((client) => (
                            <SelectItem key={uuid()} value={client.id}>{client.fantasyName}</SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              {
                createUserForm.formState.errors.clientId
                  && <span className="text-red-500 text-xs">{createUserForm.formState.errors.clientId.message}</span>
              }
            </InputContainer>
          </DetailsRow>

          <Button className="my-4" disabled={!createUserForm.formState.isValid} type='submit'>
            Cadastrar Usuário
          </Button>
        </form>
      </Form>
    </DashboardLayout>
  )
}
