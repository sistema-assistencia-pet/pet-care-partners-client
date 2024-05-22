'use client'

import { FieldValues, useForm } from 'react-hook-form'
import { type ColumnDef } from "@tanstack/react-table"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { applyCnpjMask, captalize, formatCurrency, formatDateTime, removeCnpjMask } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import DashboardLayout from '@/components/DashboardLayout'
import { DataTable } from '../../../components/DataTable'
import { Eye, FilterX } from 'lucide-react'
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { sendRequest } from '@/lib/sendRequest'
import { STATUS } from '@/lib/enums'
import { useToast } from '@/components/ui/use-toast'

interface IClient {
  id: string
  cnpj: string
  fantasyName: string
  segment: string
  status: string
  createdAt: string
}

interface IFormValues {
  cnpj: string
  fantasyName: string
  statusId: string
}

const PAGINATION_LIMIT = 10
const FORM_FILTER_DEFAULT_VALUES: IFormValues = {
  cnpj: '',
  fantasyName: '',
  statusId: '1'
}

export default function ClientsPage() {
  const [clients, setClients] = useState<IClient[]>([])
  const [clientsCount, setClientsCount] = useState<number>(0)
  // const [systemTotalSavings, setSystemTotalSavings] = useState<string>(formatCurrency(0))
  const [skip, setSkip] = useState<number>(0)
  const [page, setPage] = useState<number>(1)
  const [query, setQuery] = useState<URLSearchParams | null>(null)

  const form = useForm<IFormValues>({
    mode: 'onSubmit',
    defaultValues: FORM_FILTER_DEFAULT_VALUES
  })
  const { push } = useRouter()
  const { toast } = useToast()

  const columns: ColumnDef<IClient>[] = [
    {
      header: `CNPJ`,
      accessorKey: `cnpj`,
    },
    {
      header: `Nome Fantasia`,
      accessorKey: `fantasyName`
    },
    {
      header: `Segmento`,
      accessorKey: `segment`
    },
    {
      header: `Status`,
      accessorKey: `status`
    },
    {
      header: `Criado em`,
      accessorKey: `createdAt`
    },
    {
      header: `Ações`,
      accessorKey: `id`,
      cell: ({ row: { original: { id } } }) => (
        <Button
          className=''
          onClick={() => push(`/painel/clientes/${id}`)}
          size="icon"
          title="Visualizar Detalhes"
          variant="outline"
        >
          <Eye />
        </Button>
      )
    }
  ]

  const handleNextPagination = () => {
    setSkip((prev) => prev + PAGINATION_LIMIT)
    setPage((prev) => prev + 1)
  }

  const handlePreviousPagination = () => {
    setSkip((prev) => prev - PAGINATION_LIMIT)
    setPage((prev) => prev - 1)
  }

  const handleResetPagination = () => {
    setSkip(0)
    setPage(1)
  }

  const submitFilter = async (data: FieldValues) => {
    const { cnpj, fantasyName, statusId } = data
    const query = new URLSearchParams()

    const cnpjWithoutMask = removeCnpjMask(cnpj)

    if (cnpj) query.append('cnpj', cnpjWithoutMask)
    if (fantasyName) query.append('fantasy-name', fantasyName)
    if (statusId) query.append('status-id', statusId)

    setQuery(query)
    await fetchClients(query)
  }

  const resetFilter = () => {
    form.reset(FORM_FILTER_DEFAULT_VALUES)

    setSkip(0)
    setPage(1)

    fetchClients()
  }

  const formatClient = (client: { statusId: number } & Omit<IClient, 'status'>) => ({
    ...client,
    cnpj: applyCnpjMask(client.cnpj),
    fantasyName: captalize(client.fantasyName),
    segment: captalize(client.segment),
    createdAt: formatDateTime(client.createdAt),
    status: STATUS[client.statusId],
  })

  const fetchClients = async (query?: URLSearchParams) => {
    const response = await sendRequest<
      { clients: Array<Omit<IClient, 'status'> & { statusId: number }>, systemTotalSavings: number }
    >({
      endpoint: `/client?take=${PAGINATION_LIMIT}&skip=${skip}${query ? `&${query.toString()}` : '&status-id=1'}`,
      method: 'GET',
    })

    if (response.error) {
      toast({
        description: response.message,
        variant: 'destructive'
      })

      setClients([])
      setClientsCount(0)
      // setSystemTotalSavings(formatCurrency(0))

      return
    }

    const formattedClients = response.data.clients.map((client) => formatClient(client))

    setClients(formattedClients)
    setClientsCount(parseInt(response.headers[`x-total-count`]))
    // setSystemTotalSavings(formatCurrency(response.data.systemTotalSavings))
  }

  // Carrega lista de clientes
  useEffect(() => {
    if (query) {
      fetchClients(query)
    } else fetchClients()
  }, [skip])

  return (
    <DashboardLayout
      secondaryText={`Total: ${clientsCount} clientes`}
      // systemTotalSavingsText={`Economia total do sistema: ${systemTotalSavings}`}
      title="Clientes"
    >
      <Form { ...form }>
        <form
          className='flex flex-row gap-4'
          onSubmit={form.handleSubmit((data) => submitFilter(data))}
        >
          <Button type="button" onClick={() => push('/painel/clientes/cadastrar-cliente')}>Cadastrar cliente</Button>
          <div className="flex flex-col grow space-y-1.5 bg-white">
            <Input { ...form.register("cnpj") } placeholder="CNPJ" type="text" />
          </div>
          <div className="flex flex-col grow space-y-1.5 bg-white">
            <Input { ...form.register("fantasyName") } placeholder="Nome Fantasia" type="text" />
          </div>
          <div className="flex flex-col space-y-1.5 bg-white">
          <FormField
            control={form.control}
            name="statusId"
            render={({ field }) => (
              <FormItem>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-28">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1">{STATUS[1]}</SelectItem>
                    <SelectItem value="2">{STATUS[2]}</SelectItem>
                    <SelectItem value="3">{STATUS[3]}</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          </div>
          <Button className="w-28" type='submit'>
            Filtrar
          </Button>
          <Button
            className="min-w-9 h-9 p-0"
            onClick={resetFilter}
            title="Limpar filtros"
            type='button'
            variant="outline"
          >
            <FilterX className="w-5 h-5"/>
          </Button>
        </form>
      </Form>

      <DataTable columns={columns} data={clients} />

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationLink
              disabled={page <= 1}
              onClick={handleResetPagination}
              size="default"
              type="button"
            >
              Primeira
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationPrevious
              disabled={page <= 1}
              onClick={handlePreviousPagination}
              type="button"
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink
              size="default"
              className='cursor-default hover:bg-background'
            >
              {`${page} de ${Math.ceil(clientsCount/PAGINATION_LIMIT)}`}
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              disabled={clientsCount <= page * PAGINATION_LIMIT}
              onClick={handleNextPagination}
              type="button"
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </DashboardLayout>
  )
}
