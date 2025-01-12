'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
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
  captalize,
  formatDateTime,
  leaveOnlyDigits,
  transformCurrencyFromCentsToBRLString
} from '@/lib/utils'
import { Button } from '@/components/ui/button'
import DashboardLayout from '@/components/DashboardLayout'
import { DetailsField } from '@/components/DetailsField'
import { DetailsRow } from '@/components/DetailsRow'
import { Form } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { InputContainer } from '@/components/InputContainer'
import InputMask from "react-input-mask"
import { Label } from '@/components/ui/label'
import { Pencil, Trash2 } from 'lucide-react'
import { sendRequest } from '@/lib/sendRequest'
import { Separator } from '@/components/ui/separator'
import { ROLE, STATUS } from '@/lib/enums'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/contexts/AuthContext'

export default function VoucherDetailsPage() {
  // --------------------------- PAGE SETUP ---------------------------
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

  interface IStatus {
    id: number
    translation: string
  }

  interface IPartner {
    id: string
    cnpj: string
    fantasyName: string
    category: ICategory
    city: ICity
    state: IState
  }

  interface IVoucherFromAPI {
    id: string
    title: string
    description: string
    rules: string
    value: number
    partner: IPartner
    status: IStatus
    createdAt: string
    updatedAt: string
  }

  const params = useParams()
  const { push } = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  
  // --------------------------- FETCH VOUCHER ---------------------------
  const [voucher, setVoucher] = useState<IVoucherFromAPI | null>(null)

  const fillUpdateForm = (voucher: IVoucherFromAPI) => {
    updateVoucherForm.setValue('title', voucher.title)
    updateVoucherForm.setValue('description', voucher.description)
    updateVoucherForm.setValue('rules', voucher.rules)
    updateVoucherForm.setValue('value', transformCurrencyFromCentsToBRLString(voucher.value))
  }

  const fetchVoucher = async (id: string) => {
    const response = await sendRequest<{ voucher: IVoucherFromAPI }>({
      endpoint: `/voucher/${id}`,
      method: 'GET',
    })

    if (response.error) {
      toast({
        description: response.message,
        variant: 'destructive'
      })

      setVoucher(null)

      return
    }

    fillUpdateForm(response.data.voucher)

    setVoucher(response.data.voucher)
  }

  // --------------------------- UPDATE VOUCHER ---------------------------
  type IVoucherToBeUpdated = Partial<Pick<IVoucherFromAPI, 'title' | 'description' | 'rules' | 'value'>>

  const updateVoucherFormSchema = z.object({
    title: z
      .string({ required_error: 'O campo Título é obrigatório.' })
      .min(1, { message: 'O campo Título é obrigatório.' })
      .optional(),
    description: z
      .string({ required_error: 'O campo Descrição é obrigatório.' })
      .min(1, { message: 'O campo Título é obrigatório.' })
      .optional(),
    rules: z
      .string({ required_error: 'O campo Regras é obrigatório.' })
      .min(1, { message: 'O campo Título é obrigatório.' })
      .optional(),
    value: z
      .string({ required_error: 'O campo Valor é obrigatório.' })
      .optional(),
  })

  type UpdateVoucherFormSchema = z.infer<typeof updateVoucherFormSchema>

  const UPDATE_VOUCHER_FORM_DEFAULT_VALUES = {
    title: '',
    description: '',
    rules: '',
    value: ''
  }

  const updateVoucherForm = useForm<UpdateVoucherFormSchema>({
    mode: 'onBlur',
    defaultValues: UPDATE_VOUCHER_FORM_DEFAULT_VALUES,
    resolver: zodResolver(updateVoucherFormSchema)
  })

  const formatUpdateVoucherData = (voucherData: UpdateVoucherFormSchema): IVoucherToBeUpdated => ({
    ...voucherData,
    value: parseInt(leaveOnlyDigits(voucherData.value ?? ''))
  })

  const updateVoucher = async (voucher: UpdateVoucherFormSchema) => {
    const formattedVoucher = formatUpdateVoucherData(voucher)

    const response = await sendRequest<{ voucherId: string }>({
      endpoint: `/voucher/${params.id}`,
      method: 'PATCH',
      data: formattedVoucher,
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

    fetchVoucher(params.id as string)
  }

  // --------------------------- ACTIVATE VOUCHER ---------------------------
  const activateVoucher = async (id: string) => {
    const response = await sendRequest({
      endpoint: `/voucher/${id}/activate`,
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

    fetchVoucher(id)
  }

  // --------------------------- INACTIVATE VOUCHER ---------------------------
  const inactivateVoucher = async (id: string) => {
    const response = await sendRequest({
      endpoint: `/voucher/${id}/inactivate`,
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

    fetchVoucher(id)
  }

  // --------------------------- DELETE VOUCHER ---------------------------
  const deleteVoucher = async (id: string) => {
    const response = await sendRequest({
      endpoint: `/voucher/${id}/delete`,
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

    fetchVoucher(id)
  }

  // --------------------------- USE EFFECT ---------------------------
  // Busca dados do voucher quando a página carrega
  useEffect(() => {
    if (params.id) fetchVoucher(params.id as string)
  } , [params.id])

  // --------------------------- RETURN ---------------------------
  return (
    <DashboardLayout
      title={`${voucher?.title || ''}`}
    >
      {/* Header Buttons */}
      {
        user?.roleId === ROLE.MASTER && (
          <div className="flex justify-between w-full">
            <Button type="button" onClick={() => push(`/painel/vouchers/${params.id}/codigos`)}>
              Visualizar Códigos
            </Button>
            <div className="flex gap-4 justify-end w-full">

              {/* Inactivate Voucher */}
              {
                voucher?.status?.id === STATUS.Ativo && (
                  <AlertDialog>
                    <AlertDialogTrigger className='uppercase px-8 h-9 text-sm font-medium rounded-md border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground'>Inativar</AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar inativação?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Todos os benefícios do voucher também serão inativados!
                        </AlertDialogDescription>
                        <AlertDialogDescription>
                          Essa ação poderá ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <Button onClick={() => inactivateVoucher(voucher.id)}>
                          Inativar
                        </Button>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )
              }

              {/* Activate Voucher */}
              {
                voucher?.status?.id === STATUS.Inativo && (
                  <AlertDialog>
                    <AlertDialogTrigger className='uppercase px-8 h-9 rounded-md text-sm font-medium border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground'>Ativar</AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar ativação?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Todos os benefícios do voucher também serão ativados!
                        </AlertDialogDescription>
                        <AlertDialogDescription>
                          Essa ação poderá ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <Button onClick={() => activateVoucher(voucher.id)}>
                          Ativar
                        </Button>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )
              }

              {/* Update Voucher */}
              {
                voucher
                && (
                  <AlertDialog>
                    <AlertDialogTrigger title='Editar' className='rounded-md w-9 h-9 bg-primary text-white flex flex-col justify-center'>
                      <Pencil  className='mx-auto'/>
                    </AlertDialogTrigger>
                    <AlertDialogContent className='max-h-screen overflow-y-auto max-w-[80%]'>
                      <AlertDialogTitle>Editar voucher</AlertDialogTitle>
                      <Form { ...updateVoucherForm }>
                        <form
                          className='flex flex-col gap-4'
                          onSubmit={updateVoucherForm.handleSubmit((data) => updateVoucher(data))}
                        >

                          <DetailsRow>
                            <InputContainer size="w-2/3">
                              <Label htmlFor="title">Título</Label>
                              <Input className="bg-white" { ...updateVoucherForm.register("title") } />
                              {
                                updateVoucherForm.formState.errors.title
                                  && <span className="text-red-500 text-xs">{updateVoucherForm.formState.errors.title.message}</span>
                              }
                            </InputContainer>
                            <InputContainer size="w-1/3">
                              <Label htmlFor="value">Valor</Label>
                              <InputMask
                                className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                mask="99,99"
                                { ...updateVoucherForm.register("value") }
                              />
                              {
                                updateVoucherForm.formState.errors.value
                                  && <span className="text-red-500 text-xs">{updateVoucherForm.formState.errors.value.message}</span>
                              }
                            </InputContainer>
                          </DetailsRow>

                          <DetailsRow>
                            <InputContainer size="w-full">
                              <Label htmlFor="description">Descrição</Label>
                              <Textarea className="bg-white" { ...updateVoucherForm.register("description") } />
                              {
                                updateVoucherForm.formState.errors.description
                                  && <span className="text-red-500 text-xs">{updateVoucherForm.formState.errors.description.message}</span>
                              }
                            </InputContainer>
                          </DetailsRow>

                          <DetailsRow>
                            <InputContainer size="w-full">
                              <Label htmlFor="rules">Regras</Label>
                              <Textarea className="bg-white" { ...updateVoucherForm.register("rules") } />
                              {
                                updateVoucherForm.formState.errors.rules
                                  && <span className="text-red-500 text-xs">{updateVoucherForm.formState.errors.rules.message}</span>
                              }
                            </InputContainer>
                          </DetailsRow>

                          <AlertDialogFooter>
                            <AlertDialogCancel type="button">Fechar</AlertDialogCancel>
                            <AlertDialogCancel type="button" onClick={() => fillUpdateForm(voucher)}>
                              Cancelar
                            </AlertDialogCancel>
                            <AlertDialogAction type="submit" disabled={!updateVoucherForm.formState.isValid}>
                              Confirmar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </form>
                      </Form>
                    </AlertDialogContent>
                  </AlertDialog>
                )
              }

              {/* Delete Voucher */}
              {
                voucher
                && [STATUS.Ativo, STATUS.Inativo].includes(voucher.status.id)
                && (
                  <AlertDialog>
                    <AlertDialogTrigger title='Excluir' className='rounded-md w-9 h-9 bg-destructive text-white flex flex-col justify-center'>
                      <Trash2  className='mx-auto'/>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Todos os benefícios do voucher também serão excluídos!
                        </AlertDialogDescription>
                        <AlertDialogDescription>
                          A operação <strong className='text-black'>não</strong> poderá ser desfeita!
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <Button variant="destructive" onClick={() => deleteVoucher(voucher.id)}>
                          Excluir
                        </Button>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )
              }

            </div>
          </div>
        )
      }

      {/* Voucher Details */}
      <div className='bg-white border rounded-md p-4 flex flex-col gap-4'>
        <DetailsRow>
          <DetailsField label="Título" value={captalize(voucher?.title ?? '')} />
          <DetailsField label="Valor" value={transformCurrencyFromCentsToBRLString(voucher?.value ?? 0)} />
          <DetailsField label="Status" value={voucher?.status.translation ?? ''} />
          <DetailsField label="Data do Cadastro" value={formatDateTime(voucher?.createdAt ?? '')} />
        </DetailsRow>

        <DetailsRow>
          <DetailsField label="Descrição" value={voucher?.description ?? ''} />
        </DetailsRow>

        <DetailsRow>
          <DetailsField label="Regras" value={voucher?.rules ?? ''} />
        </DetailsRow>

        <Separator />

        <DetailsRow>
          <DetailsField label="Nome do Estabelecimento" value={captalize(voucher?.partner.fantasyName ?? '')} width='w-2/3' />
          <DetailsField label="CNPJ do Estabelecimento" value={voucher?.partner.cnpj ?? ''} width='w-1/3' />
        </DetailsRow>

        <DetailsRow>
          <DetailsField label="Categoria" value={captalize(voucher?.partner?.category?.name ?? '')} />
          <DetailsField label="Cidade" value={captalize(voucher?.partner?.city?.name ?? '')} />
          <DetailsField label="Estado" value={captalize(voucher?.partner?.state?.name ?? '')} />
        </DetailsRow>
      </div>
    </DashboardLayout>
  )
}
