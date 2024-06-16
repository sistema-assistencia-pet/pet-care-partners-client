'use client'

import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
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
import { useToast } from '@/components/ui/use-toast'
import { Separator } from '@/components/ui/separator'
import { useState } from 'react'

const newPartnerFormSchema = z.object({
  cnpj: z
    .string({ required_error: 'O campo CNPJ é obrigatório.' })
    .min(14, { message: 'O campo CNPJ deve ter pelo menos 14 caracteres.' })
    .max(18, { message: 'O campo CNPJ deve ter no máximo 18 caracteres.' }),
  corporateName: z
    .string({ required_error: 'O campo Razão Social é obrigatório.' })
    .optional(),
  fantasyName: z
    .string({ required_error: 'O campo Nome Fantasia é obrigatório.' })
    .min(3, { message: 'O campo Nome Fantasia deve ter pelo menos 3 caracteres.' }),
  address: z
    .string({ required_error: 'O campo Endereço é obrigatório.' })
    .min(3, { message: 'O campo Endereço deve ter pelo menos 3 caracteres.' }),
  state: z
    .string({ required_error: 'O campo Estado é obrigatório.' })
    .length(2, { message: 'O campo Estado deve ter 2 caracteres.' }),
  city: z
    .string({required_error: 'O campo Cidade é obrigatório.' })
    .min(3, { message: 'O campo Cidade deve ter pelo menos 3 caracteres.' }),
  categoryId: z
    .string({required_error: 'O campo Categoria é obrigatório.' })
    .min(1, { message: 'O campo Categoria é obrigatório.' }),
  tags: z
    .string({required_error: 'O campo Tags é obrigatório.' })
    .optional(),
  isOnline: z
    .string({required_error: 'O campo Online é obrigatório.' }),
  managerName: z
    .string({required_error: 'O campo Nome do Responsável é obrigatório.'})
    .min(3, {message: 'O campo Nome do Responsável deve ter pelo menos 3 caracteres.'}),
  managerPhoneNumber: z
    .string({ required_error: 'O campo Telefone do Responsável é obrigatório.' })
    .min(10, { message: 'O campo Telefone do Responsável deve ter pelo menos 10 caracteres.' }),
  managerEmail: z
    .string({ required_error: 'O campo E-mail do Responsável é obrigatório.' })
    // .email({ message: 'O campo E-mail do Responsável deve ser um e-mail válido.' })
    .optional(),
  businessPhoneNumber: z
    .string({ required_error: 'O campo Telefone Comercial é obrigatório.' })
    .min(10, { message: 'O campo Telefone Comercial deve ter pelo menos 10 caracteres.' }),
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

type NewPartnerFormSchema = z.infer<typeof newPartnerFormSchema>

const NEW_PARTNER_FORM_DEFAULT_VALUES: NewPartnerFormSchema = {
  cnpj: '',
  corporateName: '',
  fantasyName: '',
  address: '',
  state: '',
  city: '',
  categoryId: 'none',
  tags: '',
  isOnline: 'true',
  managerPhoneNumber: '',
  managerEmail: '',
  managerName: '',
  businessPhoneNumber: '',
  about: '',
  openingHours: '',
  instagram: '',
  webpage: '',
  contractUrl: '',
  benefit1Title: '',
  benefit1Description: '',
  benefit1Rules: '',
  benefit1Link: '',
  benefit1Voucher: '',
  benefit2Title: '',
  benefit2Description: '',
  benefit2Rules: '',
  benefit2Link: '',
  benefit2Voucher: ''
}

type NewPartnerDataToSendToApi = Omit<NewPartnerFormSchema, 'isOnline' | 'categoryId'> & { isOnline: boolean, categoryId: number }

interface IPostClientSuccessResponse { status: true, partnerId: string }
interface IPostClientFailResponse { status: false }

export default function RegisterPartner() {
  const [imageFileSelected, setImageFileSelected] = useState<File | null>(null)
  const [logoFileSelected, setLogoFileSelected] = useState<File | null>(null)

  const form = useForm<NewPartnerFormSchema>({
    mode: 'onBlur',
    defaultValues: NEW_PARTNER_FORM_DEFAULT_VALUES,
    resolver: zodResolver(newPartnerFormSchema)
  })

  const { back } = useRouter()
  const { toast } = useToast()

  const formatNewPartnerData = (newPartnerData: NewPartnerFormSchema): NewPartnerDataToSendToApi => ({
    ...newPartnerData,
    cnpj: newPartnerData.cnpj
      .replaceAll('.', '').replace('/', '').replace('-', '').replaceAll('_', ''),
    managerPhoneNumber: newPartnerData.managerPhoneNumber
      .replace('(', '').replace(')', '').replace('-', '').replace(' ', '').replaceAll('_', ''),
    businessPhoneNumber: newPartnerData.businessPhoneNumber
      .replace('(', '').replace(')', '').replace('-', '').replace(' ', '').replaceAll('_', ''),
    isOnline: newPartnerData.isOnline === 'true',
    categoryId: parseInt(newPartnerData.categoryId as string || '')
  })

  const postPartner = async (newPartnerData: NewPartnerFormSchema): Promise<IPostClientSuccessResponse | IPostClientFailResponse> => {
    const formattedNewPartnerData = formatNewPartnerData(newPartnerData)
    const response = await sendRequest<{ partnerId: string }>({
      endpoint: '/partner',
      method: 'POST',
      data: formattedNewPartnerData
    })

    if (response.error) {
      toast({
        description: response.message,
        variant: 'destructive'
      })

      return { status: false }
    } else {
      toast({
        description: response.message
      })

      return { status: true, partnerId: response.data.partnerId }
    }
  }

  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files

    if (files && files.length > 0) {
      const file = files[0]

      if (["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
        setImageFileSelected(file)
        toast({
          description: "Imagem selecionada, aguardando envio.",
          variant: "default"
        })
      } else {
        toast({
          description: "O arquivo selecionado não tem a extensão .jpg, .jpeg ou .png",
          variant: "destructive"
        })
        setImageFileSelected(null)
      }
    }
  }

  const handleLogoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files

    if (files && files.length > 0) {
      const file = files[0]

      if (["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
        setLogoFileSelected(file)
        toast({
          description: "Logo selecionada, aguardando envio.",
          variant: "default"
        })
      } else {
        toast({
          description: "O arquivo selecionado não tem a extensão .jpg, .jpeg ou .png",
          variant: "destructive"
        })
        setLogoFileSelected(null)
      }
    }
  }

  const sendImageFile = async (file: File, partnerId: string) => {
    const formData = new FormData()
    formData.append("image", file)

    const response = await sendRequest({
      endpoint: `/partner/${partnerId}/image`,
      method: 'PATCH',
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

  const sendLogoFile = async (file: File, partnerId: string) => {
    const formData = new FormData()
    formData.append("logo", file)

    const response = await sendRequest({
      endpoint: `/partner/${partnerId}/logo`,
      method: 'PATCH',
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

  const handleSubmitPartner = async (newPartnerData: NewPartnerFormSchema) => {
    const postResponse = await postPartner(newPartnerData)
    if (postResponse.status) {
      if (imageFileSelected !== null) await sendImageFile(imageFileSelected, postResponse.partnerId)
      if (logoFileSelected !== null) await sendLogoFile(logoFileSelected, postResponse.partnerId)
      back()
    }
  }

  return (
    <DashboardLayout title="Cadastrar Novo Estabelecimento">
      <Form { ...form }>
        <form
          className='flex flex-col my-4 gap-4'
          onSubmit={form.handleSubmit((data) => handleSubmitPartner(data))}
        >
          <DetailsRow>
            <InputContainer size="w-1/3">
              <Label htmlFor="cnpj">CNPJ</Label>
              <InputMask
                className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                mask="99.999.999/9999-99"
                { ...form.register("cnpj",) }
              />
              {
                form.formState.errors.cnpj
                  && <span className="text-red-500 text-xs">{form.formState.errors.cnpj.message}</span>
              }
            </InputContainer>
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
                mask="(99) 999999999"
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
                mask="(99) 999999999"
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

          <Separator />

          <DetailsRow>
            <InputContainer>
              <Label
                htmlFor="image-file-input"
                className="uppercase bg-primary text-primary-foreground shadow hover:bg-primary/90 leading-9 rounded-md px-8 cursor-pointer"
              >
                Inserir imagem
              </Label>
              <Input
                accept="image/png, image/jpeg"
                className="hidden"
                id="image-file-input"
                onChange={handleImageFileChange}
                type="file"
                multiple={false}
              />
            </InputContainer>
            <InputContainer>
              <Label
                htmlFor="logo-file-input"
                className="uppercase bg-primary text-primary-foreground shadow hover:bg-primary/90 leading-9 rounded-md px-8 cursor-pointer"
              >
                Inserir logo
              </Label>
              <Input
                accept="image/png, image/jpeg"
                className="hidden"
                id="logo-file-input"
                onChange={handleLogoFileChange}
                type="file"
                multiple={false}
              />
            </InputContainer>
          </DetailsRow>

          <Button className="my-4" disabled={!form.formState.isValid} type='submit'>
            Cadastrar estabelecimento
          </Button>
        </form>
      </Form>
    </DashboardLayout>
  )
}
