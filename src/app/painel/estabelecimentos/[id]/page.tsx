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
import {
  applyCepMask,
  applyCnpjMask,
  captalize,
  formatDateTime,
  applyPhoneNumberMask,
  leaveOnlyDigits
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { sendRequest } from '@/lib/sendRequest'
import { Separator } from '@/components/ui/separator'
import { STATE, STATUS } from '@/lib/enums'
import { useToast } from '@/components/ui/use-toast'
import { SELECT_DEFAULT_VALUE } from '@/lib/constants'

export default function PartnerDetailsPage() {
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
  
  interface ICategory {
    id: number;
    name: string;
  }
  
  interface IPartnerFromAPI {
    id: string;
    cnpj: string;
    password: string;
    corporateName: string;
    fantasyName: string;
    tags: string;
    isOnline: boolean;
    managerName: string;
    managerPhoneNumber: string;
    managerEmail: string;
    businessPhoneNumber: string;
    about: string;
    openingHours: string;
    image: string | null;
    logo: string | null;
    roleId: number;
    address: IAddress | null;
    status: IStatus;
    category: ICategory;
    createdAt: string;
    updatedAt: string;
  }

  const [partner, setPartner] = useState<IPartnerFromAPI | null>(null)
  const [doesPartnerHaveAddress, setDoesPartnerHaveAddress] = useState<boolean>(false)

  const params = useParams()
  const { toast } = useToast()

  // --------------------------- FETCH PARTNER ---------------------------
  const fetchPartner = async (id: string) => {
    const response = await sendRequest<{ partner: IPartnerFromAPI }>({
      endpoint: `/partner/${id}`,
      method: 'GET',
    })

    if (response.error) {
      toast({
        description: response.message,
        variant: 'destructive'
      })

      setPartner(null)

      return
    }

    fillUpdateForm(response.data.partner)

    setDoesPartnerHaveAddress(response.data.partner.address !== null)
    setPartner(response.data.partner)
  }

  // --------------------------- UPDATE PARTNER ---------------------------
  type IPartnerToBeUpdated = Partial<Omit<IPartnerFromAPI, 'id' | 'createdAt' | 'updatedAt' | 'roleId' | 'image' | 'logo' | 'address' | 'category' | 'status'> & { address: Omit<IAddress, 'id' | 'state' | 'city'> & { cityId?: number } & { stateId?: number } | null } & { categoryId: number }>

  const updatePartnerFormSchema = z.object({
    cnpj: z
      .string({ required_error: 'O campo CNPJ é obrigatório.' })
      .length(14, { message: 'O campo CNPJ deve ter 14 caracteres.' })
      .optional(),
    password: z
      .string({ required_error: 'O campo Senha é obrigatório.' })
      .min(8, { message: 'O campo Senha deve ter pelo menos 8 caracteres.' })
      .optional(),
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
      })
      .nullable()
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

  type UpdatePartnerFormSchema = z.infer<typeof updatePartnerFormSchema>

  const UPDATE_PARTNER_FORM_DEFAULT_VALUES = {
    cnpj: '',
    password: '',
    corporateName: '',
    fantasyName: '',
    address: null,
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

  const updatePartnerForm = useForm<UpdatePartnerFormSchema>({
    mode: 'onBlur',
    defaultValues: UPDATE_PARTNER_FORM_DEFAULT_VALUES,
    resolver: zodResolver(updatePartnerFormSchema)
  })

  const fillUpdateForm = (partner: IPartnerFromAPI) => {
    updatePartnerForm.setValue('cnpj', partner.cnpj)
    updatePartnerForm.setValue('password', partner.password)
    updatePartnerForm.setValue('corporateName', partner.corporateName)
    updatePartnerForm.setValue('fantasyName', partner.fantasyName)
    if (partner.address === null) {
      updatePartnerForm.setValue('address', null)
    } else {
      updatePartnerForm.setValue('address.cep', partner?.address?.cep ?? '')
      updatePartnerForm.setValue('address.street', partner?.address?.street ?? '')
      updatePartnerForm.setValue('address.number', partner?.address?.number ?? '')
      updatePartnerForm.setValue('address.complement', partner?.address?.complement ?? '')
      updatePartnerForm.setValue('address.neighborhood', partner?.address?.neighborhood ?? '')
      updatePartnerForm.setValue('address.cityId', partner?.address?.city?.id ? partner.address.city.id.toString() : '')
      updatePartnerForm.setValue('address.stateId', partner?.address?.state?.id ? partner.address.state.id.toString() : '')
    }
    updatePartnerForm.setValue('categoryId', partner.category.id.toString())
    updatePartnerForm.setValue('tags', partner.tags)
    updatePartnerForm.setValue('isOnline', partner.isOnline.toString())
    updatePartnerForm.setValue('managerName', partner.managerName)
    updatePartnerForm.setValue('managerPhoneNumber', partner.managerPhoneNumber)
    updatePartnerForm.setValue('managerEmail', partner.managerEmail)
    updatePartnerForm.setValue('businessPhoneNumber', partner.businessPhoneNumber)
    updatePartnerForm.setValue('about', partner.about)
    updatePartnerForm.setValue('openingHours', partner.openingHours)
  }

  const formatUpdatePartnerData = (partnerData: UpdatePartnerFormSchema): IPartnerToBeUpdated => {
    let categoryId = partnerData.categoryId
    let stateId = partnerData.address?.stateId
    let cityId = partnerData.address?.cityId

    if (
      (categoryId === SELECT_DEFAULT_VALUE) ||
      (categoryId === '') ||
      (categoryId === null)
    ) categoryId = undefined
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
      categoryId: categoryId !== undefined ? parseInt(categoryId): categoryId,
      address: doesPartnerHaveAddress ? {
        cep: partnerData.address?.cep ?? '',
        street: partnerData.address?.street ?? '',
        number: partnerData.address?.number ?? '',
        complement: partnerData.address?.complement ?? '',
        neighborhood: partnerData.address?.neighborhood ?? '',
        cityId: cityId !== undefined ? parseInt(cityId): cityId,
        stateId: stateId !== undefined ? parseInt(stateId): stateId
      } : null
    }
  }

  const updatePartner = async (partner: UpdatePartnerFormSchema) => {
    const formattedPartner = formatUpdatePartnerData(partner)

    const response = await sendRequest<{ partnerId: string }>({
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

    toast({
      description: response.message,
      variant: "success"
    })

    fetchPartner(params.id as string)
  }

  // --------------------------- ACTIVATE PARTNER ---------------------------
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

  // --------------------------- INACTIVATE PARTNER ---------------------------
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

  // --------------------------- DELETE PARTNER ---------------------------
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

    fetchPartner(partnerId)
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

    fetchPartner(partnerId)
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
  const selectedStateId = updatePartnerForm.watch('address.stateId')

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
  // Dispara envio da imagem ao servidor
  useEffect(() => {
    if (imageFileSelected !== null) sendImageFile(imageFileSelected, params.id as string)
  } , [imageFileSelected])

  // Dispara envio da logo ao servidor
  useEffect(() => {
    if (logoFileSelected !== null) sendLogoFile(logoFileSelected, params.id as string)
  } , [logoFileSelected])

  // Busca dados do estabelecimento quando a página carrega
  useEffect(() => {
    if (params.id) fetchPartner(params.id as string)
  } , [params.id])

  // Carrega lista de cidades quando um estado é selecionado
  // e limpa cidade quando um estado diferente do atual é selecionado
  useEffect(() => {
    if (typeof selectedStateId === 'string' && selectedStateId !== SELECT_DEFAULT_VALUE) {
      fetchCities(selectedStateId)
    }

    if (selectedStateId !== partner?.address?.state.id.toString()) {
      updatePartnerForm.setValue('address.cityId', SELECT_DEFAULT_VALUE)
    }
  }, [selectedStateId])

  // Busca categorias quando a página carrega
  useEffect(() => {
    fetchCategories()
  }, [])

  // --------------------------- RETURN ---------------------------
  return (
    <DashboardLayout
      title={`${partner?.fantasyName || ''}`}
    >
      {/* Header Buttons */}
      <div className="flex justify-between w-full">
        <div className="flex gap-4 justify-end w-full">

        {/* Image Input */}
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

        {/* Logo Input */}
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

        {/* Inactivate Partner */}
        {
          partner?.status?.id === STATUS.Ativo && (
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
                  <Button onClick={() => inactivatePartner(partner.id)}>
                    Inativar
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )
        }

        {/* Activate Partner */}
        {
          partner?.status?.id === STATUS.Inativo && (
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
                  <Button onClick={() => activatePartner(partner.id)}>
                    Ativar
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )
        }

        {/* Update Partner */}
        {
          partner
          && (
            <AlertDialog>
              <AlertDialogTrigger title='Editar' className='rounded-md w-9 h-9 bg-primary text-white flex flex-col justify-center'>
                <Pencil  className='mx-auto'/>
              </AlertDialogTrigger>
              <AlertDialogContent className='max-h-screen overflow-y-auto max-w-[80%]'>
                <AlertDialogTitle>Editar estabelecimento</AlertDialogTitle>
                <Form { ...updatePartnerForm }>
                  <form
                    className='flex flex-col gap-4'
                    onSubmit={updatePartnerForm.handleSubmit((data) => updatePartner(data))}
                  >

                    <DetailsRow>
                      <InputContainer size="w-1/6">
                        <Label htmlFor="cnpj">CNPJ</Label>
                        <Input className="bg-white" { ...updatePartnerForm.register("cnpj") } />
                        {
                          updatePartnerForm.formState.errors.cnpj
                            && <span className="text-red-500 text-xs">{updatePartnerForm.formState.errors.cnpj.message}</span>
                        }
                      </InputContainer>
                      <InputContainer size="w-1/6">
                        <Label htmlFor="password">Senha</Label>
                        <Input className="bg-white" { ...updatePartnerForm.register("password") } />
                        {
                          updatePartnerForm.formState.errors.password
                            && <span className="text-red-500 text-xs">{updatePartnerForm.formState.errors.password.message}</span>
                        }
                      </InputContainer>
                      <InputContainer size="w-2/6">
                        <Label htmlFor="fantasyName">Nome Fantasia</Label>
                        <Input className="bg-white" { ...updatePartnerForm.register("fantasyName") } />
                        {
                          updatePartnerForm.formState.errors.fantasyName
                            && <span className="text-red-500 text-xs">{updatePartnerForm.formState.errors.fantasyName.message}</span>
                        }
                      </InputContainer>
                      <InputContainer size="w-2/6">
                        <Label htmlFor="corporateName">Razão Social</Label>
                        <Input className="bg-white" { ...updatePartnerForm.register("corporateName") } />
                        {
                          updatePartnerForm.formState.errors.corporateName
                            && <span className="text-red-500 text-xs">{updatePartnerForm.formState.errors.corporateName.message}</span>
                        }
                      </InputContainer>
                    </DetailsRow>

                    <DetailsRow>
                      <InputContainer size="w-1/6">
                        <Label htmlFor="openingHours">Horário de Funcionamento</Label>
                        <Input className="bg-white" { ...updatePartnerForm.register("openingHours") } />
                        {
                          updatePartnerForm.formState.errors.openingHours
                            && <span className="text-red-500 text-xs">{updatePartnerForm.formState.errors.openingHours.message}</span>
                        }
                      </InputContainer>
                      <InputContainer size="w-1/6">
                        <Label htmlFor="isOnline">Online</Label>
                        <FormField
                          control={updatePartnerForm.control}
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
                          updatePartnerForm.formState.errors.isOnline
                            && <span className="text-red-500 text-xs">{updatePartnerForm.formState.errors.isOnline.message}</span>
                        }
                      </InputContainer>
                      <InputContainer size="w-1/6">
                        <Label htmlFor="categoryId">Categoria</Label>
                        <FormField
                          control={updatePartnerForm.control}
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
                          updatePartnerForm.formState.errors.categoryId
                            && <span className="text-red-500 text-xs">{updatePartnerForm.formState.errors.categoryId.message}</span>
                        }
                      </InputContainer>
                      <InputContainer size="w-3/6">
                        <Label htmlFor="tags">Tags</Label>
                        <Input className="bg-white" { ...updatePartnerForm.register("tags") } placeholder="Tags sepadas por vírgula" />
                        {
                          updatePartnerForm.formState.errors.tags
                            && <span className="text-red-500 text-xs">{updatePartnerForm.formState.errors.tags.message}</span>
                        }
                      </InputContainer>
                    </DetailsRow>

                    <DetailsRow>
                      <InputContainer>
                        <Label htmlFor="about">Sobre</Label>
                        <Input className="bg-white text-wrap" { ...updatePartnerForm.register("about") } />
                        {
                          updatePartnerForm.formState.errors.about
                            && <span className="text-red-500 text-xs">{updatePartnerForm.formState.errors.about.message}</span>
                        }
                      </InputContainer>
                    </DetailsRow>

                    <Separator />

                    <DetailsRow>
                      <InputContainer size="w-2/6">
                        <Label htmlFor="managerName">Nome do Responsável</Label>
                        <Input className="bg-white" { ...updatePartnerForm.register("managerName") } />
                        {
                          updatePartnerForm.formState.errors.managerName
                            && <span className="text-red-500 text-xs">{updatePartnerForm.formState.errors.managerName.message}</span>
                        }
                      </InputContainer>
                      <InputContainer size="w-2/6">
                        <Label htmlFor="managerEmail">E-mail do Responsável</Label>
                        <Input className="bg-white" { ...updatePartnerForm.register("managerEmail") } />
                        {
                          updatePartnerForm.formState.errors.managerEmail
                            && <span className="text-red-500 text-xs">{updatePartnerForm.formState.errors.managerEmail.message}</span>
                        }
                      </InputContainer>
                      <InputContainer size="w-1/6">
                        <Label htmlFor="managerPhoneNumber">Telefone do Responsável</Label>
                        <InputMask
                          className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          mask="(99) 999999999"
                          { ...updatePartnerForm.register("managerPhoneNumber",) }
                        />
                        {
                          updatePartnerForm.formState.errors.managerPhoneNumber
                            && <span className="text-red-500 text-xs">{updatePartnerForm.formState.errors.managerPhoneNumber.message}</span>
                        }
                      </InputContainer>
                      <InputContainer size="w-1/6">
                        <Label htmlFor="businessPhoneNumber">Telefone Comercial</Label>
                        <InputMask
                          className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          mask="(99) 999999999"
                          { ...updatePartnerForm.register("businessPhoneNumber") }
                        />
                        {
                          updatePartnerForm.formState.errors.businessPhoneNumber
                            && <span className="text-red-500 text-xs">{updatePartnerForm.formState.errors.businessPhoneNumber.message}</span>
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
                            <Input className="bg-white" { ...updatePartnerForm.register("address.cep") } />
                            {
                              updatePartnerForm.formState.errors.address?.cep
                                && <span className="text-red-500 text-xs">{updatePartnerForm.formState.errors.address.cep.message}</span>
                            }
                          </InputContainer>
                        )
                      }
                      {
                        doesPartnerHaveAddress && (
                          <InputContainer size="w-3/5">
                            <Label htmlFor="address.street">Rua</Label>
                            <Input className="bg-white" { ...updatePartnerForm.register("address.street") } />
                            {
                              updatePartnerForm.formState.errors.address?.street
                                && <span className="text-red-500 text-xs">{updatePartnerForm.formState.errors.address.street.message}</span>
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
                              <Input className="bg-white" { ...updatePartnerForm.register("address.number") } />
                              {
                                updatePartnerForm.formState.errors.address?.number
                                  && <span className="text-red-500 text-xs">{updatePartnerForm.formState.errors.address.number.message}</span>
                              }
                            </InputContainer>
                            <InputContainer size="w-1/5">
                              <Label htmlFor="address.complement">Complemento</Label>
                              <Input className="bg-white" { ...updatePartnerForm.register("address.complement") } />
                              {
                                updatePartnerForm.formState.errors.address?.complement
                                  && <span className="text-red-500 text-xs">{updatePartnerForm.formState.errors.address.complement.message}</span>
                              }
                            </InputContainer>
                            <InputContainer size="w-1/5">
                              <Label htmlFor="address.neighborhood">Bairro</Label>
                              <Input className="bg-white" { ...updatePartnerForm.register("address.neighborhood") } />
                              {
                                updatePartnerForm.formState.errors.address?.neighborhood
                                  && <span className="text-red-500 text-xs">{updatePartnerForm.formState.errors.address.neighborhood.message}</span>
                              }
                            </InputContainer>
                            <InputContainer size="w-1/5">
                              <Label htmlFor="address.stateId">Estado</Label>
                              <FormField
                                control={updatePartnerForm.control}
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
                                updatePartnerForm.formState.errors.address?.stateId
                                  && <span className="text-red-500 text-xs">{updatePartnerForm.formState.errors.address.stateId.message}</span>
                              }
                            </InputContainer>
                            <InputContainer size="w-1/5">
                              <Label htmlFor="address.cityId">Cidade</Label>
                              <FormField
                                control={updatePartnerForm.control}
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
                                updatePartnerForm.formState.errors.address?.cityId
                                  && <span className="text-red-500 text-xs">{updatePartnerForm.formState.errors.address.cityId.message}</span>
                              }
                            </InputContainer>
                          </DetailsRow>
                        )
                      }

                    <AlertDialogFooter>
                      <AlertDialogCancel type="button">Fechar</AlertDialogCancel>
                      <AlertDialogCancel type="button" onClick={() => fillUpdateForm(partner)}>
                        Cancelar
                      </AlertDialogCancel>
                      <AlertDialogAction type="submit" disabled={!updatePartnerForm.formState.isValid}>
                        Confirmar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </form>
                </Form>
              </AlertDialogContent>
            </AlertDialog>
          )
        }

        {/* Delete Partner */}
        {
          partner
          && [STATUS.Ativo, STATUS.Inativo].includes(partner.status.id)
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
                  <Button variant="destructive" onClick={() => deletePartner(partner.id)}>
                    Excluir
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )
        }
        </div>
      </div>

      {/* Partner Details */}
      <div className='bg-white border rounded-md p-4 flex flex-col gap-4'>
        <DetailsRow>
          <DetailsField label="Nome Fantasia" value={captalize(partner?.fantasyName ?? '')} />
          <DetailsField label="Razão Social" value={captalize(partner?.corporateName ?? '')} />
          <DetailsField label="CNPJ" value={applyCnpjMask(partner?.cnpj ?? '')} />
        </DetailsRow>

        <DetailsRow>
          <DetailsField label="Categoria" value={captalize(partner?.category?.name ?? '')} />
          <DetailsField label="Tags" value={partner?.tags ?? ''} />
          <DetailsField label="Online" value={partner?.isOnline ? 'Sim' : 'Não'} />
        </DetailsRow>

        <DetailsRow>
          <DetailsField label="Status" value={captalize(partner?.status?.translation ?? '')} />
          <DetailsField label="Data do Cadastro" value={formatDateTime(partner?.createdAt ?? '')} />
          <DetailsField label="Telefone Comercial" value={applyPhoneNumberMask(partner?.businessPhoneNumber ?? '')} />
        </DetailsRow>

        <DetailsRow>
          <DetailsField label="Imagem">
            <Link
              className="text-primary font-semibold"
              href={partner?.image ?? ''}
              rel="noreferrer noopener"
              referrerPolicy="no-referrer"
              target="_blank"
            >
              {partner?.image}
            </Link>
          </DetailsField>
          <DetailsField label="Logo">
            <Link
              className="text-primary font-semibold"
              href={partner?.logo ?? ''}
              rel="noreferrer noopener"
              referrerPolicy="no-referrer"
              target="_blank"
            >
              {partner?.logo}
            </Link>
          </DetailsField>
          <DetailsField label="Horário de Funcionamento" value={partner?.openingHours ?? ''} />
        </DetailsRow>

        <DetailsRow>
          <DetailsField label="Sobre" value={partner?.about ?? ''} />
        </DetailsRow>

        <Separator />

        <DetailsRow>
          <DetailsField label="Nome do Responsável" value={captalize(partner?.managerName ?? '')} />
          <DetailsField label="E-mail do Responsável" value={partner?.managerEmail ?? ''} />
          <DetailsField label="Telefone do Responável" value={applyPhoneNumberMask(partner?.managerPhoneNumber ?? '')} />
        </DetailsRow>

        <Separator />

        <DetailsRow>
          <DetailsField label="CEP" value={applyCepMask(partner?.address?.cep ?? '')} width="w-1/5"/>
          <DetailsField label="Rua" value={partner?.address?.street ?? ''} width='w-full' />
        </DetailsRow>

        <DetailsRow>
          <DetailsField label="Número" value={partner?.address?.number ?? ''} />
          <DetailsField label="Complemento" value={partner?.address?.complement ?? ''} />
          <DetailsField label="Bairro" value={captalize(partner?.address?.neighborhood ?? '')} />
          <DetailsField label="Cidade" value={captalize(partner?.address?.city?.name ?? '')} />
          <DetailsField label="Estado" value={captalize(partner?.address?.state?.name ?? '')} />
        </DetailsRow>
      </div>
    </DashboardLayout>
  )
}
