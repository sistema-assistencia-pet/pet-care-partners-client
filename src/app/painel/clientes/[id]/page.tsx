'use client'

import { useEffect, useState } from 'react'

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
import { applyCnpjMask, captalize, formatCurrency, formatDateTime, formatPhoneNumber } from '@/lib/utils'
import { DetailsField, DetailsRow } from '@/components/DetailsField'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'

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

export default function ClientDetailsPage() {
  const [clientDetailed, setClientDetailed] = useState<IClientDetailed | null>(null)
  const params = useParams()
  const { push } = useRouter()
  const { toast } = useToast()

  const formatClientDetailed = (client: CLientDetailedFromAPI) => ({
    ...client,
    cnpj: applyCnpjMask(client.cnpj),
    corporateName: captalize(client.corporateName),
    fantasyName: captalize(client.fantasyName),
    segment: captalize(client.segment),
    address: captalize(client.address),
    state: client.state.toLocaleUpperCase(),
    city: captalize(client.fantasyName),
    managerName: captalize(client.fantasyName),
    managerPhoneNumber: formatPhoneNumber(client.managerPhoneNumber),
    financePhoneNumber: formatPhoneNumber(client.financePhoneNumber),
    lumpSum: client.lumpSum === 0 ? '-' : formatCurrency(client.lumpSum),
    unitValue: client.unitValue === 0 ? '-' : formatCurrency(client.unitValue),
    totalSavings: formatCurrency(client.totalSavings),
    status: STATUS[client.statusId],
    createdAt: formatDateTime(client.createdAt)
  })

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

    const formattedClient = formatClientDetailed(response.data.client)

    setClientDetailed(formattedClient)
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
          <Button onClick={() => {}} disabled={clientDetailed?.status !== STATUS[1]}>
            Cadastrar Associados em Lote
          </Button>
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
                <AlertDialogTrigger className='px-8 h-9 rounded-md border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground'>Inativar</AlertDialogTrigger>
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
                <AlertDialogTrigger className='px-8 h-9 rounded-md border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground'>Ativar</AlertDialogTrigger>
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
            && [STATUS[1], STATUS[2]].includes(clientDetailed.status as string)
            && (
              <AlertDialog>
                <AlertDialogTrigger className='rounded-md px-8 h-9 bg-destructive text-white'>Excluir</AlertDialogTrigger>
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
