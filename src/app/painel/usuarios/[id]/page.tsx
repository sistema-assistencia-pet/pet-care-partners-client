'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useParams } from 'next/navigation'
import { v4 as uuid } from 'uuid'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from '@/components/ui/button'
import DashboardLayout from '@/components/DashboardLayout'
import {
  applyCnpjMask,
  applyCpfMask,
  captalize,
  formatDateTime,
} from '@/lib/utils'
import { DetailsField } from '@/components/DetailsField'
import { DetailsRow } from '@/components/DetailsRow'
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { InputContainer } from '@/components/InputContainer'
import { Label } from '@/components/ui/label'
import { Pencil, Trash2 } from 'lucide-react'
import { SELECT_DEFAULT_VALUE } from '@/lib/constants'
import { sendRequest } from '@/lib/sendRequest'
import { Separator } from '@/components/ui/separator'
import { ROLE, STATUS } from '@/lib/enums'
import { useToast } from '@/components/ui/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

export default function UserDetailsPage() {
  // --------------------------- PAGE SETUP ---------------------------
  interface IRole {
    id: number;
    translation: string;
  }

  interface IStatus {
    id: number;
    translation: string;
  }

  interface IClientMinData {
    id: string
    fantasyName: string
  }

  interface IUserFromAPI {
    id: string
    name: string
    cpf: string
    email: string
    createdAt: string
    updatedAt: string
    status: IStatus
    role: IRole
    client: IClientMinData | null
  }

  const [user, setUser] = useState<IUserFromAPI | null>(null)

  const params = useParams()
  const { toast } = useToast()

  // --------------------------- FETCH USER ---------------------------
  const fetchUser = async (id: string) => {
    const response = await sendRequest<{ user: IUserFromAPI }>({
      endpoint: `/user/${id}`,
      method: 'GET',
    })

    if (response.error) {
      toast({
        description: response.message,
        variant: 'destructive'
      })

      setUser(null)

      return
    }

    fillUpdateForm(response.data.user)

    setUser(response.data.user)
  }

  // --------------------------- UPDATE USER ---------------------------
  type IUserToBeUpdated = Partial<Pick<IUserFromAPI, 'email' | 'name'> & { clientId: string | null, roleId: number }>

  const updateUserFormSchema = z.object({
    name: z
      .string({ required_error: 'O campo Nome é obrigatório.' })
      .min(3, {  message: 'O campo Nome deve ter pelo menos 3 caracteres.' })
      .optional(),
    email: z
      .string({ required_error: 'O campo E-mail é obrigatório.' })
      .email({ message: 'O campo E-mail deve ser um e-mail válido.' })
      .optional(),
    clientId: z
      .string({ required_error: 'O campo ID do Cliente é obrigatório.' })
      .nullable()
      .optional(),
    roleId: z
      .string({ required_error: 'O campo Nível de Acesso é obrigatório.' })
      .optional()
  })

  type UpdateUserFormSchema = z.infer<typeof updateUserFormSchema>
  
  const UPDATE_USER_FORM_DEFAULT_VALUES = {
    name: '',
    email: '',
    clientId: SELECT_DEFAULT_VALUE,
    roleId: SELECT_DEFAULT_VALUE
  }

  const updateUserForm = useForm<UpdateUserFormSchema>({
    mode: 'onBlur',
    defaultValues: UPDATE_USER_FORM_DEFAULT_VALUES,
    resolver: zodResolver(updateUserFormSchema)
  })

  const fillUpdateForm = (user: IUserFromAPI) => {
    updateUserForm.setValue('name', user.name)
    updateUserForm.setValue('email', user.email)
    updateUserForm.setValue('clientId', user.client?.id ?? SELECT_DEFAULT_VALUE)
    updateUserForm.setValue('roleId', user.role.id.toString())
  }

  const formatUpdatedUserData = (userData: UpdateUserFormSchema): IUserToBeUpdated => ({
    ...userData,
    roleId: parseInt(userData.roleId ?? ''),
    clientId: userData.clientId === SELECT_DEFAULT_VALUE ? null : userData.clientId
  })

  const updateUser = async (user: UpdateUserFormSchema): Promise<void> => {
    const formattedUser = formatUpdatedUserData(user)

    const response = await sendRequest<{ userId: string }>({
      endpoint: `/user/${params.id}`,
      method: 'PATCH',
      data: formattedUser,
    })

    if (response.error) {
      toast({
        description: response.message,
        variant: 'destructive'
      })

      return
    }

    toast({
      description: response.message,
      variant: "success"
    })

    fetchUser(params.id as string)
  }

  // --------------------------- ACTIVATE USER ---------------------------
  const activateUser = async (id: string) => {
    const response = await sendRequest({
      endpoint: `/user/${id}/activate`,
      method: 'PATCH',
    })

    if (response.error) {
      toast({
        description: response.message,
        variant: 'destructive'
      })

      return
    }

    toast({
      description: response.message,
      variant: "success"
    })

    fetchUser(id)
  }

  // --------------------------- INACTIVATE USER ---------------------------
  const inactivateUser = async (id: string) => {
    const response = await sendRequest({
      endpoint: `/user/${id}/inactivate`,
      method: 'PATCH',
    })

    if (response.error) {
      toast({
        description: response.message,
        variant: 'destructive'
      })

      return
    }

    toast({
      description: response.message,
      variant: "success"
    })

    fetchUser(id)
  }

  // --------------------------- DELETE USER ---------------------------
  const deleteUser = async (id: string) => {
    const response = await sendRequest({
      endpoint: `/user/${id}/delete`,
      method: 'PATCH',
    })

    if (response.error) {
      toast({
        description: response.message,
        variant: 'destructive'
      })

      return
    }

    toast({
      description: response.message,
      variant: "success"
    })

    fetchUser(id)
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
  const selectedClientId = updateUserForm.watch('clientId')

  // --------------------------- USE EFFECT ---------------------------
  // Busca dados do usuário quando a página carrega
  useEffect(() => {
    if (params.id) fetchUser(params.id as string)
  } , [params.id])

  // Filtra lista de níveis de acesso de acordo com o cliente selecionado
  useEffect(() => {
    if (selectedClientId === SELECT_DEFAULT_VALUE) {
      updateUserForm.setValue('roleId', ROLE.MASTER.toString())
    } else {
      updateUserForm.setValue('roleId', ROLE.CLIENT_ADMIN.toString())
    }
  }, [selectedClientId])

  // Carrega lista de clientes quando a página carrega
  useEffect(() => {
    fetchClients()
  }, [])

  // --------------------------- RETURN ---------------------------
  return (
    <DashboardLayout
      title={`${user?.name || ''}`}
    >
      {/* Header Buttons */}
      <div className="flex justify-between w-full">
        <div className="flex gap-4 justify-end w-full">

          {/* Inactivate User */}
          {
            user?.status.id === STATUS.Ativo && (
              <AlertDialog>
                <AlertDialogTrigger className='uppercase text-sm font-medium px-8 h-9 rounded-md border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground'>Inativar</AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar inativação?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Essa ação poderá ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <Button onClick={() => inactivateUser(user.id)}>
                      Inativar
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )
          }

          {/* Activate User */}
          {
            user?.status.id === STATUS.Inativo && (
              <AlertDialog>
                <AlertDialogTrigger className='uppercase px-8 h-9 text-sm font-medium rounded-md border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground'>Ativar</AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar ativação?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Essa ação poderá ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <Button onClick={() => activateUser(user.id)}>
                      Ativar
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )
          }

          {/* Update User */}
          {
            user
            && (
              <AlertDialog>
                <AlertDialogTrigger title='Editar' className='rounded-md w-9 h-9 bg-primary text-white flex flex-col justify-center'>
                  <Pencil  className='mx-auto'/>
                </AlertDialogTrigger>
                <AlertDialogContent className='max-h-screen overflow-y-auto max-w-[80%]'>
                  <AlertDialogTitle>Editar Usuário</AlertDialogTitle>
                  <AlertDialogDescription>
                  <Form { ...updateUserForm }>
                    <form
                      className='flex flex-col gap-4'
                      onSubmit={updateUserForm.handleSubmit((data) => updateUser(data))}
                    >
                      <DetailsRow>
                        <InputContainer size="w-full">
                          <Label htmlFor="name">Nome</Label>
                          <Input className="bg-white" { ...updateUserForm.register("name") } />
                          {
                            updateUserForm.formState.errors.name
                              && <span className="text-red-500 text-xs">{updateUserForm.formState.errors.name.message}</span>
                          }
                        </InputContainer>
                      </DetailsRow>

                      <DetailsRow>
                        <InputContainer size="w-1/2">
                          <Label htmlFor="email">E-mail</Label>
                          <Input className="bg-white" { ...updateUserForm.register("email") } />
                          {
                            updateUserForm.formState.errors.email
                              && <span className="text-red-500 text-xs">{updateUserForm.formState.errors.email.message}</span>
                          }
                        </InputContainer>
                        <InputContainer size="w-1/2">
                          <Label htmlFor="clientId">Cliente</Label>
                          <FormField
                            control={updateUserForm.control}
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
                            updateUserForm.formState.errors.clientId
                              && <span className="text-red-500 text-xs">{updateUserForm.formState.errors.clientId.message}</span>
                          }
                        </InputContainer>
                      </DetailsRow>

                      <AlertDialogFooter>
                        <AlertDialogCancel type="button">Fechar</AlertDialogCancel>
                        <AlertDialogCancel type="button" onClick={() => fillUpdateForm(user)}>
                          Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction type="submit" disabled={!updateUserForm.formState.isValid}>
                          Confirmar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </form>
                  </Form>
                  </AlertDialogDescription>
                </AlertDialogContent>
              </AlertDialog>
            )
          }

          {/* Delete User */}
          {
            user
            && [STATUS.Ativo, STATUS.Inativo].includes(user.status.id)
            && (
              <AlertDialog>
                <AlertDialogTrigger title='Excluir' className='rounded-md w-9 h-9 bg-destructive text-white flex flex-col justify-center'>
                  <Trash2  className='mx-auto'/>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar exclusão?</AlertDialogTitle>
                    <AlertDialogDescription>
                      A operação <strong className='text-black'>não</strong> poderá ser desfeita!
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <Button variant="destructive" onClick={() => deleteUser(user.id)}>
                      Excluir
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )
          }
        </div>
      </div>

      {/* User Details */}
      <div className='bg-white border rounded-md p-4 flex flex-col gap-4'>
        <DetailsRow>
          <DetailsField label="Nome" value={captalize(user?.name ?? '')} />
          <DetailsField label="CPF" value={applyCpfMask(user?.cpf ?? '')} width="min-w-60" />
        </DetailsRow>

        <DetailsRow>
          <DetailsField label="E-mail" value={user?.email ?? ''} />
          <DetailsField label="Status" value={captalize(user?.status.translation ?? '')} />
          <DetailsField label="Data do Cadastro" value={formatDateTime(user?.createdAt ?? '')} />
        </DetailsRow>

        <Separator />

        <DetailsRow>
          <DetailsField label="Nível de Acesso" value={captalize(user?.role.translation ?? '')} />
          <DetailsField label="Nome do Cliente" value={captalize(user?.client?.fantasyName ?? '')} />
        </DetailsRow>
      </div>
    </DashboardLayout>
  )
}
