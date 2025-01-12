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
import { useEffect, useState } from 'react'
import { applyCnpjMask, captalize, formatCurrency, formatDateTime, leaveOnlyDigits } from '@/lib/utils'
import { Textarea } from '@/components/ui/textarea'

export default function RegisterVoucher() {
  // --------------------------- PAGE SETUP ---------------------------
  const { back } = useRouter()
  const { toast } = useToast()

  // --------------------------- CREATE VOUCHER ---------------------------
  interface IVoucherToBeCreated {
    title: string
    description?: string
    rules?: string
    partnerId: string
    value: number
  }

  const createVoucherFormSchema = z.object({
    title: z
      .string({ required_error: 'O campo Título é obrigatório.' })
      .min(1, { message: 'O campo Título é obrigatório.' }),
    description: z
      .string({ required_error: 'O campo Descrição é obrigatório.' })
      .optional(),
    rules: z
      .string({ required_error: 'O campo Regras é obrigatório.' })
      .optional(),
    partnerId: z
      .string({ required_error: 'O campo Estabelecimento é obrigatório.' })
      .uuid({ message: 'O campo Estabelecimento é obrigatório.' }),
    value: z
      .string({ required_error: 'O campo Valor é obrigatório.' })
      .min(1, { message: 'O campo Valor é obrigatório.' })
  })

  type CreateVoucherFormSchema = z.infer<typeof createVoucherFormSchema>
  
  const CREATE_VOUCHER_FORM_DEFAULT_VALUES: CreateVoucherFormSchema = {
    title: '',
    description: '',
    rules: '',
    partnerId: '',
    value: ''
  }

  const createVoucherForm = useForm<CreateVoucherFormSchema>({
    mode: 'onBlur',
    defaultValues: CREATE_VOUCHER_FORM_DEFAULT_VALUES,
    resolver: zodResolver(createVoucherFormSchema)
  })

  const formatCreateVoucherData = (voucherData: CreateVoucherFormSchema): IVoucherToBeCreated => ({
    ...voucherData,
    value: parseInt(leaveOnlyDigits(voucherData.value || '0'))
  })

  const createVoucher = async (createVoucherData: CreateVoucherFormSchema): Promise<void> => {
    const formattedNewVoucherData = formatCreateVoucherData(createVoucherData)

    const response = await sendRequest<{ voucherId: string }>({
      endpoint: '/voucher',
      method: 'POST',
      data: formattedNewVoucherData
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

  // --------------------------- FETCH PARTNERS ---------------------------
    interface ICategory {
      id: number
      name: string
    }

    interface ICity {
      id: number
      name: string
    }

    interface IState {
      id: number
      name: string
    }

    interface IPartner {
      id: string
      cnpj: string
      fantasyName: string
      category: ICategory
      city: ICity
      state: IState
      isOnline: boolean
      statusId: string
      createdAt: string
    }

    const [partners, setPartners] = useState<IPartner[]>([])

    const formatPartner = (partner: IPartner): IPartner => ({
      ...partner,
      cnpj: applyCnpjMask(partner.cnpj ?? ''),
      fantasyName: captalize(partner.fantasyName ?? ''),
      category: { id: partner.category.id, name: captalize(partner.category.name ?? '') },
      city: { id: partner.city.id ?? '', name: captalize(partner.city.name ?? '') },
      state: { id: partner.state.id ?? '', name: captalize(partner.state.name ?? '') },
      createdAt: formatDateTime(partner.createdAt ?? '')
    })

    const fetchPartners = async () => {
      const response = await sendRequest<{ partners: IPartner[] }>({
        endpoint: '/partner',
        method: 'GET',
      })

      if (response.error) {
        toast({
          description: response.message,
          variant: 'destructive'
        })

        setPartners([])

        return
      }

      const formattedPartners = response.data.partners.map((partner) => formatPartner(partner))

      setPartners(formattedPartners)
    }

  // --------------------------- USE EFFECT ---------------------------
  // Carrega lista de estabelecimentos quando a página carrega
  useEffect(() => {
    fetchPartners()
  }, [])

  // --------------------------- RETURN ---------------------------
  return (
    <DashboardLayout title="Cadastrar Novo Voucher">
      <Form { ...createVoucherForm }>
        <form
          className='flex flex-col my-4 gap-4'
          onSubmit={createVoucherForm.handleSubmit((data) => createVoucher(data))}
        >
          <DetailsRow>
            <InputContainer size="w-1/3">
              <Label htmlFor="partnerId">Estabelecimento</Label>
              <FormField
                control={createVoucherForm.control}
                name="partnerId"
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
                        partners.map(({ id, fantasyName }) => (
                          <SelectItem key={uuid()} value={id.toString()}>{fantasyName}</SelectItem>
                        ))
                      }
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              {
                createVoucherForm.formState.errors.partnerId
                  && <span className="text-red-500 text-xs">{createVoucherForm.formState.errors.partnerId.message}</span>
              }
            </InputContainer>
            <InputContainer size="w-1/3">
              <Label htmlFor="title">Título</Label>
              <Input className="bg-white" { ...createVoucherForm.register("title") } />
              {
                createVoucherForm.formState.errors.title
                  && <span className="text-red-500 text-xs">{createVoucherForm.formState.errors.title.message}</span>
              }
            </InputContainer>
            <InputContainer size="w-1/3">
              <Label htmlFor="value">Valor</Label>
              <Controller
                name="value"
                control={createVoucherForm.control}
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
                createVoucherForm.formState.errors.value
                  && <span className="text-red-500 text-xs">{createVoucherForm.formState.errors.value.message}</span>
              }
            </InputContainer>
          </DetailsRow>

          <DetailsRow>
            <InputContainer>
              <Label htmlFor="description">Descrição</Label>
              <Textarea className="bg-white text-wrap" { ...createVoucherForm.register("description") } />
              {
                createVoucherForm.formState.errors.description
                  && <span className="text-red-500 text-xs">{createVoucherForm.formState.errors.description.message}</span>
              }
            </InputContainer>
          </DetailsRow>

          <DetailsRow>
            <InputContainer>
              <Label htmlFor="rules">Regras</Label>
              <Textarea className="bg-white text-wrap" { ...createVoucherForm.register("rules") } />
              {
                createVoucherForm.formState.errors.rules
                  && <span className="text-red-500 text-xs">{createVoucherForm.formState.errors.rules.message}</span>
              }
            </InputContainer>
          </DetailsRow>

          <Button className="my-4" disabled={!createVoucherForm.formState.isValid} type='submit'>
            Cadastrar voucher
          </Button>
        </form>
      </Form>
    </DashboardLayout>
  )
}
