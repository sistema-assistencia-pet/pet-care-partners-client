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
import { applyCnpjMask, captalize, formatCurrency, formatDateTime, formatPhoneNumber } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import CurrencyInput from 'react-currency-input-field'
import DashboardLayout from '@/components/DashboardLayout'
import { DetailsField } from '@/components/DetailsField'
import { DetailsRow } from '@/components/DetailsRow'
import { Form } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { InputContainer } from '@/components/InputContainer'
import InputMask from "react-input-mask"
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { Pencil, Trash2 } from 'lucide-react'
import { sendRequest } from '@/lib/sendRequest'
import { Separator } from '@/components/ui/separator'
import { STATUS } from '@/lib/enums'
import { useToast } from '@/components/ui/use-toast'


interface IClientDetailed {
  id: string
  cnpj: string
  corporateName: string
  fantasyName: string
  segment: string
  address: string
  state: string
  city: string
  managerName: string
  managerPhoneNumber: string
  managerEmail: string
  financePhoneNumber: string
  lumpSum: string
  unitValue: string
  totalSavings: string
  contractUrl: string
  status: string
  createdAt: string
}

type CLientDetailedFromAPI = Omit<IClientDetailed, 'lumpSum' | 'unitValue' | 'totalSavings' | 'status'> & { lumpSum: number, unitValue: number, totalSavings: number, statusId: number }

const updateClientFormSchema = z.object({
  corporateName: z
    .string({ required_error: 'O campo Razão Social é obrigatório.' })
    .min(3, {  message: 'O campo Razão Social deve ter pelo menos 3 caracteres.' })
    .optional(),
  fantasyName: z
    .string({ required_error: 'O campo Nome Fantasia é obrigatório.' })
    .min(3, { message: 'O campo Nome Fantasia deve ter pelo menos 3 caracteres.' })
    .optional(),
  segment: z
    .string({ required_error: 'O campo Segmento é obrigatório.' })
    .min(3, { message: 'O campo Segmento deve ter pelo menos 3 caracteres.' })
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
    .email({ message: 'O campo E-mail do Responsável deve ser um e-mail válido.' })
    .optional(),
  financePhoneNumber: z
    .string({ required_error: 'O campo Telefone do Financeiro é obrigatório.' })
    .min(11, { message: 'O campo Telefone do Financeiro deve ter pelo menos 11 caracteres.' })
    .optional(),
  lumpSum: z.coerce
    .number({ required_error: 'O campo Valor Fixo é obrigatório.' })
    .gte(0, { message: 'O campo Valor Fixo deve ser maior ou igual a 0.' })
    .optional(),
  unitValue: z.coerce
    .number({ required_error: 'O campo Valor Unitário é obrigatório.' })
    .gte(0, { message: 'O campo Valor Unitário deve ser maior ou igual a 0.' })
    .optional(),
  contractUrl: z
    .string({ required_error: 'O campo URL do Contrato é obrigatório.' })
    .url({ message: 'O campo URL do Contrato deve ser uma URL válida.' })
    .optional()
})

type UpdateClientFormSchema = z.infer<typeof updateClientFormSchema>

