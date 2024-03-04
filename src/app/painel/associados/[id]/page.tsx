'use client'

import { useEffect, useState } from 'react'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
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
import { sendRequest } from '@/lib/sendRequest'
import { STATUS } from '@/lib/enums'
import { useToast } from '@/components/ui/use-toast'
import { useParams, useRouter } from 'next/navigation'
import { applyCepMask, applyCnpjMask, applyCpfMask, captalize, formatCurrency, formatDate, formatDateTime, formatPhoneNumber } from '@/lib/utils'
import { DetailsField, DetailsRow } from '@/components/DetailsField'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { v4 as uuid } from 'uuid'

interface IItem {
  id: string
  orderId: string
  medicineName: string
  medicineType: string
  quantity: number
  listPrice: string
  discountPrice: string
  createdAt: string
  updatedAt: string
}

interface IOrder {
  id: string
  memberId: string
  clientId: string
  totalValue: string
  totalSavings: string
  isRecurring: false,
  status: string
  createdAt: string
  updatedAt: string
  items: IItem[]
}

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
  orders: IOrder[]
}

type ItemFromAPI = Omit<
IItem, 'listPrice' | 'discountPrice'
> & {
listPrice: number
discountPrice: number
}

type OrderFromAPI = Omit<
IOrder, 'totalValue' | 'totalSavings' | 'items' | 'status'
> & {
items: ItemFromAPI[]
totalSavings: number
totalValue: number
statusId: number
}

type MemberDetailedFromAPI = Omit<
  IMemberDetailed, 'totalSavings' | 'status' | 'orders'
> & {
  orders: OrderFromAPI[]
  statusId: number
  totalSavings: number,
}

export default function MemberDetailsPage() {
  const [memberDetailed, setMemberDetailed] = useState<IMemberDetailed | null>(null)
  const params = useParams()
  const { push } = useRouter()
  const { toast } = useToast()

  const formatMemberDetailed = (member: MemberDetailedFromAPI) => ({
    ...member,
    client: {
      cnpj: applyCnpjMask(member.client.cnpj),
      fantasyName: captalize(member.client.fantasyName),
    },
    cpf: applyCpfMask(member.cpf),
    name: captalize(member.name),
    phoneNumber: formatPhoneNumber(member.phoneNumber),
    birthDate: formatDate(member.birthDate),
    cep: applyCepMask(member.cep),
    totalSavings: formatCurrency(member.totalSavings),
    status: STATUS[member.statusId],
    createdAt: formatDateTime(member.createdAt),
    orders: member.orders.map((order) => ({
      ...order,
      totalValue: formatCurrency(order.totalValue),
      totalSavings: formatCurrency(order.totalSavings),
      status: STATUS[order.statusId],
      createdAt: formatDateTime(order.createdAt),
      updatedAt: formatDateTime(order.updatedAt),
      items: order.items.map((item) => ({
        ...item,
        listPrice: formatCurrency(item.listPrice),
        discountPrice: formatCurrency(item.discountPrice),
        createdAt: formatDateTime(item.createdAt),
        updatedAt: formatDateTime(item.updatedAt),
        medicineName: captalize(item.medicineName),
        medicineType: captalize(item.medicineType)
      }))
    }))
  })

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

    const formattedMember = formatMemberDetailed(response.data.member)

    console.log(formattedMember)

    setMemberDetailed(formattedMember)
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

  const activateOrder = async (id: string, memberId: string) => {
    const response = await sendRequest({
      endpoint: `/order/${id}/activate`,
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

    fetchMember(memberId)
  }

  const inactivateOrder = async (id: string, memberId: string) => {
    const response = await sendRequest({
      endpoint: `/order/${id}/inactivate`,
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

    fetchMember(memberId)
  }

  useEffect(() => {
    if (params.id) fetchMember(params.id as string)
  } , [params.id])

  return (
    <DashboardLayout
      secondaryText={`Economia Total: ${memberDetailed?.totalSavings || ''}`}
      title={`${memberDetailed?.name || ''}`}
    >
      <div className="flex justify-between w-full">
        <Button onClick={() => {}}>
          Cadastrar Pedido
        </Button>

        <div className="flex gap-4">
          {
            memberDetailed?.status === STATUS[1] && (
              <AlertDialog>
                <AlertDialogTrigger className='px-8 h-9 rounded-md border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground'>Inativar</AlertDialogTrigger>
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
                <AlertDialogTrigger className='px-8 h-9 rounded-md border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground'>Ativar</AlertDialogTrigger>
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
            && [STATUS[1], STATUS[2]].includes(memberDetailed.status as string)
            && (
              <AlertDialog>
                <AlertDialogTrigger className='rounded-md px-8 h-9 bg-destructive text-white'>Excluir</AlertDialogTrigger>
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
          <DetailsField label="Data de Nascimento" value={memberDetailed?.birthDate} />
          <DetailsField label="Nome do Cliente" value={memberDetailed?.client.fantasyName} />
          <DetailsField label="CNPJ do Cliente" value={memberDetailed?.client.cnpj} />
        </DetailsRow>

        <DetailsRow>
          <DetailsField label="Economia Total" value={memberDetailed?.totalSavings} />
          <DetailsField label="Status" value={memberDetailed?.status} />
          <DetailsField label="Data do Cadastro" value={memberDetailed?.createdAt} />
        </DetailsRow>

        <Separator />

        <DetailsRow>
          <DetailsField label="E-mail" value={memberDetailed?.email} />
          <DetailsField label="Telefone" value={memberDetailed?.phoneNumber} />
          <DetailsField label="CEP" value={memberDetailed?.cep} />
        </DetailsRow>

        <Separator />

        <Accordion className="rounded-md border bg-background" type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger className="font-semibold">Histórico de Pedidos</AccordionTrigger>
            {
              memberDetailed?.orders.map((order) => (
                <AccordionContent key={uuid()}>
                  <div className='bg-white border rounded-md flex p-4 flex-col gap-4'>
                    <div className="flex justify-between w-full">
                      {/* <div> */}
                        <h3 className='font-semibold'>{`Data do pedido: ${order.createdAt}`}</h3>
                      {/* </div> */}

                      <div className="flex gap-4">
                        {
                          order?.status === STATUS[1] && (
                            <AlertDialog>
                              <AlertDialogTrigger className='px-8 h-9 rounded-md border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground'>Inativar</AlertDialogTrigger>
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
                              <AlertDialogTrigger className='px-8 h-9 rounded-md border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground'>Ativar</AlertDialogTrigger>
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
                                  <DetailsField label="Valor de Tabela" value={item.listPrice} />
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
        </Accordion>
      </div>
    </DashboardLayout>
  )
}
