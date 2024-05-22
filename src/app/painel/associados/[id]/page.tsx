'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useParams, useRouter } from 'next/navigation'
import { v4 as uuid } from 'uuid'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from '@/components/ui/button'
import DashboardLayout from '@/components/DashboardLayout'
import { applyCepMask, applyCnpjMask, applyCpfMask, captalize, formatCurrency, formatBirthdate, formatDateTime, formatPhoneNumber } from '@/lib/utils'
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
import { STATUS } from '@/lib/enums'
import { useToast } from '@/components/ui/use-toast'

// interface IItem {
//   id: string
//   orderId: string
//   medicineName: string
//   medicineType: string
//   quantity: number
//   listPrice: string
//   discountPrice: string
//   createdAt: string
//   updatedAt: string
// }

// interface IOrder {
//   id: string
//   memberId: string
//   clientId: string
//   totalValue: string
//   totalSavings: string
//   isRecurring: false,
//   status: string
//   createdAt: string
//   updatedAt: string
//   items: IItem[]
// }

interface IMemberDetailed {
  id: string
  clientId: string
  client: {
    cnpj: string
    fantasyName: string
  }
  cpf: string
  name: string
  phoneNumber: string
  email: string
  birthDate: string
  cep: string
  totalSavings: string
  status: string
  createdAt: string
  // orders: IOrder[]
}

// type ItemFromAPI = Omit<
// IItem, 'listPrice' | 'discountPrice'
// > & {
// listPrice: number
// discountPrice: number
// }

// type OrderFromAPI = Omit<
// IOrder, 'totalValue' | 'totalSavings' | 'items' | 'status'
// > & {
// items: ItemFromAPI[]
// totalSavings: number
// totalValue: number
// statusId: number
// }

type MemberDetailedFromAPI = Omit<
  IMemberDetailed, 'totalSavings' | 'status' | 'orders'
> & {
  // orders: OrderFromAPI[]
  statusId: number
  totalSavings: number,
}

const updateMemberFormSchema = z.object({
  name: z
    .string({ required_error: 'O campo Nome é obrigatório.' })
    .min(3, {  message: 'O campo Nome deve ter pelo menos 3 caracteres.' })
    .optional(),
  email: z
    .string({ required_error: 'O campo E-mail é obrigatório.' })
    .email({ message: 'O campo E-mail deve ser um e-mail válido.' })
    .optional(),
  phoneNumber: z
    .string({ required_error: 'O campo Telefone é obrigatório.' })
    .min(11, { message: 'O campo Telefone deve ter pelo menos 11 caracteres.' })
    .optional(),
  birthDate: z
    .string({ required_error: 'O campo Data de Nascimento é obrigatório.' })
    .length(10, { message: 'O campo Data de Nascimento deve ter pelo menos 10 caracteres.' })
    .optional(),
  cep: z
    .string({ required_error: 'O campo CEP é obrigatório.' })
    .length(9, { message: 'O campo CEP deve ter pelo menos 9 caracteres.' })
    .optional()
})

type UpdateMemberFormSchema = z.infer<typeof updateMemberFormSchema>

const UPDATE_MEMBER_FORM_DEFAULT_VALUES: UpdateMemberFormSchema = {
  name: '',
  email: '',
  phoneNumber: '',
  birthDate: '',
  cep: ''
}

