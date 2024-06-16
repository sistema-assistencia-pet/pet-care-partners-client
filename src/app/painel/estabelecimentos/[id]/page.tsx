'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useParams, useRouter } from 'next/navigation'
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
import { applyCnpjMask, captalize, formatDateTime, formatPhoneNumber } from '@/lib/utils'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { sendRequest } from '@/lib/sendRequest'
import { Separator } from '@/components/ui/separator'
import { STATUS } from '@/lib/enums'
import { useToast } from '@/components/ui/use-toast'


interface IPartnerDetailedFromAPI {
  about: string
  address: string
  benefit1Description: string
  benefit1Link: string
  benefit1Rules: string
  benefit1Title: string
  benefit1Voucher: string
  benefit2Description: string
  benefit2Link: string
  benefit2Rules: string
  benefit2Title: string
  benefit2Voucher: string
  businessPhoneNumber: string
  category: { id: number, name: string }
  categoryId: number
  city: string
  cnpj: string
  contractUrl: string
  corporateName: string
  createdAt: string
  fantasyName: string
  id: string
  image: string
  instagram: string
  isOnline: boolean
  logo: string
  managerEmail: string
  managerName: string
  managerPhoneNumber: string
  openingHours: string
  state: string
  statusId: number
  tags: string
  webpage: string
}

type PartnerDetailed = Omit<IPartnerDetailedFromAPI, 'statusId'> & { status: string }

const updatePartnerFormSchema = z.object({
  corporateName: z
    .string({ required_error: 'O campo Razão Social é obrigatório.' })
    .optional(),
  fantasyName: z
    .string({ required_error: 'O campo Nome Fantasia é obrigatório.' })
    .min(3, { message: 'O campo Nome Fantasia deve ter pelo menos 3 caracteres.' })
    .optional(),
  address: z
    .string({ required_error: 'O campo Endereço é obrigatório.' })
    .min(3, { message: 'O campo Endereço deve ter pelo menos 3 caracteres.' })
    .optional(),
  state: z
    .string({ required_error: 'O campo Estado é obrigatório.' })
    .length(2, { message: 'O campo Estado deve ter 2 caracteres.' })
    .optional(),
  city: z
    .string({required_error: 'O campo Cidade é obrigatório.' })
    .min(3, { message: 'O campo Cidade deve ter pelo menos 3 caracteres.' })
    .optional(),
  categoryId: z
    .string({required_error: 'O campo Categoria é obrigatório.' })
    .min(1, { message: 'O campo Categoria é obrigatório.' })
    .optional(),
  tags: z
    .string({required_error: 'O campo Tags é obrigatório.' })
    .optional(),
  isOnline: z
    .string({required_error: 'O campo Online é obrigatório.' })
    .optional(),
  managerName: z
    .string({required_error: 'O campo Nome do Responsável é obrigatório.'})
    .min(3, {message: 'O campo Nome do Responsável deve ter pelo menos 3 caracteres.'})
    .optional(),
  managerPhoneNumber: z
    .string({ required_error: 'O campo Telefone do Responsável é obrigatório.' })
    .min(11, { message: 'O campo Telefone do Responsável deve ter pelo menos 11 caracteres.' })
    .optional(),
  managerEmail: z
    .string({ required_error: 'O campo E-mail do Responsável é obrigatório.' })
    // .email({ message: 'O campo E-mail do Responsável deve ser um e-mail válido.' })
    .optional(),
  businessPhoneNumber: z
    .string({ required_error: 'O campo Telefone Comercial é obrigatório.' })
    .min(11, { message: 'O campo Telefone Comercial deve ter pelo menos 11 caracteres.' })
    .optional(),
  about: z
    .string({ required_error: 'O campo Sobre é obrigatório.' })
    .optional(),
  openingHours: z
    .string({ required_error: 'O campo Horário de Funcionamento é obrigatório.' })
    .optional(),
  instagram: z
    .string({ required_error: 'O campo Instagram é obrigatório.' })
    .optional(),
  webpage: z
    .string({ required_error: 'O campo Página Oficial é obrigatório.' })
    // .url({ message: 'O campo Página Oficial deve ser uma URL válida.' })
    .optional(),
  contractUrl: z
    .string({ required_error: 'O campo URL do Contrato é obrigatório.' })
    // .url({ message: 'O campo URL do Contrato deve ser uma URL válida.' })
    .optional(),
  benefit1Title: z
    .string({ required_error: 'O campo Título do Benefício 1 é obrigatório.' })
    .optional(),
  benefit1Description: z
    .string({ required_error: 'O campo Descrição do Benefício 1 é obrigatório.' })
    .optional(),
  benefit1Rules: z
    .string({ required_error: 'O campo Regras do Benefício 1 é obrigatório.' })
    .optional(),
  benefit1Link: z
    .string({ required_error: 'O campo Link do Benefício 1 é obrigatório.' })
    .optional(),
  benefit1Voucher: z
    .string({ required_error: 'O campo Voucher do Benefício 1 é obrigatório.' })
    .optional(),
  benefit2Title: z
    .string({ required_error: 'O campo Título do Benefício 2 é obrigatório.' })
    .optional(),
  benefit2Description: z
    .string({ required_error: 'O campo Descrição do Benefício 2 é obrigatório.' })
    .optional(),
  benefit2Rules: z
    .string({ required_error: 'O campo Regras do Benefício 2 é obrigatório.' })
    .optional(),
  benefit2Link: z
    .string({ required_error: 'O campo Link do Benefício 2 ("benefit2Link") é obrigatório.' })
    .optional(),
  benefit2Voucher: z
    .string({ required_error: 'O campo Voucher do Benefício 2 ("benefit2Voucher") é obrigatório.' })
    .optional()
})

