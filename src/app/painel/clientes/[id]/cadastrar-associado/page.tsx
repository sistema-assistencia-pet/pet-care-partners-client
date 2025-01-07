'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useParams, useRouter } from 'next/navigation'
import { v4 as uuid } from 'uuid'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
import {
  captalize,
  convertPTBRDateToISO,
  leaveOnlyDigits,
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
import { STATE } from '@/lib/enums'
import { useToast } from '@/components/ui/use-toast'
import { SELECT_DEFAULT_VALUE } from '@/lib/constants'
import { Separator } from '@/components/ui/separator'

export default function RegisterMember() {
  // --------------------------- PAGE SETUP ---------------------------
  const params = useParams()
  const { back } = useRouter()
  const { toast } = useToast()
  
  // --------------------------- CREATE MEMBER ---------------------------
  interface IAddress {
    cep?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    cityId?: number;
    stateId?: number;
  }

  interface IMemberToBeCreated {
    birthDate?: string
    address: IAddress,
    clientId: string
    cpf: string
    email: string
    name: string
    phoneNumber?: string
  }

  const createMemberFormSchema = z.object({
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
    phoneNumber: z
      .string({ required_error: 'O campo Telefone é obrigatório.' })
      .min(10, { message: 'O campo Telefone deve ter pelo menos 10 caracteres.' })
      .optional(),
    birthDate: z
      .string({ required_error: 'O campo Data de Nascimento é obrigatório.' })
      .length(10, { message: 'O campo Data de Nascimento deve ter pelo menos 10 caracteres.' })
      .optional(),
    clientId: z
      .string({ required_error: 'O campo ID do Cliente é obrigatório.' })
      .uuid({ message: 'O campo ID do Cliente deve ser um UUID válido.' }),
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
  })
  
  type CreateMemberFormSchema = z.infer<typeof createMemberFormSchema>
  
  const CREATE_MEMBER_FORM_DEFAULT_VALUES: CreateMemberFormSchema = {
    cpf: '',
    name: '',
    email: '',
    phoneNumber: '',
    birthDate: '',
    clientId: '',
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

  const createMemberForm = useForm<CreateMemberFormSchema>({
    mode: 'onBlur',
    defaultValues: CREATE_MEMBER_FORM_DEFAULT_VALUES,
    resolver: zodResolver(createMemberFormSchema)
  })

  const formatCreateMemberData = (createMemberData: CreateMemberFormSchema): IMemberToBeCreated => {
    let stateId = createMemberData.address?.stateId
    let cityId = createMemberData.address?.cityId

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
      ...createMemberData,
      cpf: removeCpfMask(createMemberData.cpf ?? ''),
      phoneNumber: leaveOnlyDigits(createMemberData.phoneNumber ?? ''),
      birthDate: convertPTBRDateToISO(createMemberData.birthDate ?? ''),
      address: {
        cep: createMemberData.address?.cep ?? '',
        street: createMemberData.address?.street ?? '',
        number: createMemberData.address?.number ?? '',
        complement: createMemberData.address?.complement ?? '',
        neighborhood: createMemberData.address?.neighborhood ?? '',
        cityId: cityId !== undefined ? parseInt(cityId): cityId,
        stateId: stateId !== undefined ? parseInt(stateId): stateId
      }
    }
  }

  const createMember = async (createMemberData: CreateMemberFormSchema): Promise<void> => {
    const formattedCreateMemberData = formatCreateMemberData(createMemberData)
    
    const response = await sendRequest<{ memberId: string }>({
      endpoint: '/member',
      method: 'POST',
      data: formattedCreateMemberData
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

  // --------------------------- FETCH CITIES ---------------------------
  interface ICity {
    id: number
    name: string
  }

  const selectedStateId = createMemberForm.watch('address.stateId')

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
      createMemberForm.setValue('address.cityId', SELECT_DEFAULT_VALUE)
      fetchCities(selectedStateId)
    }
  }, [selectedStateId])

  // Configura o valor do campo clientId com o ID do cliente passado por parâmetro
  useEffect(() => {
    if (params.id) {
      createMemberForm.setValue('clientId', params.id as string)
    }
  }, [])

  // --------------------------- RETURN ---------------------------
  return (
    <DashboardLayout title="Cadastrar Novo Associado">
      <Form { ...createMemberForm }>
        <form
          className='flex flex-col my-4 gap-4'
          onSubmit={createMemberForm.handleSubmit((data) => createMember(data))}
        >
          <DetailsRow>
            <InputContainer size="w-1/4">
              <Label htmlFor="cpf">CPF</Label>
              <InputMask
                className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                mask="999.999.999-99"
                { ...createMemberForm.register("cpf",) }
              />
              {
                createMemberForm.formState.errors.cpf
                  && <span className="text-red-500 text-xs">{createMemberForm.formState.errors.cpf.message}</span>
              }
            </InputContainer>
            <InputContainer size="w-3/4">
              <Label htmlFor="name">Nome</Label>
              <Input className="bg-white" { ...createMemberForm.register("name") } />
              {
                createMemberForm.formState.errors.name
                  && <span className="text-red-500 text-xs">{createMemberForm.formState.errors.name.message}</span>
              }
            </InputContainer>
          </DetailsRow>

          <DetailsRow>
            <InputContainer size="w-1/3">
              <Label htmlFor="birthDate">Data de Nascimento</Label>
              <InputMask
                className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                mask="99/99/9999"
                { ...createMemberForm.register("birthDate",) }
              />
              {
                createMemberForm.formState.errors.birthDate
                  && <span className="text-red-500 text-xs">{createMemberForm.formState.errors.birthDate.message}</span>
              }
            </InputContainer>
            <InputContainer size="w-1/3">
              <Label htmlFor="email">E-mail</Label>
              <Input className="bg-white" { ...createMemberForm.register("email") } />
              {
                createMemberForm.formState.errors.email
                  && <span className="text-red-500 text-xs">{createMemberForm.formState.errors.email.message}</span>
              }
            </InputContainer>
            <InputContainer size="w-1/3">
              <Label htmlFor="phoneNumber">Telefone</Label>
              <InputMask
                className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                mask="(99) 99999-9999"
                { ...createMemberForm.register("phoneNumber",) }
              />
              {
                createMemberForm.formState.errors.phoneNumber
                  && <span className="text-red-500 text-xs">{createMemberForm.formState.errors.phoneNumber.message}</span>
              }
            </InputContainer>
          </DetailsRow>

          <Separator />

          <DetailsRow>
            <InputContainer size="w-1/5">
              <Label htmlFor="address.cep">CEP</Label>
              <Input className="bg-white" { ...createMemberForm.register("address.cep") } />
              {
                createMemberForm.formState.errors.address?.cep
                  && <span className="text-red-500 text-xs">{createMemberForm.formState.errors.address.cep.message}</span>
              }
            </InputContainer>
            <InputContainer size="w-4/5">
              <Label htmlFor="address.street">Rua</Label>
              <Input className="bg-white" { ...createMemberForm.register("address.street") } />
              {
                createMemberForm.formState.errors.address?.street
                  && <span className="text-red-500 text-xs">{createMemberForm.formState.errors.address.street.message}</span>
              }
            </InputContainer>
          </DetailsRow>

          <DetailsRow>
            <InputContainer size="w-1/5">
              <Label htmlFor="address.number">Número</Label>
              <Input className="bg-white" { ...createMemberForm.register("address.number") } />
              {
                createMemberForm.formState.errors.address?.number
                  && <span className="text-red-500 text-xs">{createMemberForm.formState.errors.address.number.message}</span>
              }
            </InputContainer>
            <InputContainer size="w-1/5">
              <Label htmlFor="address.complement">Complemento</Label>
              <Input className="bg-white" { ...createMemberForm.register("address.complement") } />
              {
                createMemberForm.formState.errors.address?.complement
                  && <span className="text-red-500 text-xs">{createMemberForm.formState.errors.address.complement.message}</span>
              }
            </InputContainer>
            <InputContainer size="w-1/5">
              <Label htmlFor="address.neighborhood">Bairro</Label>
              <Input className="bg-white" { ...createMemberForm.register("address.neighborhood") } />
              {
                createMemberForm.formState.errors.address?.neighborhood
                  && <span className="text-red-500 text-xs">{createMemberForm.formState.errors.address.neighborhood.message}</span>
              }
            </InputContainer>
            <InputContainer size="w-1/5">
              <Label htmlFor="address.stateId">Estado</Label>
              <FormField
                control={createMemberForm.control}
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
                createMemberForm.formState.errors.address?.stateId
                  && <span className="text-red-500 text-xs">{createMemberForm.formState.errors.address.stateId.message}</span>
              }
            </InputContainer>
            <InputContainer size="w-1/5">
              <Label htmlFor="address.cityId">Cidade</Label>
              <FormField
                control={createMemberForm.control}
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
                createMemberForm.formState.errors.address?.cityId
                  && <span className="text-red-500 text-xs">{createMemberForm.formState.errors.address.cityId.message}</span>
              }
            </InputContainer>
          </DetailsRow>
          <Button className="my-4" disabled={!createMemberForm.formState.isValid} type='submit'>
            Cadastrar Associado
          </Button>
        </form>
      </Form>
    </DashboardLayout>
  )
}
