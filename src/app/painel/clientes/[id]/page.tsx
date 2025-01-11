'use client'

import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
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
import {
  applyCnpjMask,
  captalize,
  formatCurrency,
  formatDateTime,
  applyPhoneNumberMask,
  removeCnpjMask,
  leaveOnlyDigits,
  applyCepMask,
  transformCurrencyFromCentsToBRLString,
  transformCurrencyFromBRLStringToCents
} from '@/lib/utils'
import { Button } from '@/components/ui/button'
import DashboardLayout from '@/components/DashboardLayout'
import { DetailsField } from '@/components/DetailsField'
import { DetailsRow } from '@/components/DetailsRow'
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { InputContainer } from '@/components/InputContainer'
import InputMask from "react-input-mask"
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { Pencil, Trash2 } from 'lucide-react'
import { sendRequest } from '@/lib/sendRequest'
import { Separator } from '@/components/ui/separator'
import { STATE, STATUS } from '@/lib/enums'
import { useToast } from '@/components/ui/use-toast'
import { SELECT_DEFAULT_VALUE } from '@/lib/constants'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function ClientDetailsPage() {
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

  interface IStatus {
    id: number;
    translation: string;
  }

  interface IClientFromAPI {
    id: string
    cnpj: string
    corporateName: string
    fantasyName: string
    segment: string
    managerName: string
    managerPhoneNumber: string
    managerEmail: string
    financePhoneNumber: string
    lumpSumInCents: number
    unitValueInCents: number
    contractUrl: string
    availableBalanceInCents: number
    address: IAddress,
    status: IStatus,
    createdAt: string
    updatedAt: string
  }

  const [client, setClient] = useState<IClientFromAPI | null>(null)
  const [doesPartnerHaveAddress, setDoesPartnerHaveAddress] = useState<boolean>(false)

  const params = useParams()
  const { push } = useRouter()
  const { toast } = useToast()

  // --------------------------- FETCH CLIENT ---------------------------
  const fillUpdateForm = (client: IClientFromAPI) => {
    updateClientForm.setValue('cnpj', client.cnpj)
    updateClientForm.setValue('fantasyName', client.fantasyName)
    updateClientForm.setValue('corporateName', client.corporateName)
    updateClientForm.setValue('segment', client.segment)
    updateClientForm.setValue('managerName', client.managerName)
    updateClientForm.setValue('managerPhoneNumber', client.managerPhoneNumber)
    updateClientForm.setValue('managerEmail', client.managerEmail)
    updateClientForm.setValue('financePhoneNumber', client.financePhoneNumber)
    updateClientForm.setValue('lumpSumInCents', (client.lumpSumInCents / 100).toFixed(2))
    updateClientForm.setValue('unitValueInCents', (client.unitValueInCents / 100).toFixed(2))
    updateClientForm.setValue('contractUrl', client.contractUrl)
    if (client.address === null) {
      updateClientForm.setValue('address', null)
    } else {
      updateClientForm.setValue('address.cep', client?.address?.cep ?? '')
      updateClientForm.setValue('address.street', client?.address?.street ?? '')
      updateClientForm.setValue('address.number', client?.address?.number ?? '')
      updateClientForm.setValue('address.complement', client?.address?.complement ?? '')
      updateClientForm.setValue('address.neighborhood', client?.address?.neighborhood ?? '')
      updateClientForm.setValue('address.cityId', client?.address?.city?.id ? client.address.city.id.toString() : SELECT_DEFAULT_VALUE)
      updateClientForm.setValue('address.stateId', client?.address?.state?.id ? client.address.state.id.toString() : SELECT_DEFAULT_VALUE)
    }
  }

  const fetchClient = async (id: string) => {
    const response = await sendRequest<{ client: IClientFromAPI }>({
      endpoint: `/client/${id}`,
      method: 'GET',
    })

    if (response.error) {
      toast({
        description: response.message,
        variant: 'destructive'
      })

      setClient(null)

      return
    }

    fillUpdateForm(response.data.client)

    setDoesPartnerHaveAddress(response.data.client.address !== null)
    setClient(response.data.client)
  }

  // --------------------------- UPDATE CLIENT ---------------------------
  type IClientToBeUpdated = Partial<Omit<IClientFromAPI, 'id' | 'createdAt' | 'updatedAt' | 'address' | 'status' | 'lumpSum' | 'unitValue' | 'availableBalanceInCents'> & { lumpSum: string, unitValue: string, address: Omit<IAddress, 'id' | 'state' | 'city'> & { cityId?: number } & { stateId?: number } | null }>

  const updateClientFormSchema = z.object({
    cnpj: z
      .string({ required_error: 'O campo CNPJ é obrigatório.' })
      .length(18, { message: 'O campo CNPJ deve ter 18 caracteres.' })
      .optional(),
    corporateName: z
      .string({ required_error: 'O campo Razão Social é obrigatório.' })
      .optional(),
    fantasyName: z
      .string({ required_error: 'O campo Nome Fantasia é obrigatório.' })
      .optional(),
    segment: z
      .string({ required_error: 'O campo Segmento é obrigatório.' })
      .optional(),
    managerName: z
      .string({required_error: 'O campo Nome do Responsável é obrigatório.'})
      .min(3, {message: 'O campo Nome do Responsável deve ter pelo menos 3 caracteres.'})
      .optional(),
    managerPhoneNumber: z
      .string({ required_error: 'O campo Telefone do Responsável é obrigatório.' })
      .min(14, { message: 'O campo Telefone do Responsável deve ter 10 ou 11 caracteres.' })
      .max(15, { message: 'O campo Telefone do Responsável deve ter 10 ou 11 caracteres.' })
      .optional(),
    managerEmail: z
      .string({ required_error: 'O campo E-mail do Responsável é obrigatório.' })
      .email({ message: 'O campo E-mail do Responsável deve ser um e-mail válido.' })
      .optional(),
    financePhoneNumber: z
      .string({ required_error: 'O campo Telefone do Financeiro é obrigatório.' })
      .min(14, { message: 'O campo Telefone do Financeiro deve ter 10 ou 11 caracteres.' })
      .max(15, { message: 'O campo Telefone do Financeiro deve ter 10 ou 11 caracteres.' })
      .optional(),
    lumpSumInCents: z
      .string({ required_error: 'O campo Valor do Boleto é obrigatório.' })
      .optional(),
    unitValueInCents: z
      .string({ required_error: 'O campo Valor Unitário é obrigatório.' })
      .optional(),
    contractUrl: z
      .string({ required_error: 'O campo URL do Contrato é obrigatório.' })
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

  type UpdateClientFormSchema = z.infer<typeof updateClientFormSchema>

  const UPDATE_CLIENT_FORM_DEFAULT_VALUES = {
    cnpj: '',
    corporateName: '',
    fantasyName: '',
    segment: '',
    managerName: '',
    managerPhoneNumber: '',
    managerEmail: '',
    financePhoneNumber: '',
    lumpSum: '',
    unitValue: '',
    contractUrl: '',
    address: {
      cep: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      cityId: SELECT_DEFAULT_VALUE,
      stateId: SELECT_DEFAULT_VALUE
    }
  }

  const updateClientForm = useForm<UpdateClientFormSchema>({
    mode: 'onBlur',
    defaultValues: UPDATE_CLIENT_FORM_DEFAULT_VALUES,
    resolver: zodResolver(updateClientFormSchema)
  })

  const formatUpdatedClientData = (updateClientData: UpdateClientFormSchema): IClientToBeUpdated => {
    let stateId = updateClientData.address?.stateId
    let cityId = updateClientData.address?.cityId

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
      ...updateClientData,
      cnpj: removeCnpjMask(updateClientData.cnpj ?? ''),
      managerPhoneNumber: leaveOnlyDigits(updateClientData.managerPhoneNumber ?? ''),
      financePhoneNumber: leaveOnlyDigits(updateClientData.financePhoneNumber ?? ''),
      unitValueInCents: transformCurrencyFromBRLStringToCents(updateClientData.unitValueInCents ?? ''),
      lumpSumInCents: transformCurrencyFromBRLStringToCents(updateClientData.lumpSumInCents ?? ''),
      address: {
        cep: updateClientData.address?.cep ?? '',
        street: updateClientData.address?.street ?? '',
        number: updateClientData.address?.number ?? '',
        complement: updateClientData.address?.complement ?? '',
        neighborhood: updateClientData.address?.neighborhood ?? '',
        cityId: cityId !== undefined ? parseInt(cityId): cityId,
        stateId: stateId !== undefined ? parseInt(stateId): stateId
      }
    }
  }

  const updateClient = async (client: UpdateClientFormSchema) => {
    const formattedClient = formatUpdatedClientData(client)

    const response = await sendRequest<{ clientId: string }>({
      endpoint: `/client/${params.id}`,
      method: 'PATCH',
      data: formattedClient,
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

    fetchClient(params.id as string)
  }

  // --------------------------- CREATE MANY MEMBERS ---------------------------
  const [fileSelected, setFileSelected] = useState<File | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files

    if (files && files.length > 0) {
      const file = files[0]

      if (file.type === "text/csv") {
        setFileSelected(file)
      } else {
        toast({
          description: "O arquivo selecionado não tem a extensão .csv",
          variant: "destructive"
        })
        setFileSelected(null)
      }
    }
  }

  const sendCSVToCreateMembers = async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)

    const response = await sendRequest({
      endpoint: `/member/${params.id}/create-in-bulk`,
      method: 'POST',
      data: formData,
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
  }

  // --------------------------- ACTIVATE CLIENT ---------------------------
  const activateClient = async (id: string) => {
    const response = await sendRequest({
      endpoint: `/client/${id}/activate`,
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

    fetchClient(id)
  }

  // --------------------------- INACTIVATE CLIENT ---------------------------
  const inactivateClient = async (id: string) => {
    const response = await sendRequest({
      endpoint: `/client/${id}/inactivate`,
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

    fetchClient(id)
  }

  // --------------------------- DELETE CLIENT ---------------------------
  const deleteClient = async (id: string) => {
    const response = await sendRequest({
      endpoint: `/client/${id}/delete`,
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

    fetchClient(id)
  }

  // --------------------------- FETCH CITIES ---------------------------
  const selectedStateId = updateClientForm.watch('address.stateId')

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
  // Dispara envio do arquivo CSV para criação de associados
  useEffect(() => {
    if (fileSelected) {
      sendCSVToCreateMembers(fileSelected)
    }
  }, [fileSelected])

  // Busca dados do cliente ao carregar a página
  useEffect(() => {
    if (params.id) fetchClient(params.id as string)
  } , [params.id])

  // Carrega lista de cidades quando um estado é selecionado
  // e limpa cidade quando um estado diferente do atual é selecionado
  useEffect(() => {
    if (typeof selectedStateId === 'string' && selectedStateId !== SELECT_DEFAULT_VALUE) {
      fetchCities(selectedStateId)
    }

    if (selectedStateId !== client?.address?.state.id.toString()) {
      updateClientForm.setValue('address.cityId', SELECT_DEFAULT_VALUE)
    }
  }, [selectedStateId])

  // --------------------------- RETURN ---------------------------
  return (
    <DashboardLayout
      title={`${client?.fantasyName || ''}`}
    >
      {/* Header Buttons */}
      <div className="flex justify-between w-full">

        {/* Create Members */}
        <div className="flex gap-4">
          <Label
            htmlFor="file-input"
            className="uppercase bg-primary text-primary-foreground shadow hover:bg-primary/90 leading-9 rounded-md px-8 cursor-pointer"
          >
            Cadastrar Associados em Lote
          </Label>
          <Input
            accept=".csv"
            disabled={client?.status.id !== STATUS.Ativo}
            className="hidden"
            id="file-input"
            onChange={handleFileChange}
            type="file"
            multiple={false}
            placeholder='Cadastrar Associados em Lote'
          />
          <Button
            disabled={client?.status.id !== STATUS.Ativo}
            onClick={() => push(`/painel/clientes/${params.id}/cadastrar-associado`)}
            variant="secondary"
          >
            Cadastrar Um Associado
          </Button>
        </div>

        {/* Client Actions */}
        <div className="flex gap-4">

          {/* Inactivate Client */}
          {
            client?.status.id === STATUS.Ativo && (
              <AlertDialog>
                <AlertDialogTrigger className='uppercase px-8 h-9 text-sm font-medium rounded-md border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground'>Inativar</AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar inativação?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Todos os associados do cliente também serão inativados!
                    </AlertDialogDescription>
                    <AlertDialogDescription>
                      Depois disso, <strong className='text-black'>não</strong> será possível ativar apenas os associados que já eram ativos antes dessa ação, será necessário reinativar todos.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <Button onClick={() => inactivateClient(client.id)}>
                      Inativar
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )
          }

          {/* Activate Client */}
          {
            client?.status.id === STATUS.Inativo && (
              <AlertDialog>
                <AlertDialogTrigger className='uppercase px-8 h-9 rounded-md text-sm font-medium border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground'>Ativar</AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar ativação?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Todos os associados do cliente também serão ativados!
                    </AlertDialogDescription>
                    <AlertDialogDescription>
                      Depois disso, <strong className='text-black'>não</strong> será possível inativar apenas os associados que já eram inativos antes dessa ação, será necessário reativar todos.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <Button onClick={() => activateClient(client.id)}>
                      Ativar
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )
          }

          {/* Update Client */}
          {
            client
            && (
              <AlertDialog>
                <AlertDialogTrigger title='Editar' className='rounded-md w-9 h-9 bg-primary text-white flex flex-col justify-center'>
                  <Pencil  className='mx-auto'/>
                </AlertDialogTrigger>
                <AlertDialogContent className='max-h-screen overflow-y-auto max-w-[80%]'>
                  <AlertDialogTitle>Editar Cliente</AlertDialogTitle>
                  <Form { ...updateClientForm }>
                    <form
                      className='flex flex-col gap-4'
                      onSubmit={updateClientForm.handleSubmit((data) => updateClient(data))}
                    >
                      <DetailsRow>
                        <InputContainer size="w-1/2">
                          <Label htmlFor="fantasyName">Nome Fantasia</Label>
                          <Input className="bg-white" { ...updateClientForm.register("fantasyName") } />
                          {
                            updateClientForm.formState.errors.fantasyName
                              && <span className="text-red-500 text-xs">{updateClientForm.formState.errors.fantasyName.message}</span>
                          }
                        </InputContainer>
                        <InputContainer size="w-1/2">
                          <Label htmlFor="corporateName">Razão Social</Label>
                          <Input className="bg-white" { ...updateClientForm.register("corporateName") } />
                          {
                            updateClientForm.formState.errors.corporateName
                              && <span className="text-red-500 text-xs">{updateClientForm.formState.errors.corporateName.message}</span>
                          }
                        </InputContainer>
                      </DetailsRow>

                      <DetailsRow>
                        <InputContainer size="w-1/2">
                          <Label htmlFor="cnpj">CNPJ</Label>
                          <InputMask
                            className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            mask="99.999.999/9999-99"
                            { ...updateClientForm.register("cnpj",) }
                          />
                          {
                            updateClientForm.formState.errors.cnpj
                              && <span className="text-red-500 text-xs">{updateClientForm.formState.errors.cnpj.message}</span>
                          }
                        </InputContainer>
                        <InputContainer size="w-1/2">
                          <Label htmlFor="segment">Segmento</Label>
                          <FormField
                            control={updateClientForm.control}
                            name="segment"
                            render={({ field }) => (
                              <FormItem>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="bg-white">
                                      <SelectValue placeholder="" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Proteção Veicular">Proteção Veicular</SelectItem>
                                    <SelectItem value="Telecom">Telecom</SelectItem>
                                    <SelectItem value="Plano Funerário">Plano Funerário</SelectItem>
                                    <SelectItem value="RH">RH</SelectItem>
                                    <SelectItem value="Sindicato">Sindicato</SelectItem>
                                    <SelectItem value="Associação">Associação</SelectItem>
                                    <SelectItem value="Clube de benefícios">Clube de benefícios</SelectItem>
                                    <SelectItem value="Outros">Outros</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                          {
                            updateClientForm.formState.errors.segment
                              && <span className="text-red-500 text-xs">{updateClientForm.formState.errors.segment.message}</span>
                          }
                        </InputContainer>
                      </DetailsRow>

                      <DetailsRow>
                        <InputContainer size="w-1/4">
                          <Label htmlFor="lumpSumInCents">Valor do Boleto</Label>
                          <Controller
                            name="lumpSumInCents"
                            control={updateClientForm.control}
                            render={({ field }) => (
                              <Input
                                className="bg-white"
                                value={field.value}
                                onChange={(e) => field.onChange(formatCurrency(e.target.value))}
                                placeholder="00,00"
                              />
                            )}
                          />
                          {
                            updateClientForm.formState.errors.lumpSumInCents
                              && <span className="text-red-500 text-xs">{updateClientForm.formState.errors.lumpSumInCents.message}</span>
                          }
                        </InputContainer>
                        <InputContainer size="w-1/4">
                          <Label htmlFor="unitValueInCents">Valor Unitário</Label>
                          <Controller
                            name="unitValueInCents"
                            control={updateClientForm.control}
                            render={({ field }) => (
                              <Input
                                className="bg-white"
                                value={field.value}
                                onChange={(e) => field.onChange(formatCurrency(e.target.value))}
                                placeholder="00,00"
                              />
                            )}
                          />
                          {
                            updateClientForm.formState.errors.unitValueInCents
                              && <span className="text-red-500 text-xs">{updateClientForm.formState.errors.unitValueInCents.message}</span>
                          }
                        </InputContainer>
                        <InputContainer size="w-1/2">
                          <Label htmlFor="contractUrl">URL do Contrato</Label>
                          <Input className="bg-white" { ...updateClientForm.register("contractUrl") } />
                          {
                            updateClientForm.formState.errors.contractUrl
                              && <span className="text-red-500 text-xs">{updateClientForm.formState.errors.contractUrl.message}</span>
                          }
                        </InputContainer>
                      </DetailsRow>

                      <Separator />

                      <DetailsRow>
                        <InputContainer size="w-1/2">
                          <Label htmlFor="managerName">Nome do Responsável</Label>
                          <Input className="bg-white" { ...updateClientForm.register("managerName") } />
                          {
                            updateClientForm.formState.errors.managerName
                              && <span className="text-red-500 text-xs">{updateClientForm.formState.errors.managerName.message}</span>
                          }
                        </InputContainer>
                        <InputContainer size="w-1/2">
                          <Label htmlFor="managerEmail">E-mail do Responsável</Label>
                          <Input className="bg-white" { ...updateClientForm.register("managerEmail") } />
                          {
                            updateClientForm.formState.errors.managerEmail
                              && <span className="text-red-500 text-xs">{updateClientForm.formState.errors.managerEmail.message}</span>
                          }
                        </InputContainer>
                      </DetailsRow>

                      <DetailsRow>
                        <InputContainer size="w-1/2">
                          <Label htmlFor="managerPhoneNumber">Telefone do Responsável</Label>
                          <InputMask
                            className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            mask="(99) 999999999"
                            { ...updateClientForm.register("managerPhoneNumber",) }
                          />
                          {
                            updateClientForm.formState.errors.managerPhoneNumber
                              && <span className="text-red-500 text-xs">{updateClientForm.formState.errors.managerPhoneNumber.message}</span>
                          }
                        </InputContainer>
                        <InputContainer size="w-1/2">
                          <Label htmlFor="financePhoneNumber">Telefone do Financeiro</Label>
                          <InputMask
                            className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            mask="(99) 99999-9999"
                            { ...updateClientForm.register("financePhoneNumber",) }
                          />
                          {
                            updateClientForm.formState.errors.financePhoneNumber
                              && <span className="text-red-500 text-xs">{updateClientForm.formState.errors.financePhoneNumber.message}</span>
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
                                  onValueChange={(value) => setDoesPartnerHaveAddress(value === 'true')}
                                  defaultValue={doesPartnerHaveAddress.toString()}
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
                          doesPartnerHaveAddress && (
                            <InputContainer size="w-1/5">
                              <Label htmlFor="address.cep">CEP</Label>
                              <Input className="bg-white" { ...updateClientForm.register("address.cep") } />
                              {
                                updateClientForm.formState.errors.address?.cep
                                  && <span className="text-red-500 text-xs">{updateClientForm.formState.errors.address.cep.message}</span>
                              }
                            </InputContainer>
                          )
                        }
                        {
                          doesPartnerHaveAddress && (
                            <InputContainer size="w-3/5">
                              <Label htmlFor="address.street">Rua</Label>
                              <Input className="bg-white" { ...updateClientForm.register("address.street") } />
                              {
                                updateClientForm.formState.errors.address?.street
                                  && <span className="text-red-500 text-xs">{updateClientForm.formState.errors.address.street.message}</span>
                              }
                            </InputContainer>
                          )
                        }
                      </DetailsRow>

                      {
                        doesPartnerHaveAddress && (
                          <DetailsRow>
                            <InputContainer size="w-1/5">
                              <Label htmlFor="address.number">Número</Label>
                              <Input className="bg-white" { ...updateClientForm.register("address.number") } />
                              {
                                updateClientForm.formState.errors.address?.number
                                  && <span className="text-red-500 text-xs">{updateClientForm.formState.errors.address.number.message}</span>
                              }
                            </InputContainer>
                            <InputContainer size="w-1/5">
                              <Label htmlFor="address.complement">Complemento</Label>
                              <Input className="bg-white" { ...updateClientForm.register("address.complement") } />
                              {
                                updateClientForm.formState.errors.address?.complement
                                  && <span className="text-red-500 text-xs">{updateClientForm.formState.errors.address.complement.message}</span>
                              }
                            </InputContainer>
                            <InputContainer size="w-1/5">
                              <Label htmlFor="address.neighborhood">Bairro</Label>
                              <Input className="bg-white" { ...updateClientForm.register("address.neighborhood") } />
                              {
                                updateClientForm.formState.errors.address?.neighborhood
                                  && <span className="text-red-500 text-xs">{updateClientForm.formState.errors.address.neighborhood.message}</span>
                              }
                            </InputContainer>
                            <InputContainer size="w-1/5">
                              <Label htmlFor="address.stateId">Estado</Label>
                              <FormField
                                control={updateClientForm.control}
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
                                updateClientForm.formState.errors.address?.stateId
                                  && <span className="text-red-500 text-xs">{updateClientForm.formState.errors.address.stateId.message}</span>
                              }
                            </InputContainer>
                            <InputContainer size="w-1/5">
                              <Label htmlFor="address.cityId">Cidade</Label>
                              <FormField
                                control={updateClientForm.control}
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
                                updateClientForm.formState.errors.address?.cityId
                                  && <span className="text-red-500 text-xs">{updateClientForm.formState.errors.address.cityId.message}</span>
                              }
                            </InputContainer>
                          </DetailsRow>
                        )
                      }

                      <AlertDialogFooter>
                        <AlertDialogCancel type="button">Fechar</AlertDialogCancel>
                        <AlertDialogCancel type="button" onClick={() => fillUpdateForm(client)}>
                          Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction type="submit" disabled={!updateClientForm.formState.isValid}>
                          Confirmar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </form>
                  </Form>
                </AlertDialogContent>
              </AlertDialog>
            )
          }

          {/* Delete Client */}
          {
            client
            && [STATUS.Ativo, STATUS.Inativo].includes(client.status.id)
            && (
              <AlertDialog>
                <AlertDialogTrigger title='Excluir' className='rounded-md w-9 h-9 bg-destructive text-white flex flex-col justify-center'>
                  <Trash2  className='mx-auto'/>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar exclusão?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Todos os associados do cliente também serão excluídos!
                    </AlertDialogDescription>
                    <AlertDialogDescription>
                      A operação <strong className='text-black'>não</strong> poderá ser desfeita!
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <Button variant="destructive" onClick={() => deleteClient(client.id)}>
                      Excluir
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )
          }
        </div>
      </div>

      {/* Client Details */}
      <div className='bg-white border rounded-md p-4 flex flex-col gap-4'>
        <DetailsRow>
          <DetailsField label="Nome Fantasia" value={client?.fantasyName ?? ''} />
          <DetailsField label="Razão Social" value={client?.corporateName ?? ''} />
          <DetailsField label="CNPJ" value={applyCnpjMask(client?.cnpj ?? '')} />
        </DetailsRow>

        <DetailsRow>
          <DetailsField label="Segmento" value={client?.segment ?? ''} />
          <DetailsField label="Status" value={client?.status.translation ?? ''} />
          <DetailsField label="Data do Cadastro" value={formatDateTime(client?.createdAt ?? '')} />
        </DetailsRow>

        <DetailsRow>
          <DetailsField label="Valor do Boleto" value={transformCurrencyFromCentsToBRLString(client?.lumpSumInCents ?? 0)} width="min-w-52 w-full" />
          <DetailsField label="Valor Unitário" value={transformCurrencyFromCentsToBRLString(client?.unitValueInCents ?? 0)} width="min-w-52 w-full" />
          <DetailsField label="Saldo Dispoível" value={transformCurrencyFromCentsToBRLString(client?.availableBalanceInCents ?? 0)} width="min-w-52 w-full" />
          <DetailsField label="URL do Contrato">
            <Link
              className="text-primary font-semibold"
              href={client?.contractUrl ?? ''}
              rel="noreferrer noopener"
              referrerPolicy="no-referrer"
              target="_blank"
            >
              {client?.contractUrl ?? ''}
            </Link>
          </DetailsField>
        </DetailsRow>

        <Separator />

        <DetailsRow>
          <DetailsField label="Nome do Responsável" value={captalize(client?.managerName ?? '')} />
          <DetailsField label="E-mail do Responsável" value={client?.managerEmail ?? ''} />
        </DetailsRow>

        <DetailsRow>
          <DetailsField label="Telefone do Responável" value={applyPhoneNumberMask(client?.managerPhoneNumber ?? '')} width="min-w-52 w-full" />
          <DetailsField label="Telefone do Financeiro" value={applyPhoneNumberMask(client?.financePhoneNumber ?? '')} width="min-w-52 w-full" />
        </DetailsRow>

        <Separator />

        <DetailsRow>
          <DetailsField label="CEP" value={applyCepMask(client?.address?.cep ?? '')} width="w-1/5"/>
          <DetailsField label="Rua" value={captalize(client?.address?.street ?? '')} width='w-full' />
        </DetailsRow>

        <DetailsRow>
          <DetailsField label="Número" value={client?.address?.number ?? ''} />
          <DetailsField label="Complemento" value={client?.address?.complement ?? ''} />
          <DetailsField label="Bairro" value={captalize(client?.address?.neighborhood ?? '')} />
          <DetailsField label="Cidade" value={captalize(client?.address?.city?.name ?? '')} />
          <DetailsField label="Estado" value={captalize(client?.address?.state?.name ?? '')} />
        </DetailsRow>
      </div>
    </DashboardLayout>
  )
}