type UpdatePartnerFormSchema = z.infer<typeof updatePartnerFormSchema>

type UpdatePartnerDataToSendToApi = Omit<UpdatePartnerFormSchema, 'isOnline' | 'categoryId'> & { isOnline: boolean, categoryId: number }

const UPDATE_PARTNER_FORM_DEFAULT_VALUES = {
  corporateName: '',
  fantasyName: '',
  segment: '',
  address: '',
  state: '',
  city: '',
  managerName: '',
  managerPhoneNumber: '',
  managerEmail: '',
  financePhoneNumber: '',
  lumpSum: 0,
  unitValue: 0,
  contractUrl: ''
}

export default function PartnerDetailsPage() {
  const [partnerDetailed, setPartnerDetailed] = useState<PartnerDetailed | null>(null)
  const params = useParams()
  const { toast } = useToast()

  const form = useForm<UpdatePartnerFormSchema>({
    mode: 'onBlur',
    defaultValues: UPDATE_PARTNER_FORM_DEFAULT_VALUES,
    resolver: zodResolver(updatePartnerFormSchema)
  })

  const formatPartnerDetailed = (partner: IPartnerDetailedFromAPI): PartnerDetailed => ({
    ...partner,
    cnpj: applyCnpjMask(partner.cnpj),
    corporateName: captalize(partner.corporateName),
    fantasyName: captalize(partner.fantasyName),
    state: partner.state.toLocaleUpperCase(),
    city: captalize(partner.city),
    managerName: captalize(partner.managerName),
    managerPhoneNumber: formatPhoneNumber(partner.managerPhoneNumber),
    businessPhoneNumber: formatPhoneNumber(partner.businessPhoneNumber),
    status: STATUS[partner.statusId],
    createdAt: formatDateTime(partner.createdAt)
  })

  const fillUpdateForm = (partner: IPartnerDetailedFromAPI) => {
    form.setValue('corporateName', partner.corporateName)
    form.setValue('fantasyName', partner.fantasyName)
    form.setValue('address', partner.address)
    form.setValue('state', partner.state)
    form.setValue('city', partner.city)
    form.setValue('categoryId', partner.categoryId.toString())
    form.setValue('tags', partner.tags)
    form.setValue('isOnline', partner.isOnline.toString())
    form.setValue('managerName', partner.managerName)
    form.setValue('managerPhoneNumber', partner.managerPhoneNumber)
    form.setValue('managerEmail', partner.managerEmail)
    form.setValue('businessPhoneNumber', partner.businessPhoneNumber)
    form.setValue('about', partner.about)
    form.setValue('openingHours', partner.openingHours)
    form.setValue('instagram', partner.instagram)
    form.setValue('webpage', partner.webpage)
    form.setValue('contractUrl', partner.contractUrl)
    form.setValue('benefit1Title', partner.benefit1Title)
    form.setValue('benefit1Description', partner.benefit1Description)
    form.setValue('benefit1Rules', partner.benefit1Rules)
    form.setValue('benefit1Link', partner.benefit1Link)
    form.setValue('benefit1Voucher', partner.benefit1Voucher)
    form.setValue('benefit2Title', partner.benefit2Title)
    form.setValue('benefit2Description', partner.benefit2Description)
    form.setValue('benefit2Rules', partner.benefit2Rules)
    form.setValue('benefit2Link', partner.benefit2Link)
    form.setValue('benefit2Voucher', partner.benefit2Voucher)
  }

  const formatUpdatedPartnerData = (partnerData: UpdatePartnerFormSchema): UpdatePartnerDataToSendToApi => ({
    ...partnerData,
    managerPhoneNumber: partnerData.managerPhoneNumber && partnerData.managerPhoneNumber
      .replace('(', '').replace(')', '').replace('-', '').replace(' ', '').replaceAll('_', ''),
    businessPhoneNumber: partnerData.businessPhoneNumber && partnerData.businessPhoneNumber
      .replace('(', '').replace(')', '').replace('-', '').replace(' ', '').replaceAll('_', ''),
      isOnline: partnerData.isOnline === 'true',
      categoryId: parseInt(partnerData.categoryId as string || '')
  })

  const updatePartner = async (partner: UpdatePartnerFormSchema) => {
    const formattedPartner = formatUpdatedPartnerData(partner)

    const response = await sendRequest<{ partner: IPartnerDetailedFromAPI }>({
      endpoint: `/partner/${params.id}`,
      method: 'PATCH',
      data: formattedPartner,
    })

    if (response.error) {
      toast({
        description: response.message,
        variant: 'destructive'
      })

      return
    }

    fetchPartner(params.id as string)
  }

  const activatePartner = async (id: string) => {
    const response = await sendRequest({
      endpoint: `/partner/${id}/activate`,
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

    fetchPartner(id)
  }

  const inactivatePartner = async (id: string) => {
    const response = await sendRequest({
      endpoint: `/partner/${id}/inactivate`,
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

    fetchPartner(id)
  }

  const deletePartner = async (id: string) => {
    const response = await sendRequest({
      endpoint: `/partner/${id}/delete`,
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

    fetchPartner(id)
  }

  const fetchPartner = async (id: string) => {
    const response = await sendRequest<{ partner: IPartnerDetailedFromAPI }>({
      endpoint: `/partner/${id}`,
      method: 'GET',
    })

    if (response.error) {
      toast({
        description: response.message,
        variant: 'destructive'
      })

      setPartnerDetailed(null)

      return
    }

    fillUpdateForm(response.data.partner)

    const formattedPartner = formatPartnerDetailed(response.data.partner)

    setPartnerDetailed(formattedPartner)
  }

  useEffect(() => {
    if (params.id) fetchPartner(params.id as string)
  } , [params.id])

  return (
    <DashboardLayout
      // secondaryText={`Economia Total: ${partnerDetailed?.totalSavings || ''}`}
      title={`${partnerDetailed?.fantasyName || ''}`}
    >
      <div className="flex justify-between w-full">
        <div className="flex gap-4 justify-end w-full">
          {
            partnerDetailed?.status === STATUS[1] && (
              <AlertDialog>
                <AlertDialogTrigger className='uppercase px-8 h-9 text-sm font-medium rounded-md border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground'>Inativar</AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar inativação?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Todos os benefícios do estabelecimento também serão inativados!
                    </AlertDialogDescription>
                    <AlertDialogDescription>
                      Essa ação poderá ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <Button onClick={() => inactivatePartner(partnerDetailed.id)}>
                      Inativar
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )
          }
          {
            partnerDetailed?.status === STATUS[2] && (
              <AlertDialog>
                <AlertDialogTrigger className='uppercase px-8 h-9 rounded-md text-sm font-medium border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground'>Ativar</AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar ativação?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Todos os benefícios do estabelecimento também serão ativados!
                    </AlertDialogDescription>
                    <AlertDialogDescription>
                      Essa ação poderá ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <Button onClick={() => activatePartner(partnerDetailed.id)}>
                      Ativar
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )
          }
          {
            partnerDetailed
            && (
              <AlertDialog>
                <AlertDialogTrigger title='Editar' className='rounded-md w-9 h-9 bg-primary text-white flex flex-col justify-center'>
                  <Pencil  className='mx-auto'/>
                </AlertDialogTrigger>
                <AlertDialogContent className='max-h-screen overflow-y-auto'>
                  <AlertDialogTitle>Editar estabelecimento</AlertDialogTitle>
                  <Form { ...form }>
                    <form
                      className='flex flex-col gap-4'
                      onSubmit={form.handleSubmit((data) => updatePartner(data))}
                    >

                      <DetailsRow>
                        <InputContainer size="w-1/3">
                          <Label htmlFor="fantasyName">Nome Fantasia</Label>
                          <Input className="bg-white" { ...form.register("fantasyName") } />
                          {
                            form.formState.errors.fantasyName
                              && <span className="text-red-500 text-xs">{form.formState.errors.fantasyName.message}</span>
                          }
                        </InputContainer>
                        <InputContainer size="w-1/3">
                          <Label htmlFor="corporateName">Razão Social</Label>
                          <Input className="bg-white" { ...form.register("corporateName") } />
                          {
                            form.formState.errors.corporateName
                              && <span className="text-red-500 text-xs">{form.formState.errors.corporateName.message}</span>
                          }
                        </InputContainer>
                      </DetailsRow>

                      <DetailsRow>
                        <InputContainer size="w-1/3">
                          <Label htmlFor="categoryId">Categoria</Label>
                          <FormField
                            control={form.control}
                            name="categoryId"
                            render={({ field }) => (
                              <FormItem>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="bg-white">
                                      <SelectValue placeholder="" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="none" disabled></SelectItem>
                                    <SelectItem value="1">Gastronomia</SelectItem>
                                    <SelectItem value="2">Vestuário / Moda</SelectItem>
                                    <SelectItem value="3">Hospedagem</SelectItem>
                                    <SelectItem value="4">Automotivo</SelectItem>
                                    <SelectItem value="5">Beleza e estética</SelectItem>
                                    <SelectItem value="6">Eletrodomésticos</SelectItem>
                                    <SelectItem value="7">Serviços</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                          {
                            form.formState.errors.categoryId
                              && <span className="text-red-500 text-xs">{form.formState.errors.categoryId.message}</span>
                          }
                        </InputContainer>
                        <InputContainer size="w-1/3">
                          <Label htmlFor="tags">Tags</Label>
                          <Input className="bg-white" { ...form.register("tags") } placeholder="Tags sepadas por vírgula" />
                          {
                            form.formState.errors.tags
                              && <span className="text-red-500 text-xs">{form.formState.errors.tags.message}</span>
                          }
                        </InputContainer>
                        <InputContainer size="w-1/3">
                          <Label htmlFor="isOnline">Online</Label>
                          <FormField
                            control={form.control}
                            name="isOnline"
                            render={({ field }) => (
                              <FormItem>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                          {
                            form.formState.errors.isOnline
                              && <span className="text-red-500 text-xs">{form.formState.errors.isOnline.message}</span>
                          }
                        </InputContainer>
                      </DetailsRow>

                      <DetailsRow>
                        <InputContainer size="w-1/3">
                          <Label htmlFor="contractUrl">URL do Contrato</Label>
                          <Input className="bg-white" { ...form.register("contractUrl") } />
                          {
                            form.formState.errors.contractUrl
                              && <span className="text-red-500 text-xs">{form.formState.errors.contractUrl.message}</span>
                          }
                        </InputContainer>
                        <InputContainer size="w-1/3">
                          <Label htmlFor="businessPhoneNumber">Telefone Comercial</Label>
                          <InputMask
                            className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            mask="(99) 99999-9999"
                            { ...form.register("businessPhoneNumber") }
                          />
                          {
                            form.formState.errors.businessPhoneNumber
                              && <span className="text-red-500 text-xs">{form.formState.errors.businessPhoneNumber.message}</span>
                          }
                        </InputContainer>
                        <InputContainer size="w-1/3">
                          <Label htmlFor="openingHours">Horário de Funcionamento</Label>
                          <Input className="bg-white" { ...form.register("openingHours") } />
                          {
                            form.formState.errors.openingHours
                              && <span className="text-red-500 text-xs">{form.formState.errors.openingHours.message}</span>
                          }
                        </InputContainer>
                      </DetailsRow>

                      <DetailsRow>
                        <InputContainer>
                          <Label htmlFor="instagram">Instagram</Label>
                          <Input className="bg-white" { ...form.register("instagram") } />
                          {
                            form.formState.errors.instagram
                              && <span className="text-red-500 text-xs">{form.formState.errors.instagram.message}</span>
                          }
                        </InputContainer>
                        <InputContainer>
                        <Label htmlFor="webpage">Página Oficial</Label>
                          <Input className="bg-white" { ...form.register("webpage") } />
                          {
                            form.formState.errors.webpage
                              && <span className="text-red-500 text-xs">{form.formState.errors.webpage.message}</span>
                          }
                        </InputContainer>
                      </DetailsRow>

                      <DetailsRow>
                        <InputContainer>
                          <Label htmlFor="about">Sobre</Label>
                          <Input className="bg-white text-wrap" { ...form.register("about") } />
                          {
                            form.formState.errors.about
                              && <span className="text-red-500 text-xs">{form.formState.errors.about.message}</span>
                          }
                        </InputContainer>
                      </DetailsRow>

                      <Separator />

                      <DetailsRow>
                        <InputContainer size="w-1/3">
                          <Label htmlFor="managerName">Nome do Responsável</Label>
                          <Input className="bg-white" { ...form.register("managerName") } />
                          {
                            form.formState.errors.managerName
                              && <span className="text-red-500 text-xs">{form.formState.errors.managerName.message}</span>
                          }
                        </InputContainer>
                        <InputContainer size="w-1/3">
                          <Label htmlFor="managerEmail">E-mail do Responsável</Label>
                          <Input className="bg-white" { ...form.register("managerEmail") } />
                          {
                            form.formState.errors.managerEmail
                              && <span className="text-red-500 text-xs">{form.formState.errors.managerEmail.message}</span>
                          }
                        </InputContainer>
                        <InputContainer size="w-1/3">
                          <Label htmlFor="managerPhoneNumber">Telefone do Responsável</Label>
                          <InputMask
                            className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            mask="(99) 99999-9999"
                            { ...form.register("managerPhoneNumber",) }
                          />
                          {
                            form.formState.errors.managerPhoneNumber
                              && <span className="text-red-500 text-xs">{form.formState.errors.managerPhoneNumber.message}</span>
                          }
                        </InputContainer>
                      </DetailsRow>

                      <Separator />

                      <DetailsRow>
                        <InputContainer size="w-1/3">
                          <Label htmlFor="address">Endereço</Label>
                          <Input className="bg-white" { ...form.register("address") } />
                          {
                            form.formState.errors.address
                              && <span className="text-red-500 text-xs">{form.formState.errors.address.message}</span>
                          }
                        </InputContainer>
                        <InputContainer size="w-1/3">
                          <Label htmlFor="city">Cidade</Label>
                          <Input className="bg-white" { ...form.register("city") } />
                          {
                            form.formState.errors.city
                              && <span className="text-red-500 text-xs">{form.formState.errors.city.message}</span>
                          }
                        </InputContainer>
                        <InputContainer size="w-1/3">
                          <Label htmlFor="state">Estado</Label>
                          <InputMask
                            className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            mask="aa"
                            { ...form.register("state",) }
                          />
                          {
                            form.formState.errors.state
                              && <span className="text-red-500 text-xs">{form.formState.errors.state.message}</span>
                          }
                        </InputContainer>
                      </DetailsRow>

                      <Separator />

                      <DetailsRow>
                        <InputContainer size="w-1/3">
                          <Label htmlFor="benefit1Title">Título do Benefício 1</Label>
                          <Input className="bg-white" { ...form.register("benefit1Title") } />
                          {
                            form.formState.errors.benefit1Title
                              && <span className="text-red-500 text-xs">{form.formState.errors.benefit1Title.message}</span>
                          }
                        </InputContainer>
                        <InputContainer size="w-1/3">
                          <Label htmlFor="benefit1Link">Link do Benefício 1</Label>
                          <Input className="bg-white" { ...form.register("benefit1Link") } />
                          {
                            form.formState.errors.benefit1Link
                              && <span className="text-red-500 text-xs">{form.formState.errors.benefit1Link.message}</span>
                          }
                        </InputContainer>
                        <InputContainer size="w-1/3">
                          <Label htmlFor="benefit1Voucher">Voucher do Benefício 1</Label>
                          <Input className="bg-white" { ...form.register("benefit1Voucher") } />
                          {
                            form.formState.errors.benefit1Voucher
                              && <span className="text-red-500 text-xs">{form.formState.errors.benefit1Voucher.message}</span>
                          }
                        </InputContainer>
                      </DetailsRow>

                      <DetailsRow>
                        <InputContainer>
                          <Label htmlFor="benefit1Rules">Regras do Benefício 1</Label>
                          <Input className="bg-white text-wrap" { ...form.register("benefit1Rules") } />
                          {
                            form.formState.errors.benefit1Rules
                              && <span className="text-red-500 text-xs">{form.formState.errors.benefit1Rules.message}</span>
                          }
                        </InputContainer>
                      </DetailsRow>

                      <DetailsRow>
                        <InputContainer>
                          <Label htmlFor="benefit1Description">Descrição do Benefício 1</Label>
                          <Input className="bg-white text-wrap" { ...form.register("benefit1Description") } />
                          {
                            form.formState.errors.benefit1Description
                              && <span className="text-red-500 text-xs">{form.formState.errors.benefit1Description.message}</span>
                          }
                        </InputContainer>
                      </DetailsRow>

                      <Separator />

                      <DetailsRow>
                        <InputContainer size="w-1/3">
                          <Label htmlFor="benefit2Title">Título do Benefício 2</Label>
                          <Input className="bg-white" { ...form.register("benefit2Title") } />
                          {
                            form.formState.errors.benefit2Title
                              && <span className="text-red-500 text-xs">{form.formState.errors.benefit2Title.message}</span>
                          }
                        </InputContainer>
                        <InputContainer size="w-1/3">
                          <Label htmlFor="benefit2Link">Link do Benefício 2</Label>
                          <Input className="bg-white" { ...form.register("benefit2Link") } />
                          {
                            form.formState.errors.benefit2Link
                              && <span className="text-red-500 text-xs">{form.formState.errors.benefit2Link.message}</span>
                          }
                        </InputContainer>
                        <InputContainer size="w-1/3">
                          <Label htmlFor="benefit2Voucher">Voucher do Benefício 2</Label>
                          <Input className="bg-white" { ...form.register("benefit2Voucher") } />
                          {
                            form.formState.errors.benefit2Voucher
                              && <span className="text-red-500 text-xs">{form.formState.errors.benefit2Voucher.message}</span>
                          }
                        </InputContainer>
                      </DetailsRow>

                      <DetailsRow>
                        <InputContainer>
                          <Label htmlFor="benefit2Rules">Regras do Benefício 2</Label>
                          <Input className="bg-white text-wrap" { ...form.register("benefit2Rules") } />
                          {
                            form.formState.errors.benefit2Rules
                              && <span className="text-red-500 text-xs">{form.formState.errors.benefit2Rules.message}</span>
                          }
                        </InputContainer>
                      </DetailsRow>

                      <DetailsRow>
                        <InputContainer>
                          <Label htmlFor="benefit2Description">Descrição do Benefício 2</Label>
                          <Input className="bg-white text-wrap" { ...form.register("benefit2Description") } />
                          {
                            form.formState.errors.benefit2Description
                              && <span className="text-red-500 text-xs">{form.formState.errors.benefit2Description.message}</span>
                          }
                        </InputContainer>
                      </DetailsRow>

                      <AlertDialogFooter>
                        <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
                        <AlertDialogAction type="submit" disabled={!form.formState.isValid}>
                          Confirmar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </form>
                  </Form>
                </AlertDialogContent>
              </AlertDialog>
            )
          }
          {
            partnerDetailed
            && [STATUS[1], STATUS[2]].includes(partnerDetailed.status as string)
            && (
              <AlertDialog>
                <AlertDialogTrigger title='Excluir' className='rounded-md w-9 h-9 bg-destructive text-white flex flex-col justify-center'>
                  <Trash2  className='mx-auto'/>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar exclusão?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Todos os benefícios do estabelecimento também serão excluídos!
                    </AlertDialogDescription>
                    <AlertDialogDescription>
                      A operação <strong className='text-black'>não</strong> poderá ser desfeita!
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <Button variant="destructive" onClick={() => deletePartner(partnerDetailed.id)}>
                      Excluir
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )
          }
        </div>
      </div>

      <div className='bg-white border rounded-md p-4 flex flex-col gap-4'>
        <DetailsRow>
          <DetailsField label="Nome Fantasia" value={partnerDetailed?.fantasyName} />
          <DetailsField label="Razão Social" value={partnerDetailed?.corporateName} />
          <DetailsField label="CNPJ" value={partnerDetailed?.cnpj} />
        </DetailsRow>

        <DetailsRow>
          <DetailsField label="Categoria" value={partnerDetailed?.category.name} />
          <DetailsField label="Tags" value={partnerDetailed?.tags} />
          <DetailsField label="Online" value={partnerDetailed?.isOnline ? 'Sim' : 'Não'} />
        </DetailsRow>

        <DetailsRow>
          <DetailsField label="Status" value={partnerDetailed?.status} />
          <DetailsField label="Data do Cadastro" value={partnerDetailed?.createdAt} />
          <DetailsField label="Telefone Comercial" value={partnerDetailed?.businessPhoneNumber} />
        </DetailsRow>

        <DetailsRow>
          <DetailsField label="URL do Contrato">
            <Link
              className="text-primary font-semibold"
              href={partnerDetailed?.contractUrl || ''}
              rel="noreferrer noopener"
              referrerPolicy="no-referrer"
              target="_blank"
            >
              {partnerDetailed?.contractUrl}
            </Link>
          </DetailsField>
          <DetailsField label="Página Oficial">
            <Link
              className="text-primary font-semibold"
              href={partnerDetailed?.webpage || ''}
              rel="noreferrer noopener"
              referrerPolicy="no-referrer"
              target="_blank"
            >
              {partnerDetailed?.webpage}
            </Link>
          </DetailsField>
          <DetailsField label="Instagram" value={partnerDetailed?.instagram} />
        </DetailsRow>

        <DetailsRow>
          <DetailsField label="Imagem">
            <Link
              className="text-primary font-semibold"
              href={partnerDetailed?.image || ''}
              rel="noreferrer noopener"
              referrerPolicy="no-referrer"
              target="_blank"
            >
              {partnerDetailed?.image}
            </Link>
          </DetailsField>
          <DetailsField label="Logo">
            <Link
              className="text-primary font-semibold"
              href={partnerDetailed?.logo || ''}
              rel="noreferrer noopener"
              referrerPolicy="no-referrer"
              target="_blank"
            >
              {partnerDetailed?.logo}
            </Link>
          </DetailsField>
          <DetailsField label="Horário de Funcionamento" value={partnerDetailed?.openingHours} />
        </DetailsRow>

        <DetailsRow>
          <DetailsField label="Sobre" value={partnerDetailed?.about} />
        </DetailsRow>

        <Separator />

        <DetailsRow>
          <DetailsField label="Nome do Responsável" value={partnerDetailed?.managerName} />
          <DetailsField label="E-mail do Responsável" value={partnerDetailed?.managerEmail} />
          <DetailsField label="Telefone do Responável" value={partnerDetailed?.managerPhoneNumber} width="min-w-52 w-full" />
        </DetailsRow>

        <Separator />

        <DetailsRow>
          <DetailsField label="Endereço" value={partnerDetailed?.address} />
          <DetailsField label="Cidade" value={partnerDetailed?.city} width="min-w-60" />
          <DetailsField label="Estado" value={partnerDetailed?.state} width="min-w-28" />
        </DetailsRow>

        <Separator />

        <DetailsRow>
          <DetailsField label="Título do Benefício 1" value={partnerDetailed?.benefit1Title} />
          <DetailsField label="Voucher do Benefício 1" value={partnerDetailed?.benefit1Link} />
          <DetailsField label="Link do Benefício 1" value={partnerDetailed?.benefit1Voucher} width="min-w-52 w-full" />
        </DetailsRow>

        <DetailsRow>
          <DetailsField label="Descrição do Benefício 1" value={partnerDetailed?.benefit1Description} />
        </DetailsRow>

        <DetailsRow>
          <DetailsField label="Regras do Benefício 1" value={partnerDetailed?.benefit1Rules} />
        </DetailsRow>

        <Separator />

        <DetailsRow>
          <DetailsField label="Título do Benefício 2" value={partnerDetailed?.benefit2Title} />
          <DetailsField label="Voucher do Benefício 2" value={partnerDetailed?.benefit2Link} />
          <DetailsField label="Link do Benefício 2" value={partnerDetailed?.benefit2Voucher} width="min-w-52 w-full" />
        </DetailsRow>

        <DetailsRow>
          <DetailsField label="Descrição do Benefício 2" value={partnerDetailed?.benefit2Description} />
        </DetailsRow>

        <DetailsRow>
          <DetailsField label="Regras do Benefício 2" value={partnerDetailed?.benefit2Rules} />
        </DetailsRow>
      </div>
    </DashboardLayout>
  )
}
