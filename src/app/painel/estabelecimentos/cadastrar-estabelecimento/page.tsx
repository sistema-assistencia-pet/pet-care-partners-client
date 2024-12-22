'use client'

import { useForm } from 'react-hook-form'
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
import { useToast } from '@/components/ui/use-toast'
import { Separator } from '@/components/ui/separator'
import { useEffect, useState } from 'react'
import { captalize, leaveOnlyDigits } from '@/lib/utils'
import { SELECT_DEFAULT_VALUE } from '@/lib/constants'
import { STATE } from '@/lib/enums'
import { Textarea } from '@/components/ui/textarea'

export default function RegisterPartner() {
  // --------------------------- PAGE SETUP ---------------------------
  const { back } = useRouter()
  const { toast } = useToast()

  // --------------------------- CREATE PARTNER ---------------------------
  interface IPostClientSuccessResponse { status: true, partnerId: string }
  interface IPostClientFailResponse { status: false }

  interface IAddress {
    cep?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    cityId?: number;
    stateId?: number;
  }

  interface IPartnerToBeCreated {
    cnpj: string;
    password: string;
    corporateName?: string;
    fantasyName?: string;
    tags?: string;
    isOnline: boolean;
    managerName?: string;
    managerPhoneNumber?: string;
    managerEmail?: string;
    businessPhoneNumber?: string;
    about?: string;
    openingHours?: string;
    address: IAddress;
    categoryId: number;
  }

  const createPartnerFormSchema = z.object({
    cnpj: z
      .string({ required_error: 'O campo CNPJ é obrigatório.' })
      .length(14, { message: 'O campo CNPJ deve ter 14 caracteres.' }),
    password: z
      .string({ required_error: 'O campo Senha é obrigatório.' })
      .min(8, { message: 'O campo Senha deve ter pelo menos 8 caracteres.' }),
    corporateName: z
      .string({ required_error: 'O campo Razão Social é obrigatório.' })
      .optional(),
    fantasyName: z
      .string({ required_error: 'O campo Nome Fantasia é obrigatório.' })
      .min(3, { message: 'O campo Nome Fantasia deve ter pelo menos 3 caracteres.' })
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
      }),
    categoryId: z
      .string({required_error: 'O campo Categoria é obrigatório.' })
      .min(1, { message: 'O campo Categoria é obrigatório.' }),
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
      .min(10, { message: 'O campo Telefone do Responsável deve ter 10 ou 11 caracteres.' })
      .min(11, { message: 'O campo Telefone do Responsável deve ter 10 ou 11 caracteres.' })
      .optional(),
    managerEmail: z
      .string({ required_error: 'O campo E-mail do Responsável é obrigatório.' })
      .optional(),
    businessPhoneNumber: z
      .string({ required_error: 'O campo Telefone Comercial é obrigatório.' })
      .min(10, { message: 'O campo Telefone Comercial deve ter 10 ou 11 caracteres.' })
      .min(11, { message: 'O campo Telefone Comercial deve ter 10 ou 11 caracteres.' })
      .optional(),
    about: z
      .string({ required_error: 'O campo Sobre é obrigatório.' })
      .optional(),
    openingHours: z
      .string({ required_error: 'O campo Horário de Funcionamento é obrigatório.' })
      .optional()
  })
  
  type CreatePartnerFormSchema = z.infer<typeof createPartnerFormSchema>
  
  const CREATE_PARTNER_FORM_DEFAULT_VALUES: CreatePartnerFormSchema = {
    cnpj: '',
    password: '',
    corporateName: '',
    fantasyName: '',
    address: {
      cep: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      cityId: SELECT_DEFAULT_VALUE,
      stateId: SELECT_DEFAULT_VALUE
    },
    categoryId: SELECT_DEFAULT_VALUE,
    tags: '',
    isOnline: 'true',
    managerName: '',
    managerPhoneNumber: '',
    managerEmail: '',
    businessPhoneNumber: '',
    about: '',
    openingHours: ''
  }

  const createPartnerForm = useForm<CreatePartnerFormSchema>({
    mode: 'onBlur',
    defaultValues: CREATE_PARTNER_FORM_DEFAULT_VALUES,
    resolver: zodResolver(createPartnerFormSchema)
  })

  const formatCreatePartnerData = (partnerData: CreatePartnerFormSchema): IPartnerToBeCreated => {
    let stateId = partnerData.address?.stateId
    let cityId = partnerData.address?.cityId

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
      ...partnerData,
      managerPhoneNumber: leaveOnlyDigits(partnerData.managerPhoneNumber ?? ''),
      businessPhoneNumber: leaveOnlyDigits(partnerData.businessPhoneNumber ?? ''),
      isOnline: partnerData.isOnline === 'true',
      categoryId: partnerData.categoryId !== undefined ? parseInt(partnerData.categoryId): partnerData.categoryId,
      address: {
        cep: partnerData.address?.cep ?? '',
        street: partnerData.address?.street ?? '',
        number: partnerData.address?.number ?? '',
        complement: partnerData.address?.complement ?? '',
        neighborhood: partnerData.address?.neighborhood ?? '',
        cityId: cityId !== undefined ? parseInt(cityId): cityId,
        stateId: stateId !== undefined ? parseInt(stateId): stateId
      }
    }
  }

  const createPartner = async (createPartnerData: CreatePartnerFormSchema): Promise<IPostClientSuccessResponse | IPostClientFailResponse> => {
    const formattedNewPartnerData = formatCreatePartnerData(createPartnerData)

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

  const handleSubmitPartner = async (createPartnerData: CreatePartnerFormSchema) => {
    const postResponse = await createPartner(createPartnerData)
    if (postResponse.status) {
      if (imageFileSelected !== null) await sendImageFile(imageFileSelected, postResponse.partnerId)
      if (logoFileSelected !== null) await sendLogoFile(logoFileSelected, postResponse.partnerId)
      back()
    }
  }

  // --------------------------- PARTNER IMAGE ---------------------------
  const [imageFileSelected, setImageFileSelected] = useState<File | null>(null)

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

  // --------------------------- PARTNER LOGO ---------------------------
  const [logoFileSelected, setLogoFileSelected] = useState<File | null>(null)

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

  // --------------------------- FETCH CATEGORIES ---------------------------
  interface ICategory {
    id: number
    name: string
  }

  const [categories, setCategories] = useState<ICategory[]>([])

  const formatCategory = (category: ICategory): ICategory => ({
    ...category,
    name: captalize(category.name),
  })

  const fetchCategories = async () => {
    const response = await sendRequest<
      { categories: ICategory[] }
    >({
      endpoint: '/category',
      method: 'GET',
    })

    if (response.error) {
      toast({
        description: response.message,
        variant: 'destructive'
      })

      setCategories([])

      return
    }

    const formattedCategories = response.data.categories.map((category) => formatCategory(category))

    setCategories(formattedCategories)
  }

  // --------------------------- FETCH CITIES ---------------------------
  interface ICity {
    id: number
    name: string
  }

  const selectedStateId = createPartnerForm.watch('address.stateId')

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
  // Carrega lista de cidades quando um estado é selecionado
  // e limpa cidade quando outro estado é selecionado
  useEffect(() => {
    if (typeof selectedStateId === 'string' && selectedStateId !== SELECT_DEFAULT_VALUE) {
      createPartnerForm.setValue('address.cityId', SELECT_DEFAULT_VALUE)
      fetchCities(selectedStateId)
    }
  }, [selectedStateId])

  // Busca categorias quando a página carrega
  useEffect(() => {
    fetchCategories()
  }, [])

  // --------------------------- RETURN ---------------------------
  return (
    <DashboardLayout title="Cadastrar Novo Estabelecimento">
      <Form { ...createPartnerForm }>
        <form
          className='flex flex-col my-4 gap-4'
          onSubmit={createPartnerForm.handleSubmit((data) => handleSubmitPartner(data))}
        >
          <DetailsRow>
            <InputContainer size="w-1/6">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input className="bg-white" { ...createPartnerForm.register("cnpj") } />
              {
                createPartnerForm.formState.errors.cnpj
                  && <span className="text-red-500 text-xs">{createPartnerForm.formState.errors.cnpj.message}</span>
              }
            </InputContainer>
            <InputContainer size="w-1/6">
              <Label htmlFor="password">Senha</Label>
              <Input className="bg-white" { ...createPartnerForm.register("password") } />
              {
                createPartnerForm.formState.errors.password
                  && <span className="text-red-500 text-xs">{createPartnerForm.formState.errors.password.message}</span>
              }
            </InputContainer>
            <InputContainer size="w-2/6">
              <Label htmlFor="fantasyName">Nome Fantasia</Label>
              <Input className="bg-white" { ...createPartnerForm.register("fantasyName") } />
              {
                createPartnerForm.formState.errors.fantasyName
                  && <span className="text-red-500 text-xs">{createPartnerForm.formState.errors.fantasyName.message}</span>
              }
            </InputContainer>
            <InputContainer size="w-2/6">
              <Label htmlFor="corporateName">Razão Social</Label>
              <Input className="bg-white" { ...createPartnerForm.register("corporateName") } />
              {
                createPartnerForm.formState.errors.corporateName
                  && <span className="text-red-500 text-xs">{createPartnerForm.formState.errors.corporateName.message}</span>
              }
            </InputContainer>
          </DetailsRow>

          <DetailsRow>
            <InputContainer size="w-1/6">
              <Label htmlFor="openingHours">Horário de Funcionamento</Label>
              <Input className="bg-white" { ...createPartnerForm.register("openingHours") } />
              {
                createPartnerForm.formState.errors.openingHours
                  && <span className="text-red-500 text-xs">{createPartnerForm.formState.errors.openingHours.message}</span>
              }
            </InputContainer>
            <InputContainer size="w-1/6">
              <Label htmlFor="isOnline">Online</Label>
              <FormField
                control={createPartnerForm.control}
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
                createPartnerForm.formState.errors.isOnline
                  && <span className="text-red-500 text-xs">{createPartnerForm.formState.errors.isOnline.message}</span>
              }
            </InputContainer>
            <InputContainer size="w-1/6">
              <Label htmlFor="categoryId">Categoria</Label>
              <FormField
                control={createPartnerForm.control}
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
                        {
                          categories.map((category) => (
                            <SelectItem key={uuid()} value={category.id.toString()}>{category.name}</SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              {
                createPartnerForm.formState.errors.categoryId
                  && <span className="text-red-500 text-xs">{createPartnerForm.formState.errors.categoryId.message}</span>
              }
            </InputContainer>
            <InputContainer size="w-3/6">
              <Label htmlFor="tags">Tags</Label>
              <Input className="bg-white" { ...createPartnerForm.register("tags") } placeholder="Tags sepadas por vírgula" />
              {
                createPartnerForm.formState.errors.tags
                  && <span className="text-red-500 text-xs">{createPartnerForm.formState.errors.tags.message}</span>
              }
            </InputContainer>
          </DetailsRow>

          <DetailsRow>
            <InputContainer>
              <Label htmlFor="about">Sobre</Label>
              <Textarea className="bg-white text-wrap" { ...createPartnerForm.register("about") } />
              {
                createPartnerForm.formState.errors.about
                  && <span className="text-red-500 text-xs">{createPartnerForm.formState.errors.about.message}</span>
              }
            </InputContainer>
          </DetailsRow>

          <Separator />

          <DetailsRow>
            <InputContainer size="w-2/6">
              <Label htmlFor="managerName">Nome do Responsável</Label>
              <Input className="bg-white" { ...createPartnerForm.register("managerName") } />
              {
                createPartnerForm.formState.errors.managerName
                  && <span className="text-red-500 text-xs">{createPartnerForm.formState.errors.managerName.message}</span>
              }
            </InputContainer>
            <InputContainer size="w-2/6">
              <Label htmlFor="managerEmail">E-mail do Responsável</Label>
              <Input className="bg-white" { ...createPartnerForm.register("managerEmail") } />
              {
                createPartnerForm.formState.errors.managerEmail
                  && <span className="text-red-500 text-xs">{createPartnerForm.formState.errors.managerEmail.message}</span>
              }
            </InputContainer>
            <InputContainer size="w-1/6">
              <Label htmlFor="managerPhoneNumber">Telefone do Responsável</Label>
              <InputMask
                className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                mask="(99) 999999999"
                { ...createPartnerForm.register("managerPhoneNumber",) }
              />
              {
                createPartnerForm.formState.errors.managerPhoneNumber
                  && <span className="text-red-500 text-xs">{createPartnerForm.formState.errors.managerPhoneNumber.message}</span>
              }
            </InputContainer>
            <InputContainer size="w-1/6">
              <Label htmlFor="businessPhoneNumber">Telefone Comercial</Label>
              <InputMask
                className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                mask="(99) 999999999"
                { ...createPartnerForm.register("businessPhoneNumber") }
              />
              {
                createPartnerForm.formState.errors.businessPhoneNumber
                  && <span className="text-red-500 text-xs">{createPartnerForm.formState.errors.businessPhoneNumber.message}</span>
              }
            </InputContainer>
          </DetailsRow>

          <Separator />

          <DetailsRow>
            <InputContainer size="w-1/5">
              <Label htmlFor="address.cep">CEP</Label>
              <Input className="bg-white" { ...createPartnerForm.register("address.cep") } />
              {
                createPartnerForm.formState.errors.address?.cep
                  && <span className="text-red-500 text-xs">{createPartnerForm.formState.errors.address.cep.message}</span>
              }
            </InputContainer>
            <InputContainer size="w-4/5">
              <Label htmlFor="address.street">Rua</Label>
              <Input className="bg-white" { ...createPartnerForm.register("address.street") } />
              {
                createPartnerForm.formState.errors.address?.street
                  && <span className="text-red-500 text-xs">{createPartnerForm.formState.errors.address.street.message}</span>
              }
            </InputContainer>
          </DetailsRow>

          <DetailsRow>
            <InputContainer size="w-1/5">
              <Label htmlFor="address.number">Número</Label>
              <Input className="bg-white" { ...createPartnerForm.register("address.number") } />
              {
                createPartnerForm.formState.errors.address?.number
                  && <span className="text-red-500 text-xs">{createPartnerForm.formState.errors.address.number.message}</span>
              }
            </InputContainer>
            <InputContainer size="w-1/5">
              <Label htmlFor="address.complement">Complemento</Label>
              <Input className="bg-white" { ...createPartnerForm.register("address.complement") } />
              {
                createPartnerForm.formState.errors.address?.complement
                  && <span className="text-red-500 text-xs">{createPartnerForm.formState.errors.address.complement.message}</span>
              }
            </InputContainer>
            <InputContainer size="w-1/5">
              <Label htmlFor="address.neighborhood">Bairro</Label>
              <Input className="bg-white" { ...createPartnerForm.register("address.neighborhood") } />
              {
                createPartnerForm.formState.errors.address?.neighborhood
                  && <span className="text-red-500 text-xs">{createPartnerForm.formState.errors.address.neighborhood.message}</span>
              }
            </InputContainer>
            <InputContainer size="w-1/5">
              <Label htmlFor="address.stateId">Estado</Label>
              <FormField
                control={createPartnerForm.control}
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
                createPartnerForm.formState.errors.address?.stateId
                  && <span className="text-red-500 text-xs">{createPartnerForm.formState.errors.address.stateId.message}</span>
              }
            </InputContainer>
            <InputContainer size="w-1/5">
              <Label htmlFor="address.cityId">Cidade</Label>
              <FormField
                control={createPartnerForm.control}
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
                createPartnerForm.formState.errors.address?.cityId
                  && <span className="text-red-500 text-xs">{createPartnerForm.formState.errors.address.cityId.message}</span>
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

          <Button className="my-4" disabled={!createPartnerForm.formState.isValid} type='submit'>
            Cadastrar estabelecimento
          </Button>
        </form>
      </Form>
    </DashboardLayout>
  )
}
