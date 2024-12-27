'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useParams, useRouter } from 'next/navigation'
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
  applyCepMask,
  applyCnpjMask,
  applyCpfMask,
  captalize,
  formatDateTime,
  applyPhoneNumberMask,
  convertISODateToPTBR,
  leaveOnlyDigits,
  convertPTBRDateToISO
} from '@/lib/utils'
import { DetailsField } from '@/components/DetailsField'
import { DetailsRow } from '@/components/DetailsRow'
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { InputContainer } from '@/components/InputContainer'
import InputMask from "react-input-mask"
import { Label } from '@/components/ui/label'
import { Pencil, Trash2 } from 'lucide-react'
import { SELECT_DEFAULT_VALUE } from '@/lib/constants'
import { sendRequest } from '@/lib/sendRequest'
import { Separator } from '@/components/ui/separator'
import { STATE, STATUS } from '@/lib/enums'
import { useToast } from '@/components/ui/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function MemberDetailsPage() {
  // --------------------------- PAGE SETUP ---------------------------
  interface ICity {
    id: number
    name: string
  }

  interface IState {
    id: number
    name: string
  }

  interface IAddress {
    id: number;
    cep: string;
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: ICity;
    state: IState;
  }

  interface IRole {
    id: number;
    name: string;
  }

  interface IStatus {
    id: number;
    translation: string;
  }

  interface IClient {
    id: string
    cnpj: string
    fantasyName: string
  }

  interface IMemberFromAPI {
    id: string
    cpf: string
    name: string
    email: string
    phoneNumber: string
    birthDate: string
    role: IRole
    status: IStatus
    client: IClient
    address: IAddress
    createdAt: string
    updatedAt: string
  }

  const [member, setMember] = useState<IMemberFromAPI | null>(null)
  const [doesMemberHaveAddress, setDoesMemberHaveAddress] = useState<boolean>(false)

  const params = useParams()
  const { toast } = useToast()

  // --------------------------- FETCH MEMBER ---------------------------
  const fetchMember = async (id: string) => {
    const response = await sendRequest<{ member: IMemberFromAPI }>({
      endpoint: `/member/${id}`,
      method: 'GET',
    })

    if (response.error) {
      toast({
        description: response.message,
        variant: 'destructive'
      })

      setMember(null)

      return
    }

    fillUpdateForm(response.data.member)

    setDoesMemberHaveAddress(response.data.member.address !== null)
    setMember(response.data.member)
  }

  // --------------------------- UPDATE MEMBER ---------------------------
  type IMemberToBeUpdated = Partial<Omit<IMemberFromAPI, 'id' | 'cpf' | 'createdAt' | 'updatedAt' | 'role' | 'address' | 'status' | 'client'> & { address: Omit<IAddress, 'id' | 'state' | 'city'> & { cityId?: number } & { stateId?: number } | null }>

  const updateMemberFormSchema = z.object({
    name: z
      .string({ required_error: 'O campo Nome é obrigatório.' })
      .min(3, {  message: 'O campo Nome deve ter pelo menos 3 caracteres.' })
      .optional(),
    email: z
      .string({ required_error: 'O campo E-mail é obrigatório.' })
      .email({ message: 'O campo E-mail deve ser um e-mail válido.' })
      .optional(),
    phoneNumber: z
      .string({ required_error: 'O campo Telefone é obrigatório.' })
      .min(10, { message: 'O campo Telefone deve ter pelo menos 10 caracteres.' })
      .optional(),
    birthDate: z
      .string({ required_error: 'O campo Data de Nascimento é obrigatório.' })
      .length(10, { message: 'O campo Data de Nascimento deve ter pelo menos 10 caracteres.' })
      .optional(),
    address: z.object({
      cep: z
        .string({ required_error: 'O campo CEP é obrigatório.' })
        .length(8, { message: 'O campo CEP deve ter 8 caracteres.' })
        .optional(),
      street: z
        .string({ required_error: 'O campo Rua é obrigatório.' })
        .min(3, { message: 'O campo Rua deve ter pelo menos 3 caracteres.' })
        .optional(),
      number: z
        .string({ required_error: 'O campo Número é obrigatório.' })
        .optional(),
      complement: z
        .string({ required_error: 'O campo Complemento é obrigatório.' })
        .optional(),
      neighborhood: z
        .string({ required_error: 'O campo Bairro é obrigatório.' })
        .optional(),
      cityId: z
        .string({required_error: 'O campo Cidade é obrigatório.' })
        .min(1, { message: 'O campo Cidade é obrigatório.' })
        .optional(),
      stateId: z
        .string({required_error: 'O campo Estado é obrigatório.' })
        .min(1, { message: 'O campo Estado é obrigatório.' })
        .optional()
      })
      .nullable()
      .optional()
  })
  
  type UpdateMemberFormSchema = z.infer<typeof updateMemberFormSchema>
  
  const UPDATE_MEMBER_FORM_DEFAULT_VALUES = {
    name: '',
    email: '',
    phoneNumber: '',
    birthDate: '',
    address: null
  }

  const updateMemberForm = useForm<UpdateMemberFormSchema>({
    mode: 'onBlur',
    defaultValues: UPDATE_MEMBER_FORM_DEFAULT_VALUES,
    resolver: zodResolver(updateMemberFormSchema)
  })

  const fillUpdateForm = (member: IMemberFromAPI) => {
    updateMemberForm.setValue('name', member.name)
    updateMemberForm.setValue('email', member.email)
    updateMemberForm.setValue('phoneNumber', applyPhoneNumberMask(member.phoneNumber))
    updateMemberForm.setValue('birthDate', convertISODateToPTBR(member.birthDate))
    if (member.address === null) {
      updateMemberForm.setValue('address', null)
    } else {
      updateMemberForm.setValue('address.cep', member?.address?.cep ?? '')
      updateMemberForm.setValue('address.street', member?.address?.street ?? '')
      updateMemberForm.setValue('address.number', member?.address?.number ?? '')
      updateMemberForm.setValue('address.complement', member?.address?.complement ?? '')
      updateMemberForm.setValue('address.neighborhood', member?.address?.neighborhood ?? '')
      updateMemberForm.setValue('address.cityId', member?.address?.city?.id ? member.address.city.id.toString() : SELECT_DEFAULT_VALUE)
      updateMemberForm.setValue('address.stateId', member?.address?.state?.id ? member.address.state.id.toString() : SELECT_DEFAULT_VALUE)
    }
  }

  const formatUpdatedMemberData = (memberData: UpdateMemberFormSchema): IMemberToBeUpdated => {
    let stateId = memberData.address?.stateId
    let cityId = memberData.address?.cityId

    if (
      (stateId === SELECT_DEFAULT_VALUE) ||
      (stateId === '') ||
      (stateId === null)
    ) stateId = undefined
    if (
      (cityId === SELECT_DEFAULT_VALUE) ||
      (cityId === '') ||
      (cityId === null)
    ) cityId = undefined

    return {
      ...memberData,
      phoneNumber: leaveOnlyDigits(memberData.phoneNumber ?? ''),
      birthDate: convertPTBRDateToISO(memberData.birthDate ?? ''),
      address: doesMemberHaveAddress ? {
        cep: leaveOnlyDigits(memberData.address?.cep ?? ''),
        street: memberData.address?.street ?? '',
        number: memberData.address?.number ?? '',
        complement: memberData.address?.complement ?? '',
        neighborhood: memberData.address?.neighborhood ?? '',
        cityId: cityId !== undefined ? parseInt(cityId): cityId,
        stateId: stateId !== undefined ? parseInt(stateId): stateId
      } : null
    }
  }

  const updateMember = async (member: UpdateMemberFormSchema): Promise<void> => {
    const formattedMember = formatUpdatedMemberData(member)

    const response = await sendRequest<{ memberId: string }>({
      endpoint: `/member/${params.id}`,
      method: 'PATCH',
      data: formattedMember,
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

    fetchMember(params.id as string)
  }

  // --------------------------- ACTIVATE MEMBER ---------------------------
  const activateMember = async (id: string) => {
    const response = await sendRequest({
      endpoint: `/member/${id}/activate`,
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

    fetchMember(id)
  }

  // --------------------------- INACTIVATE MEMBER ---------------------------
  const inactivateMember = async (id: string) => {
    const response = await sendRequest({
      endpoint: `/member/${id}/inactivate`,
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

    fetchMember(id)
  }

  // --------------------------- DELETE MEMBER ---------------------------
  const deleteMember = async (id: string) => {
    const response = await sendRequest({
      endpoint: `/member/${id}/delete`,
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

    fetchMember(id)
  }

  // --------------------------- FETCH CITIES ---------------------------
  const selectedStateId = updateMemberForm.watch('address.stateId')

  const [cities, setCities] = useState<ICity[]>([])

  const formatCity = (city: ICity): ICity => ({
    ...city,
    name: captalize(city.name),
  })

  const fetchCities = async (stateId: string) => {
    const response = await sendRequest<
      { cities: ICity[] }
    >({
      endpoint: `/city/?state-id=${stateId}`,
      method: 'GET',
    })

    if (response.error) {
      toast({
        description: response.message,
        variant: 'destructive'
      })

      setCities([])

      return
    }

    const formattedCities = response.data.cities.map((city) => formatCity(city))

    setCities(formattedCities)
  }

  // --------------------------- USE EFFECT ---------------------------
  // Busca dados do associado quando a página carrega
  useEffect(() => {
    if (params.id) fetchMember(params.id as string)
  } , [params.id])

  // Carrega lista de cidades quando um estado é selecionado
  // e limpa cidade quando um estado diferente do atual é selecionado
  useEffect(() => {
    if (typeof selectedStateId === 'string' && selectedStateId !== SELECT_DEFAULT_VALUE) {
      fetchCities(selectedStateId)
    }

    if (selectedStateId !== member?.address?.state.id.toString()) {
      updateMemberForm.setValue('address.cityId', SELECT_DEFAULT_VALUE)
    }
  }, [selectedStateId])

  // --------------------------- RETURN ---------------------------
  return (
    <DashboardLayout
      title={`${member?.name || ''}`}
    >
      {/* Header Buttons */}
      <div className="flex justify-between w-full">
        <div className="flex gap-4 justify-end w-full">

          {/* Inactivate Member */}
          {
            member?.status.id === STATUS.Ativo && (
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
                    <Button onClick={() => inactivateMember(member.id)}>
                      Inativar
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )
          }

          {/* Activate Member */}
          {
            member?.status.id === STATUS.Inativo && (
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
                    <Button onClick={() => activateMember(member.id)}>
                      Ativar
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )
          }

          {/* Update Member */}
          {
            member
            && (
              <AlertDialog>
                <AlertDialogTrigger title='Editar' className='rounded-md w-9 h-9 bg-primary text-white flex flex-col justify-center'>
                  <Pencil  className='mx-auto'/>
                </AlertDialogTrigger>
                <AlertDialogContent className='max-h-screen overflow-y-auto max-w-[80%]'>
                  <AlertDialogTitle>Editar Associado</AlertDialogTitle>
                  <AlertDialogDescription>
                  <Form { ...updateMemberForm }>
                    <form
                      className='flex flex-col gap-4'
                      onSubmit={updateMemberForm.handleSubmit((data) => updateMember(data))}
                    >
                      <DetailsRow>
                        <InputContainer size="w-2/3">
                          <Label htmlFor="name">Nome</Label>
                          <Input className="bg-white" { ...updateMemberForm.register("name") } />
                          {
                            updateMemberForm.formState.errors.name
                              && <span className="text-red-500 text-xs">{updateMemberForm.formState.errors.name.message}</span>
                          }
                        </InputContainer>
                        <InputContainer size="w-1/3">
                          <Label htmlFor="birthDate">Data de Nascimento</Label>
                          <InputMask
                            className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            mask="99/99/9999"
                            { ...updateMemberForm.register("birthDate",) }
                          />
                          {
                            updateMemberForm.formState.errors.birthDate
                              && <span className="text-red-500 text-xs">{updateMemberForm.formState.errors.birthDate.message}</span>
                          }
                        </InputContainer>
                      </DetailsRow>

                      <DetailsRow>
                        <InputContainer size="w-1/3">
                          <Label htmlFor="email">E-mail</Label>
                          <Input className="bg-white" { ...updateMemberForm.register("email") } />
                          {
                            updateMemberForm.formState.errors.email
                              && <span className="text-red-500 text-xs">{updateMemberForm.formState.errors.email.message}</span>
                          }
                        </InputContainer>
                        <InputContainer size="w-1/3">
                          <Label htmlFor="phoneNumber">Telefone</Label>
                          <InputMask
                            className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            mask="(99) 999999999"
                            { ...updateMemberForm.register("phoneNumber",) }
                          />
                          {
                            updateMemberForm.formState.errors.phoneNumber
                              && <span className="text-red-500 text-xs">{updateMemberForm.formState.errors.phoneNumber.message}</span>
                          }
                        </InputContainer>
                        
                      </DetailsRow>

                      <Separator />

                      <DetailsRow>
                        <InputContainer size="w-1/5">
                          <Label htmlFor="address">Endereço cadastrado</Label>
                          <FormField
                            name="address"
                            render={() => (
                              <FormItem>
                                <Select
                                  onValueChange={(value) => setDoesMemberHaveAddress(value === 'true')}
                                  defaultValue={doesMemberHaveAddress.toString()}
                                >
                                  <FormControl>
                                    <SelectTrigger className="bg-white">
                                      <SelectValue placeholder="" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="true">Sim</SelectItem>
                                    <SelectItem value="false">Não</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                        </InputContainer>
                        {
                          doesMemberHaveAddress && (
                            <InputContainer size="w-1/5">
                              <Label htmlFor="address.cep">CEP</Label>
                              <Input className="bg-white" { ...updateMemberForm.register("address.cep") } />
                              {
                                updateMemberForm.formState.errors.address?.cep
                                  && <span className="text-red-500 text-xs">{updateMemberForm.formState.errors.address.cep.message}</span>
                              }
                            </InputContainer>
                          )
                        }
                        {
                          doesMemberHaveAddress && (
                            <InputContainer size="w-3/5">
                              <Label htmlFor="address.street">Rua</Label>
                              <Input className="bg-white" { ...updateMemberForm.register("address.street") } />
                              {
                                updateMemberForm.formState.errors.address?.street
                                  && <span className="text-red-500 text-xs">{updateMemberForm.formState.errors.address.street.message}</span>
                              }
                            </InputContainer>
                          )
                        }
                      </DetailsRow>

                      {
                        doesMemberHaveAddress && (
                          <DetailsRow>
                            <InputContainer size="w-1/5">
                              <Label htmlFor="address.number">Número</Label>
                              <Input className="bg-white" { ...updateMemberForm.register("address.number") } />
                              {
                                updateMemberForm.formState.errors.address?.number
                                  && <span className="text-red-500 text-xs">{updateMemberForm.formState.errors.address.number.message}</span>
                              }
                            </InputContainer>
                            <InputContainer size="w-1/5">
                              <Label htmlFor="address.complement">Complemento</Label>
                              <Input className="bg-white" { ...updateMemberForm.register("address.complement") } />
                              {
                                updateMemberForm.formState.errors.address?.complement
                                  && <span className="text-red-500 text-xs">{updateMemberForm.formState.errors.address.complement.message}</span>
                              }
                            </InputContainer>
                            <InputContainer size="w-1/5">
                              <Label htmlFor="address.neighborhood">Bairro</Label>
                              <Input className="bg-white" { ...updateMemberForm.register("address.neighborhood") } />
                              {
                                updateMemberForm.formState.errors.address?.neighborhood
                                  && <span className="text-red-500 text-xs">{updateMemberForm.formState.errors.address.neighborhood.message}</span>
                              }
                            </InputContainer>
                            <InputContainer size="w-1/5">
                              <Label htmlFor="address.stateId">Estado</Label>
                              <FormField
                                control={updateMemberForm.control}
                                name="address.stateId"
                                render={({ field }) => (
                                  <FormItem>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger className="bg-white">
                                          <SelectValue placeholder="" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                      {
                                        Object
                                          .entries(STATE)
                                          .filter(([key, _value]) => isNaN(Number(key)))
                                          .map(([key, value]) => (
                                            <SelectItem key={uuid()} value={value.toString()}>{key}</SelectItem>
                                          )
                                        )
                                      }
                                      </SelectContent>
                                    </Select>
                                  </FormItem>
                                )}
                              />
                              {
                                updateMemberForm.formState.errors.address?.stateId
                                  && <span className="text-red-500 text-xs">{updateMemberForm.formState.errors.address.stateId.message}</span>
                              }
                            </InputContainer>
                            <InputContainer size="w-1/5">
                              <Label htmlFor="address.cityId">Cidade</Label>
                              <FormField
                                control={updateMemberForm.control}
                                name="address.cityId"
                                render={({ field }) => (
                                  <FormItem>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger className="bg-white">
                                          <SelectValue placeholder="" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {
                                          cities.map(({ id, name }) => (
                                            <SelectItem key={uuid()} value={id.toString()}>{name}</SelectItem>
                                          ))
                                        }
                                      </SelectContent>
                                    </Select>
                                  </FormItem>
                                )}
                              />
                              {
                                updateMemberForm.formState.errors.address?.cityId
                                  && <span className="text-red-500 text-xs">{updateMemberForm.formState.errors.address.cityId.message}</span>
                              }
                            </InputContainer>
                          </DetailsRow>
                        )
                      }

                      <AlertDialogFooter>
                        <AlertDialogCancel type="button">Fechar</AlertDialogCancel>
                        <AlertDialogCancel type="button" onClick={() => fillUpdateForm(member)}>
                          Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction type="submit" disabled={!updateMemberForm.formState.isValid}>
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

          {/* Delete Member */}
          {
            member
            && [STATUS.Ativo, STATUS.Inativo].includes(member.status.id)
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
                    <Button variant="destructive" onClick={() => deleteMember(member.id)}>
                      Excluir
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )
          }
        </div>
      </div>

      {/* Member Details */}
      <div className='bg-white border rounded-md p-4 flex flex-col gap-4'>
        <DetailsRow>
          <DetailsField label="Nome" value={captalize(member?.name ?? '')} />
          <DetailsField label="CPF" value={applyCpfMask(member?.cpf ?? '')} width="min-w-60" />
        </DetailsRow>
        
        <DetailsRow>
          <DetailsField label="E-mail" value={member?.email ?? ''} />
          <DetailsField label="Telefone" value={applyPhoneNumberMask(member?.phoneNumber ?? '')}  width="min-w-60" />
        </DetailsRow>

        <DetailsRow>
          <DetailsField label="Data de Nascimento" value={convertISODateToPTBR(member?.birthDate ?? '')} />
          <DetailsField label="Status" value={captalize(member?.status.translation ?? '')} />
          <DetailsField label="Data do Cadastro" value={formatDateTime(member?.createdAt ?? '')} />
        </DetailsRow>

        <Separator />

        <DetailsRow>
          <DetailsField label="Nome do Cliente" value={captalize(member?.client.fantasyName ?? '')} />
          <DetailsField label="CNPJ do Cliente" value={applyCnpjMask(member?.client.cnpj ?? '')} width="min-w-60" />
        </DetailsRow>

        <Separator />

        <DetailsRow>
          <DetailsField label="CEP" value={applyCepMask(member?.address?.cep ?? '')} width="w-1/5"/>
          <DetailsField label="Rua" value={member?.address?.street ?? ''} width='w-full' />
        </DetailsRow>

        <DetailsRow>
          <DetailsField label="Número" value={member?.address?.number ?? ''} />
          <DetailsField label="Complemento" value={member?.address?.complement ?? ''} />
          <DetailsField label="Bairro" value={captalize(member?.address?.neighborhood ?? '')} />
          <DetailsField label="Cidade" value={captalize(member?.address?.city?.name ?? '')} />
          <DetailsField label="Estado" value={captalize(member?.address?.state?.name ?? '')} />
        </DetailsRow>
      </div>
    </DashboardLayout>
  )
}

{/*
<Accordion className="rounded-md border bg-background" type="single" collapsible>
  <AccordionItem value="item-1">
    <AccordionTrigger className="font-semibold">Histórico de Pedidos</AccordionTrigger>
    {
      member?.orders.map((order) => (
        <AccordionContent key={uuid()}>
          <div className='bg-white border rounded-md flex p-4 flex-col gap-4'>
            <div className="flex justify-between w-full">
                <h3 className='font-semibold'>{`Data do pedido: ${order.createdAt}`}</h3>

              <div className="flex gap-4">
                {
                  order?.status === STATUS[1] && (
                    <AlertDialog>
                      <AlertDialogTrigger className='uppercase px-8 h-9 text-sm font-medium rounded-md border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground'>Inativar</AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar inativação?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Essa ação poderá ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <Button onClick={() => inactivateOrder(order.id, member.id)}>
                            Inativar
                          </Button>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )
                }
                {
                  order?.status === STATUS[2] && (
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
                          <Button onClick={() => activateOrder(order.id, member.id)}>
                            Ativar
                          </Button>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )
                }
              </div>
            </div>

            <DetailsRow>
              <DetailsField label="Valor Total" value={order.totalValue} />
              <DetailsField label="Economia Total" value={order?.totalSavings} />
              <DetailsField label="Recorrente" value={order.isRecurring ? 'Sim' : 'Não'} />
              <DetailsField label="Status" value={order.status} />
            </DetailsRow>
            <Accordion className="rounded-md border bg-background" type="single" collapsible>
              <AccordionItem value="item-1">
                <AccordionTrigger className="font-semibold">Lista de Medicamentos</AccordionTrigger>
                {
                  order.items.map((item) => (
                    <AccordionContent key={uuid()}>
                      <div className='bg-white border rounded-md flex p-4 flex-col gap-4'>

                        <DetailsRow>
                          <DetailsField label="Nome do Medicamento" value={item.medicineName} />
                          <DetailsField label="Tipo de Medicamento" value={item.medicineType} />
                        </DetailsRow>

                        <DetailsRow>
                          <DetailsField label="Valor Unitário de Tabela" value={item.listPrice} />
                          <DetailsField label="Valor com Desconto" value={item?.discountPrice} />
                          <DetailsField label="Quantidade" value={item.quantity} />
                        </DetailsRow>
                      </div>
                    </AccordionContent>
                  ))}
              </AccordionItem>
            </Accordion>
          </div>
        </AccordionContent>
      ))}
  </AccordionItem>
</Accordion>
*/}