const UPDATE_CLIENT_FORM_DEFAULT_VALUES = {
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

export default function ClientDetailsPage() {
  const [clientDetailed, setClientDetailed] = useState<IClientDetailed | null>(null)
  const [fileSelected, setFileSelected] = useState<File | null>(null)
  const params = useParams()
  const { push } = useRouter()
  const { toast } = useToast()

  const form = useForm<UpdateClientFormSchema>({
    mode: 'onBlur',
    defaultValues: UPDATE_CLIENT_FORM_DEFAULT_VALUES,
    resolver: zodResolver(updateClientFormSchema)
  })

  const formatClientDetailed = (client: CLientDetailedFromAPI) => ({
    ...client,
    cnpj: applyCnpjMask(client.cnpj),
    corporateName: captalize(client.corporateName),
    fantasyName: captalize(client.fantasyName),
    segment: captalize(client.segment),
    address: captalize(client.address),
    state: client.state.toLocaleUpperCase(),
    city: captalize(client.city),
    managerName: captalize(client.managerName),
    managerPhoneNumber: formatPhoneNumber(client.managerPhoneNumber),
    financePhoneNumber: formatPhoneNumber(client.financePhoneNumber),
    lumpSum: client.lumpSum === 0 ? '-' : formatCurrency(client.lumpSum),
    unitValue: client.unitValue === 0 ? '-' : formatCurrency(client.unitValue),
    totalSavings: formatCurrency(client.totalSavings),
    status: STATUS[client.statusId],
    createdAt: formatDateTime(client.createdAt)
  })

  const fillUpdateForm = (client: CLientDetailedFromAPI) => {
    form.setValue('fantasyName', client.fantasyName)
    form.setValue('corporateName', client.corporateName)
    form.setValue('segment', client.segment)
    form.setValue('contractUrl', client.contractUrl)
    form.setValue('lumpSum', client.lumpSum)
    form.setValue('unitValue', client.unitValue)
    form.setValue('managerName', client.managerName)
    form.setValue('managerEmail', client.managerEmail)
    form.setValue('managerPhoneNumber', client.managerPhoneNumber)
    form.setValue('financePhoneNumber', client.financePhoneNumber)
    form.setValue('address', client.address)
    form.setValue('state', client.state)
    form.setValue('city', client.city)
  }

  const fetchClient = async (id: string) => {
    const response = await sendRequest<{ client: CLientDetailedFromAPI }>({
      endpoint: `/client/${id}`,
      method: 'GET',
    })

    if (response.error) {
      toast({
        description: response.message,
        variant: 'destructive'
      })

      setClientDetailed(null)

      return
    }

    fillUpdateForm(response.data.client)

    const formattedClient = formatClientDetailed(response.data.client)

    setClientDetailed(formattedClient)
  }

  const formatUpdatedClientData = (clientData: UpdateClientFormSchema): UpdateClientFormSchema => ({
    ...clientData,
    managerPhoneNumber: clientData.managerPhoneNumber && clientData.managerPhoneNumber
      .replace('(', '').replace(')', '').replace('-', '').replace(' ', '').replaceAll('_', ''),
    financePhoneNumber: clientData.financePhoneNumber && clientData.financePhoneNumber
      .replace('(', '').replace(')', '').replace('-', '').replace(' ', '').replaceAll('_', ''),
  })

  const updateClient = async (client: UpdateClientFormSchema) => {
    const formattedClient = formatUpdatedClientData(client)

    const response = await sendRequest<{ client: CLientDetailedFromAPI }>({
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

    fetchClient(params.id as string)
  }

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
      endpoint: `/member/${params.id}/create-members-in-bulk`,
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

  useEffect(() => {
    if (fileSelected) {
      sendCSVToCreateMembers(fileSelected)
    }
  }, [fileSelected])

  useEffect(() => {
    if (params.id) fetchClient(params.id as string)
  } , [params.id])

  return (
    <DashboardLayout
      secondaryText={`Economia Total: ${clientDetailed?.totalSavings || ''}`}
      title={`${clientDetailed?.fantasyName || ''}`}
    >
      <div className="flex justify-between w-full">
        <div className="flex gap-4">
          <Label
            htmlFor="file-input"
            className="uppercase bg-primary text-primary-foreground shadow hover:bg-primary/90 leading-9 rounded-md px-8 cursor-pointer"
          >
            Cadastrar Associados em Lote
          </Label>
          <Input
            accept=".csv"
            disabled={clientDetailed?.status !== STATUS[1]}
            className="hidden"
            id="file-input"
            onChange={handleFileChange}
            type="file"
            multiple={false}
            placeholder='Cadastrar Associados em Lote'
          />
          <Button
            disabled={clientDetailed?.status !== STATUS[1]}
            onClick={() => push(`/painel/clientes/${params.id}/cadastrar-associado`)}
            variant="secondary"
          >
            Cadastrar Um Associado
          </Button>
        </div>

        <div className="flex gap-4">
          {
            clientDetailed?.status === STATUS[1] && (
              <AlertDialog>
                <AlertDialogTrigger className='uppercase px-8 h-9 text-sm font-medium rounded-md border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground'>Inativar</AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar inativação?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Todos os associados do cliente também serão inativados!
                    </AlertDialogDescription>
                    <AlertDialogDescription>
                      Essa ação poderá ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <Button onClick={() => inactivateClient(clientDetailed.id)}>
                      Inativar
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )
          }
          {
            clientDetailed?.status === STATUS[2] && (
              <AlertDialog>
                <AlertDialogTrigger className='uppercase px-8 h-9 rounded-md text-sm font-medium border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground'>Ativar</AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar ativação?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Todos os associados do cliente também serão ativados!
                    </AlertDialogDescription>
                    <AlertDialogDescription>
                      Essa ação poderá ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <Button onClick={() => activateClient(clientDetailed.id)}>
                      Ativar
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )
          }
          {
            clientDetailed
            && (
              <AlertDialog>
                <AlertDialogTrigger title='Editar' className='rounded-md w-9 h-9 bg-primary text-white flex flex-col justify-center'>
                  <Pencil  className='mx-auto'/>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogTitle>Editar Cliente</AlertDialogTitle>
                  <Form { ...form }>
                    <form
                      className='flex flex-col gap-4'
                      onSubmit={form.handleSubmit((data) => updateClient(data))}
                    >
                      <DetailsRow>
                        <InputContainer size="w-1/2">
                          <Label htmlFor="fantasyName">Nome Fantasia</Label>
                          <Input className="bg-white" { ...form.register("fantasyName") } />
                          {
                            form.formState.errors.fantasyName
                              && <span className="text-red-500 text-xs">{form.formState.errors.fantasyName.message}</span>
                          }
                        </InputContainer>
                        <InputContainer size="w-1/2">
                          <Label htmlFor="corporateName">Razão Social</Label>
                          <Input className="bg-white" { ...form.register("corporateName") } />
                          {
                            form.formState.errors.corporateName
                              && <span className="text-red-500 text-xs">{form.formState.errors.corporateName.message}</span>
                          }
                        </InputContainer>
                      </DetailsRow>

                      <DetailsRow>
                        <InputContainer size="w-1/2">
                          <Label htmlFor="segment">Segmento</Label>
                          <Input className="bg-white" { ...form.register("segment") } />
                          {
                            form.formState.errors.segment
                              && <span className="text-red-500 text-xs">{form.formState.errors.segment.message}</span>
                          }
                        </InputContainer>
                        <InputContainer size="w-1/2">
                          <Label htmlFor="contractUrl">URL do Contrato</Label>
                          <Input className="bg-white" { ...form.register("contractUrl") } />
                          {
                            form.formState.errors.contractUrl
                              && <span className="text-red-500 text-xs">{form.formState.errors.contractUrl.message}</span>
                          }
                        </InputContainer>
                      </DetailsRow>

                      <DetailsRow>
                        <InputContainer size="w-1/2">
                          <Label htmlFor="lumpSum">Valor Fixo</Label>
                          <CurrencyInput
                            { ...form.register("lumpSum") }
                            className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            allowNegativeValue={false}
                            fixedDecimalLength={2}
                            disableGroupSeparators={true}
                            placeholder="00.00"
                          />
                          {
                            form.formState.errors.lumpSum
                              && <span className="text-red-500 text-xs">{form.formState.errors.lumpSum.message}</span>
                          }
                        </InputContainer>
                        <InputContainer size="w-1/2">
                          <Label htmlFor="unitValue">Valor Unitário</Label>
                          <CurrencyInput
                            { ...form.register("unitValue") }
                            className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            allowNegativeValue={false}
                            fixedDecimalLength={2}
                            disableGroupSeparators={true}
                            placeholder="00.00"
                          />
                          {
                            form.formState.errors.unitValue
                              && <span className="text-red-500 text-xs">{form.formState.errors.unitValue.message}</span>
                          }
                        </InputContainer>
                      </DetailsRow>

                      <DetailsRow>
                        <InputContainer size="w-1/2">
                          <Label htmlFor="managerName">Nome do Responsável</Label>
                          <Input className="bg-white" { ...form.register("managerName") } />
                          {
                            form.formState.errors.managerName
                              && <span className="text-red-500 text-xs">{form.formState.errors.managerName.message}</span>
                          }
                        </InputContainer>
                        <InputContainer size="w-1/2">
                          <Label htmlFor="managerEmail">E-mail do Responsável</Label>
                          <Input className="bg-white" { ...form.register("managerEmail") } />
                          {
                            form.formState.errors.managerEmail
                              && <span className="text-red-500 text-xs">{form.formState.errors.managerEmail.message}</span>
                          }
                        </InputContainer>
                      </DetailsRow>

                      <DetailsRow>
                        <InputContainer size="w-1/2">
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
                        <InputContainer size="w-1/2">
                          <Label htmlFor="financePhoneNumber">Telefone do Financeiro</Label>
                          <InputMask
                            className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            mask="(99) 99999-9999"
                            { ...form.register("financePhoneNumber",) }
                          />
                          {
                            form.formState.errors.financePhoneNumber
                              && <span className="text-red-500 text-xs">{form.formState.errors.financePhoneNumber.message}</span>
                          }
                        </InputContainer>
                      </DetailsRow>

                      <DetailsRow>
                        <InputContainer size="w-full">
                          <Label htmlFor="address">Endereço</Label>
                          <Input className="bg-white" { ...form.register("address") } />
                          {
                            form.formState.errors.address
                              && <span className="text-red-500 text-xs">{form.formState.errors.address.message}</span>
                          }
                        </InputContainer>
                      </DetailsRow>

                      <DetailsRow>
                        <InputContainer size="w-1/2">
                          <Label htmlFor="city">Cidade</Label>
                          <Input className="bg-white" { ...form.register("city") } />
                          {
                            form.formState.errors.city
                              && <span className="text-red-500 text-xs">{form.formState.errors.city.message}</span>
                          }
                        </InputContainer>
                        <InputContainer size="w-1/2">
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
            clientDetailed
            && [STATUS[1], STATUS[2]].includes(clientDetailed.status as string)
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
                    <Button variant="destructive" onClick={() => deleteClient(clientDetailed.id)}>
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
          <DetailsField label="Nome Fantasia" value={clientDetailed?.fantasyName} />
          <DetailsField label="Razão Social" value={clientDetailed?.corporateName} />
          <DetailsField label="CNPJ" value={clientDetailed?.cnpj} />
        </DetailsRow>

        <DetailsRow>
          <DetailsField label="Segmento" value={clientDetailed?.segment} />
          <DetailsField label="Status" value={clientDetailed?.status} />
          <DetailsField label="Data do Cadastro" value={clientDetailed?.createdAt} />
        </DetailsRow>

        <DetailsRow>
          <DetailsField label="Valor Fixo" value={clientDetailed?.lumpSum} width="min-w-52 w-full" />
          <DetailsField label="Valor Unitário" value={clientDetailed?.unitValue} width="min-w-52 w-full" />
          <DetailsField label="URL do Contrato">
            <Link
              className="text-primary font-semibold"
              href={clientDetailed?.contractUrl || ''}
              rel="noreferrer noopener"
              referrerPolicy="no-referrer"
              target="_blank"
            >
              {clientDetailed?.contractUrl}
            </Link>
          </DetailsField>
        </DetailsRow>

        <Separator />

        <DetailsRow>
          <DetailsField label="Nome do Responsável" value={clientDetailed?.managerName} />
          <DetailsField label="E-mail do Responsável" value={clientDetailed?.managerEmail} />
        </DetailsRow>

        <DetailsRow>
          <DetailsField label="Telefone do Responável" value={clientDetailed?.managerPhoneNumber} width="min-w-52 w-full" />
          <DetailsField label="Telefone do Financeiro" value={clientDetailed?.financePhoneNumber} width="min-w-52 w-full" />
        </DetailsRow>

        <Separator />

        <DetailsRow>
          <DetailsField label="Endereço" value={clientDetailed?.address} />
          <DetailsField label="Cidade" value={clientDetailed?.city} width="min-w-60" />
          <DetailsField label="Estado" value={clientDetailed?.state} width="min-w-28" />
        </DetailsRow>
      </div>
    </DashboardLayout>
  )
}