export default function MemberDetailsPage() {
  const [memberDetailed, setMemberDetailed] = useState<IMemberDetailed | null>(null)
  const params = useParams()
  const { push } = useRouter()
  const { toast } = useToast()

  const form = useForm<UpdateMemberFormSchema>({
    mode: 'onBlur',
    defaultValues: UPDATE_MEMBER_FORM_DEFAULT_VALUES,
    resolver: zodResolver(updateMemberFormSchema)
  })

  const formatMemberDetailed = (member: MemberDetailedFromAPI) => ({
    ...member,
    client: {
      cnpj: applyCnpjMask(member.client.cnpj),
      fantasyName: captalize(member.client.fantasyName),
    },
    cpf: applyCpfMask(member.cpf),
    name: captalize(member.name),
    phoneNumber: formatPhoneNumber(member.phoneNumber),
    birthDate: formatBirthdate(member.birthDate),
    cep: applyCepMask(member.cep),
    totalSavings: formatCurrency(member.totalSavings),
    status: STATUS[member.statusId],
    createdAt: formatDateTime(member.createdAt)
    // orders: member.orders.map((order) => ({
    //   ...order,
    //   totalValue: formatCurrency(order.totalValue),
    //   totalSavings: formatCurrency(order.totalSavings),
    //   status: STATUS[order.statusId],
    //   createdAt: formatDateTime(order.createdAt),
    //   updatedAt: formatDateTime(order.updatedAt),
    //   items: order.items.map((item) => ({
    //     ...item,
    //     listPrice: formatCurrency(item.listPrice),
    //     discountPrice: formatCurrency(item.discountPrice),
    //     createdAt: formatDateTime(item.createdAt),
    //     updatedAt: formatDateTime(item.updatedAt),
    //     medicineName: captalize(item.medicineName),
    //     medicineType: captalize(item.medicineType)
    //   }))
    // }))
  })

  const fillUpdateForm = (member: MemberDetailedFromAPI) => {
    form.setValue('name', member.name)
    form.setValue('email', member.email)
    form.setValue('phoneNumber', formatPhoneNumber(member.phoneNumber))
    form.setValue('birthDate', formatBirthdate(member.birthDate))
    form.setValue('cep', applyCepMask(member.cep))
  }

  const fetchMember = async (id: string) => {
    const response = await sendRequest<{ member: MemberDetailedFromAPI }>({
      endpoint: `/member/${id}`,
      method: 'GET',
    })

    if (response.error) {
      toast({
        description: response.message,
        variant: 'destructive'
      })

      setMemberDetailed(null)

      return
    }

    fillUpdateForm(response.data.member)

    const formattedMember = formatMemberDetailed(response.data.member)

    setMemberDetailed(formattedMember)
  }

  const formatUpdatedMemberData = (memberData: UpdateMemberFormSchema): UpdateMemberFormSchema => ({
    ...memberData,
    birthDate: memberData.birthDate && memberData.birthDate.split('/').reverse().join('-').replaceAll('_', ''),
    cep: memberData.cep && memberData.cep.replace('-', '').replaceAll('_', ''),
    phoneNumber: memberData.phoneNumber && memberData.phoneNumber
      .replace('(', '').replace(')', '').replace('-', '').replace(' ', '').replaceAll('_', '')
  })

  const updateMember = async (member: UpdateMemberFormSchema) => {
    const formattedMember = formatUpdatedMemberData(member)

    const response = await sendRequest<{ member: MemberDetailedFromAPI }>({
      endpoint: `/member/${params.id}`,
      method: 'PATCH',
      data: formattedMember,
    })

    if (response.error) {
      toast({
        description: response.message,
        variant: 'destructive'
      })

      return
    }

    fetchMember(params.id as string)
  }

  const activateMember = async (id: string) => {
    const response = await sendRequest({
      endpoint: `/member/${id}/activate`,
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

    fetchMember(id)
  }

  const inactivateMember = async (id: string) => {
    const response = await sendRequest({
      endpoint: `/member/${id}/inactivate`,
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

    fetchMember(id)
  }

  const deleteMember = async (id: string) => {
    const response = await sendRequest({
      endpoint: `/member/${id}/delete`,
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

    fetchMember(id)
  }

  // const activateOrder = async (id: string, memberId: string) => {
  //   const response = await sendRequest({
  //     endpoint: `/order/${id}/activate`,
  //     method: 'PATCH',
  //   })

  //   if (response.error) {
  //     toast({
  //       description: response.message,
  //       variant: 'destructive'
  //     })

  //     return
  //   }

  //   toast({
  //     description: response.message,
  //     variant: "success"
  //   })

  //   fetchMember(memberId)
  // }

  // const inactivateOrder = async (id: string, memberId: string) => {
  //   const response = await sendRequest({
  //     endpoint: `/order/${id}/inactivate`,
  //     method: 'PATCH',
  //   })

  //   if (response.error) {
  //     toast({
  //       description: response.message,
  //       variant: 'destructive'
  //     })

  //     return
  //   }

  //   toast({
  //     description: response.message,
  //     variant: "success"
  //   })

  //   fetchMember(memberId)
  // }

  useEffect(() => {
    if (params.id) fetchMember(params.id as string)
  } , [params.id])

  return (
    <DashboardLayout
      // secondaryText={`Economia Total: ${memberDetailed?.totalSavings || ''}`}
      title={`${memberDetailed?.name || ''}`}
    >
      <div className="flex justify-between w-full">
        {/* <Button
          disabled={memberDetailed?.status !== STATUS[1]}
          onClick={() => {push(`/painel/associados/${params.id as string}/cadastrar-pedido`)}}
        >
          Cadastrar Pedido
        </Button> */}

        <div />

        <div className="flex gap-4">
          {
            memberDetailed?.status === STATUS[1] && (
              <AlertDialog>
                <AlertDialogTrigger className='uppercase text-sm font-medium px-8 h-9 rounded-md border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground'>Inativar</AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar inativação?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Essa ação poderá ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <Button onClick={() => inactivateMember(memberDetailed.id)}>
                      Inativar
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )
          }
          {
            memberDetailed?.status === STATUS[2] && (
              <AlertDialog>
                <AlertDialogTrigger className='uppercase px-8 h-9 text-sm font-medium rounded-md border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground'>Ativar</AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar ativação?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Essa ação poderá ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <Button onClick={() => activateMember(memberDetailed.id)}>
                      Ativar
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )
          }
          {
            memberDetailed
            && (
              <AlertDialog>
                <AlertDialogTrigger title='Editar' className='rounded-md w-9 h-9 bg-primary text-white flex flex-col justify-center'>
                  <Pencil  className='mx-auto'/>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogTitle>Editar Associado</AlertDialogTitle>
                  <AlertDialogDescription>
                  <Form { ...form }>
                    <form
                      className='flex flex-col gap-4'
                      onSubmit={form.handleSubmit((data) => updateMember(data))}
                    >
                      <DetailsRow>
                        <InputContainer size="w-2/3">
                          <Label htmlFor="name">Nome</Label>
                          <Input className="bg-white" { ...form.register("name") } />
                          {
                            form.formState.errors.name
                              && <span className="text-red-500 text-xs">{form.formState.errors.name.message}</span>
                          }
                        </InputContainer>
                        <InputContainer size="w-1/3">
                          <Label htmlFor="birthDate">Data de Nascimento</Label>
                          <InputMask
                            className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            mask="99/99/9999"
                            { ...form.register("birthDate",) }
                          />
                          {
                            form.formState.errors.birthDate
                              && <span className="text-red-500 text-xs">{form.formState.errors.birthDate.message}</span>
                          }
                        </InputContainer>
                      </DetailsRow>

                      <DetailsRow>
                        <InputContainer size="w-1/3">
                          <Label htmlFor="email">E-mail</Label>
                          <Input className="bg-white" { ...form.register("email") } />
                          {
                            form.formState.errors.email
                              && <span className="text-red-500 text-xs">{form.formState.errors.email.message}</span>
                          }
                        </InputContainer>
                        <InputContainer size="w-1/3">
                          <Label htmlFor="phoneNumber">Telefone</Label>
                          <InputMask
                            className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            mask="(99) 99999-9999"
                            { ...form.register("phoneNumber",) }
                          />
                          {
                            form.formState.errors.phoneNumber
                              && <span className="text-red-500 text-xs">{form.formState.errors.phoneNumber.message}</span>
                          }
                        </InputContainer>
                        <InputContainer size="w-1/3">
                          <Label htmlFor="cep">CEP</Label>
                          <InputMask
                            className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            mask="99999-999"
                            { ...form.register("cep",) }
                          />
                          {
                            form.formState.errors.cep
                              && <span className="text-red-500 text-xs">{form.formState.errors.cep.message}</span>
                          }
                        </InputContainer>
                      </DetailsRow>
                      <AlertDialogFooter>
                        <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
                        <Button type="submit" disabled={!form.formState.isValid}>
                          Confirmar
                        </Button>
                      </AlertDialogFooter>
                    </form>
                  </Form>
                  </AlertDialogDescription>
                </AlertDialogContent>
              </AlertDialog>
            )
          }
          {
            memberDetailed
            && [STATUS[1], STATUS[2]].includes(memberDetailed.status as string)
            && (
              <AlertDialog>
                <AlertDialogTrigger title='Excluir' className='rounded-md w-9 h-9 bg-destructive text-white flex flex-col justify-center'>
                  <Trash2  className='mx-auto'/>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar exclusão?</AlertDialogTitle>
                    <AlertDialogDescription>
                      A operação <strong className='text-black'>não</strong> poderá ser desfeita!
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <Button variant="destructive" onClick={() => deleteMember(memberDetailed.id)}>
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
          <DetailsField label="Nome" value={memberDetailed?.name} />
          <DetailsField label="CPF" value={memberDetailed?.cpf} width="min-w-60" />
        </DetailsRow>

        <DetailsRow>
          <DetailsField label="Nome do Cliente" value={memberDetailed?.client.fantasyName} />
          <DetailsField label="CNPJ do Cliente" value={memberDetailed?.client.cnpj} width="min-w-60" />
        </DetailsRow>

        <DetailsRow>
          {/* <DetailsField label="Economia Total" value={memberDetailed?.totalSavings} /> */}
          <DetailsField label="Data de Nascimento" value={memberDetailed?.birthDate} />
          <DetailsField label="Status" value={memberDetailed?.status} />
          <DetailsField label="Data do Cadastro" value={memberDetailed?.createdAt} />
        </DetailsRow>

        <Separator />

        <DetailsRow>
          <DetailsField label="E-mail" value={memberDetailed?.email} />
          <DetailsField label="Telefone" value={memberDetailed?.phoneNumber} />
          <DetailsField label="CEP" value={memberDetailed?.cep} />
        </DetailsRow>

        {/* <Separator /> */}

        {/* <Accordion className="rounded-md border bg-background" type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger className="font-semibold">Histórico de Pedidos</AccordionTrigger>
            {
              memberDetailed?.orders.map((order) => (
                <AccordionContent key={uuid()}>
                  <div className='bg-white border rounded-md flex p-4 flex-col gap-4'>
                    <div className="flex justify-between w-full">
                        <h3 className='font-semibold'>{`Data do pedido: ${order.createdAt}`}</h3>

                      <div className="flex gap-4">
                        {
                          order?.status === STATUS[1] && (
                            <AlertDialog>
                              <AlertDialogTrigger className='uppercase px-8 h-9 text-sm font-medium rounded-md border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground'>Inativar</AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar inativação?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Essa ação poderá ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <Button onClick={() => inactivateOrder(order.id, memberDetailed.id)}>
                                    Inativar
                                  </Button>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )
                        }
                        {
                          order?.status === STATUS[2] && (
                            <AlertDialog>
                              <AlertDialogTrigger className='uppercase px-8 h-9 text-sm font-medium rounded-md border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground'>Ativar</AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar ativação?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Essa ação poderá ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <Button onClick={() => activateOrder(order.id, memberDetailed.id)}>
                                    Ativar
                                  </Button>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )
                        }
                      </div>
                    </div>

                    <DetailsRow>
                      <DetailsField label="Valor Total" value={order.totalValue} />
                      <DetailsField label="Economia Total" value={order?.totalSavings} />
                      <DetailsField label="Recorrente" value={order.isRecurring ? 'Sim' : 'Não'} />
                      <DetailsField label="Status" value={order.status} />
                    </DetailsRow>
                    <Accordion className="rounded-md border bg-background" type="single" collapsible>
                      <AccordionItem value="item-1">
                        <AccordionTrigger className="font-semibold">Lista de Medicamentos</AccordionTrigger>
                        {
                          order.items.map((item) => (
                            <AccordionContent key={uuid()}>
                              <div className='bg-white border rounded-md flex p-4 flex-col gap-4'>

                                <DetailsRow>
                                  <DetailsField label="Nome do Medicamento" value={item.medicineName} />
                                  <DetailsField label="Tipo de Medicamento" value={item.medicineType} />
                                </DetailsRow>

                                <DetailsRow>
                                  <DetailsField label="Valor Unitário de Tabela" value={item.listPrice} />
                                  <DetailsField label="Valor com Desconto" value={item?.discountPrice} />
                                  <DetailsField label="Quantidade" value={item.quantity} />
                                </DetailsRow>
                              </div>
                            </AccordionContent>
                          ))}
                      </AccordionItem>
                    </Accordion>
                  </div>
                </AccordionContent>
              ))}
          </AccordionItem>
        </Accordion> */}
      </div>
    </DashboardLayout>
  )
}
