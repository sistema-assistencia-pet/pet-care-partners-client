'use client'

import { Controller, useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { v4 as uuid } from 'uuid'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
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
import { STATE } from '@/lib/enums'
import { useToast } from '@/components/ui/use-toast'
import {
  captalize,
  formatCurrency,
  leaveOnlyDigits,
  removeCnpjMask,
  removeCpfMask
} from '@/lib/utils'
import { useEffect, useState } from 'react'
import { SELECT_DEFAULT_VALUE } from '@/lib/constants'
import { Separator } from '@/components/ui/separator'

export default function RegisterClient() {
  // --------------------------- PAGE SETUP ---------------------------
  const { back } = useRouter()
  const { toast } = useToast()

  // --------------------------- CREATE CLIENT ---------------------------
  interface IAddress {
    cep?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    cityId?: number;
    stateId?: number;
  }

  interface IClientToBeCreated {
    cnpj: string
    corporateName: string
    fantasyName: string
    segment: string
    address: IAddress
    managerName: string
    managerCpf: string
    managerPassword: string
    managerPhoneNumber: string
    managerEmail: string
    financePhoneNumber: string
    lumpSumInCents?: number
    unitValueInCents?: number
    contractUrl?: string
  }

  const createClientFormSchema = z.object({
    cnpj: z
      .string({ required_error: 'O campo CNPJ é obrigatório.' })
      .length(18, { message: 'O campo CNPJ deve ter 14 caracteres.' }),
    corporateName: z
      .string({ required_error: 'O campo Razão Social é obrigatório.' }),    
    fantasyName: z
      .string({ required_error: 'O campo Nome Fantasia é obrigatório.' }),
    segment: z
      .string({ required_error: 'O campo Segmento é obrigatório.' }),
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
      }),
    managerCpf: z
      .string({required_error: 'O campo CPF do Responsável é obrigatório.'})
      .length(11, {message: 'O campo CPF do Responsável deve ter 11 caracteres.'}),
    managerPassword: z
      .string({required_error: 'O campo Senha do Responsável é obrigatório.'})
      .min(8, {message: 'O campo Senha do Responsável deve ter pelo menos 8 caracteres.'}),
    managerName: z
      .string({required_error: 'O campo Nome do Responsável é obrigatório.'})
      .min(3, {message: 'O campo Nome do Responsável deve ter pelo menos 3 caracteres.'}),
    managerPhoneNumber: z
      .string({ required_error: 'O campo Telefone do Responsável é obrigatório.' })
      .min(14, { message: 'O campo Telefone do Responsável deve ter 10 ou 11 caracteres.' })
      .max(15, { message: 'O campo Telefone do Responsável deve ter 10 ou 11 caracteres.' }),
    managerEmail: z
      .string({ required_error: 'O campo E-mail do Responsável é obrigatório.' })
      .email({ message: 'O campo E-mail do Responsável deve ser um e-mail válido.' }),
    financePhoneNumber: z
      .string({ required_error: 'O campo Telefone do Financeiro é obrigatório.' })
      .min(14, { message: 'O campo Telefone do Financeiro deve ter 10 ou 11 caracteres.' })
      .max(15, { message: 'O campo Telefone do Financeiro deve ter 10 ou 11 caracteres.' }),
    lumpSumInCents: z
      .string({ required_error: 'O campo Valor do Boleto é obrigatório.' })
      .optional(),
    unitValueInCents: z
      .string({ required_error: 'O campo Valor Unitário é obrigatório.' })
      .optional(),
    contractUrl: z
      .string({ required_error: 'O campo URL do Contrato é obrigatório.' })
      .optional()
  })
  
  type CreateClientFormSchema = z.infer<typeof createClientFormSchema>
  
  const CREATE_CLIENT_FORM_DEFAULT_VALUES: CreateClientFormSchema = {
    cnpj: '',
    corporateName: '',
    fantasyName: '',
    segment: '',
    address: {
      cep: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      cityId: SELECT_DEFAULT_VALUE,
      stateId: SELECT_DEFAULT_VALUE
    },
    managerCpf: '',
    managerPassword: '',
    managerName: '',
    managerPhoneNumber: '',
    managerEmail: '',
    financePhoneNumber: '',
    lumpSumInCents: '',
    unitValueInCents: '',
    contractUrl: ''
  }

  const createClientForm = useForm<CreateClientFormSchema>({
    mode: 'onBlur',
    defaultValues: CREATE_CLIENT_FORM_DEFAULT_VALUES,
    resolver: zodResolver(createClientFormSchema)
  })

  const formatCreateClientData = (createClientData: CreateClientFormSchema): IClientToBeCreated => {
    let stateId = createClientData.address?.stateId
    let cityId = createClientData.address?.cityId

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
      ...createClientData,
      cnpj: removeCnpjMask(createClientData.cnpj),
      managerPhoneNumber: leaveOnlyDigits(createClientData.managerPhoneNumber),
      financePhoneNumber: leaveOnlyDigits(createClientData.financePhoneNumber),
      managerCpf: removeCpfMask(createClientData.managerCpf),
      unitValueInCents: parseInt(leaveOnlyDigits(createClientData.unitValueInCents ?? '')),
      lumpSumInCents: parseInt(leaveOnlyDigits(createClientData.lumpSumInCents ?? '')),
      address: {
        cep: createClientData.address?.cep ?? '',
        street: createClientData.address?.street ?? '',
        number: createClientData.address?.number ?? '',
        complement: createClientData.address?.complement ?? '',
        neighborhood: createClientData.address?.neighborhood ?? '',
        cityId: cityId !== undefined ? parseInt(cityId): cityId,
        stateId: stateId !== undefined ? parseInt(stateId): stateId
      }
    }
  }

  const createClient = async (createClientData: CreateClientFormSchema): Promise<void> => {
    const formattedCreateClientData = formatCreateClientData(createClientData)
    
    const response = await sendRequest({
      endpoint: '/client',
      method: 'POST',
      data: formattedCreateClientData
    })

    if (response.error) {
      toast({
        description: response.message,
        variant: 'destructive'
      })
    } else {
      toast({
        description: response.message
      })

      back()
    }
  }

  // --------------------------- FETCH CITIES ---------------------------
  interface ICity {
    id: number
    name: string
  }

  const selectedStateId = createClientForm.watch('address.stateId')

  const [cities, setCities] = useState<ICity[]>([])

  const formatCity = (city: ICity): ICity => ({
    ...city,
    name: captalize(city.name),
  })

  const fetchCities = async (stateId: string) => {
    const response = await sendRequest<{ cities: ICity[] }>({
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
  // Carrega lista de cidades quando um estado é selecionado
  // e limpa cidade quando outro estado é selecionado
  useEffect(() => {
    if (typeof selectedStateId === 'string' && selectedStateId !== SELECT_DEFAULT_VALUE) {
      createClientForm.setValue('address.cityId', SELECT_DEFAULT_VALUE)
      fetchCities(selectedStateId)
    }
  }, [selectedStateId])

  // --------------------------- RETURN ---------------------------
  return (
    <DashboardLayout title="Cadastrar Novo Cliente">
      <Form { ...createClientForm }>
        <form
          className='flex flex-col my-4 gap-4'
          onSubmit={createClientForm.handleSubmit((data) => createClient(data))}
        >
          <DetailsRow>
            <InputContainer size="w-1/2">
              <Label htmlFor="fantasyName">Nome Fantasia</Label>
              <Input className="bg-white" { ...createClientForm.register("fantasyName") } />
              {
                createClientForm.formState.errors.fantasyName
                  && <span className="text-red-500 text-xs">{createClientForm.formState.errors.fantasyName.message}</span>
              }
            </InputContainer>
            <InputContainer size="w-1/2">
              <Label htmlFor="corporateName">Razão Social</Label>
              <Input className="bg-white" { ...createClientForm.register("corporateName") } />
              {
                createClientForm.formState.errors.corporateName
                  && <span className="text-red-500 text-xs">{createClientForm.formState.errors.corporateName.message}</span>
              }
            </InputContainer>
          </DetailsRow>

          <DetailsRow>
            <InputContainer size="w-1/2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <InputMask
                className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                mask="99.999.999/9999-99"
                { ...createClientForm.register("cnpj",) }
              />
              {
                createClientForm.formState.errors.cnpj
                  && <span className="text-red-500 text-xs">{createClientForm.formState.errors.cnpj.message}</span>
              }
            </InputContainer>
            <InputContainer size="w-1/2">
              <Label htmlFor="segment">Segmento</Label>
              <FormField
                control={createClientForm.control}
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
                createClientForm.formState.errors.segment
                  && <span className="text-red-500 text-xs">{createClientForm.formState.errors.segment.message}</span>
              }
            </InputContainer>
          </DetailsRow>

          <DetailsRow>
            <InputContainer size="w-1/4">
              <Label htmlFor="lumpSum">Valor do Boleto</Label>
              <Controller
                name="lumpSumInCents"
                control={createClientForm.control}
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
                createClientForm.formState.errors.lumpSumInCents
                  && <span className="text-red-500 text-xs">{createClientForm.formState.errors.lumpSumInCents.message}</span>
              }
            </InputContainer>
            <InputContainer size="w-1/4">
              <Label htmlFor="unitValueInCents">Valor Unitário</Label>
              <Controller
                name="unitValueInCents"
                control={createClientForm.control}
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
                createClientForm.formState.errors.unitValueInCents
                  && <span className="text-red-500 text-xs">{createClientForm.formState.errors.unitValueInCents.message}</span>
              }
            </InputContainer>
            <InputContainer size="w-2/4">
              <Label htmlFor="contractUrl">URL do Contrato</Label>
              <Input className="bg-white" { ...createClientForm.register("contractUrl") } />
              {
                createClientForm.formState.errors.contractUrl
                  && <span className="text-red-500 text-xs">{createClientForm.formState.errors.contractUrl.message}</span>
              }
            </InputContainer>
          </DetailsRow>

          <Separator />

          <DetailsRow>
            <InputContainer size="w-1/2">
              <Label htmlFor="managerCpf">CPF do Responsável</Label>
              <Input className="bg-white" { ...createClientForm.register("managerCpf") } />
              {
                createClientForm.formState.errors.managerCpf
                  && <span className="text-red-500 text-xs">{createClientForm.formState.errors.managerCpf.message}</span>
              }
            </InputContainer>
            <InputContainer size="w-1/2">
              <Label htmlFor="managerPassword">Senha do Responsável</Label>
              <Input type='password' className="bg-white" { ...createClientForm.register("managerPassword") } />
              {
                createClientForm.formState.errors.managerPassword
                  && <span className="text-red-500 text-xs">{createClientForm.formState.errors.managerPassword.message}</span>
              }
            </InputContainer>
          </DetailsRow>

          <DetailsRow>
            <InputContainer size="w-1/2">
              <Label htmlFor="managerName">Nome do Responsável</Label>
              <Input className="bg-white" { ...createClientForm.register("managerName") } />
              {
                createClientForm.formState.errors.managerName
                  && <span className="text-red-500 text-xs">{createClientForm.formState.errors.managerName.message}</span>
              }
            </InputContainer>
            <InputContainer size="w-1/2">
              <Label htmlFor="managerEmail">E-mail do Responsável</Label>
              <Input className="bg-white" { ...createClientForm.register("managerEmail") } />
              {
                createClientForm.formState.errors.managerEmail
                  && <span className="text-red-500 text-xs">{createClientForm.formState.errors.managerEmail.message}</span>
              }
            </InputContainer>
          </DetailsRow>

          <DetailsRow>
            <InputContainer size="w-1/2">
              <Label htmlFor="managerPhoneNumber">Telefone do Responsável</Label>
              <InputMask
                className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                mask="(99) 99999-9999"
                { ...createClientForm.register("managerPhoneNumber",) }
              />
              {
                createClientForm.formState.errors.managerPhoneNumber
                  && <span className="text-red-500 text-xs">{createClientForm.formState.errors.managerPhoneNumber.message}</span>
              }
            </InputContainer>
            <InputContainer size="w-1/2">
              <Label htmlFor="financePhoneNumber">Telefone do Financeiro</Label>
              <InputMask
                className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                mask="(99) 99999-9999"
                { ...createClientForm.register("financePhoneNumber",) }
              />
              {
                createClientForm.formState.errors.financePhoneNumber
                  && <span className="text-red-500 text-xs">{createClientForm.formState.errors.financePhoneNumber.message}</span>
              }
            </InputContainer>
          </DetailsRow>

          <Separator />

          <DetailsRow>
            <InputContainer size="w-1/5">
              <Label htmlFor="address.cep">CEP</Label>
              <Input className="bg-white" { ...createClientForm.register("address.cep") } />
              {
                createClientForm.formState.errors.address?.cep
                  && <span className="text-red-500 text-xs">{createClientForm.formState.errors.address.cep.message}</span>
              }
            </InputContainer>
            <InputContainer size="w-4/5">
              <Label htmlFor="address.street">Rua</Label>
              <Input className="bg-white" { ...createClientForm.register("address.street") } />
              {
                createClientForm.formState.errors.address?.street
                  && <span className="text-red-500 text-xs">{createClientForm.formState.errors.address.street.message}</span>
              }
            </InputContainer>
          </DetailsRow>

          <DetailsRow>
            <InputContainer size="w-1/5">
              <Label htmlFor="address.number">Número</Label>
              <Input className="bg-white" { ...createClientForm.register("address.number") } />
              {
                createClientForm.formState.errors.address?.number
                  && <span className="text-red-500 text-xs">{createClientForm.formState.errors.address.number.message}</span>
              }
            </InputContainer>
            <InputContainer size="w-1/5">
              <Label htmlFor="address.complement">Complemento</Label>
              <Input className="bg-white" { ...createClientForm.register("address.complement") } />
              {
                createClientForm.formState.errors.address?.complement
                  && <span className="text-red-500 text-xs">{createClientForm.formState.errors.address.complement.message}</span>
              }
            </InputContainer>
            <InputContainer size="w-1/5">
              <Label htmlFor="address.neighborhood">Bairro</Label>
              <Input className="bg-white" { ...createClientForm.register("address.neighborhood") } />
              {
                createClientForm.formState.errors.address?.neighborhood
                  && <span className="text-red-500 text-xs">{createClientForm.formState.errors.address.neighborhood.message}</span>
              }
            </InputContainer>
            <InputContainer size="w-1/5">
              <Label htmlFor="address.stateId">Estado</Label>
              <FormField
                control={createClientForm.control}
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
                createClientForm.formState.errors.address?.stateId
                  && <span className="text-red-500 text-xs">{createClientForm.formState.errors.address.stateId.message}</span>
              }
            </InputContainer>
            <InputContainer size="w-1/5">
              <Label htmlFor="address.cityId">Cidade</Label>
              <FormField
                control={createClientForm.control}
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
                createClientForm.formState.errors.address?.cityId
                  && <span className="text-red-500 text-xs">{createClientForm.formState.errors.address.cityId.message}</span>
              }
            </InputContainer>
          </DetailsRow>

          <Button className="my-4" disabled={!createClientForm.formState.isValid} type='submit'>
            Cadastrar cliente
          </Button>
        </form>
      </Form>
    </DashboardLayout>
  )
}
