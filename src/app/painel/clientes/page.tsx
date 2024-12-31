'use client'

import { useForm } from 'react-hook-form'
import { type ColumnDef } from "@tanstack/react-table"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import {
  applyCnpjMask,
  captalize,
  formatDateTime,
  removeSpecialCharacters
} from '@/lib/utils'
import { Button } from '@/components/ui/button'
import DashboardLayout from '@/components/DashboardLayout'
import { DataTable } from '../../../components/DataTable'
import { Eye, FilterX } from 'lucide-react'
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@radix-ui/react-label'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { PAGINATION_LIMIT } from '@/lib/constants'
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

export default function ClientsPage() {
  // --------------------------- PAGE SETUP ---------------------------
  const { push } = useRouter()
  const { toast } = useToast()

  interface ICity {
    id: number
    name: string
  }

  interface IState {
    id: number
    name: string
  }

  interface IClient {
    id: string
    cnpj: string
    fantasyName: string
    segment: string
    availableBalanceInCents: number
    city: ICity
    state: IState
    createdAt: string
  }

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
      header: `Estado`,
      accessorKey: `state.name`
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

  // --------------------------- FETCH PARTNERS ---------------------------
  const [clients, setClients] = useState<IClient[]>([])
  const [clientsCount, setClientsCount] = useState<number>(0)

  const formatClient = (client: IClient): IClient => ({
    ...client,
    cnpj: applyCnpjMask(client.cnpj),
    fantasyName: captalize(client.fantasyName),
    segment: captalize(client.segment),
    createdAt: formatDateTime(client.createdAt)
  })

  const fetchClients = async (query?: URLSearchParams): Promise<void> => {
    const response = await sendRequest<{ clients: IClient[] }>({
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

      return
    }

    const formattedClients = response.data.clients.map((client) => formatClient(client))

    setClients(formattedClients)
    setClientsCount(parseInt(response.headers[`x-total-count`]))
  }

  // --------------------------- FILTER ---------------------------
  interface IFilterFormValues {
    searchInput: string
    statusId: string
  }
  
  const FILTER_FORM_DEFAULT_VALUES: IFilterFormValues = {
    searchInput: '',
    statusId: '1'
  }

  const [query, setQuery] = useState<URLSearchParams | null>(null)

  const filterForm = useForm<IFilterFormValues>({
    mode: 'onSubmit',
    defaultValues: FILTER_FORM_DEFAULT_VALUES
  })

  const submitFilter = async (data: IFilterFormValues) => {
    const { searchInput, statusId } = data
    const query = new URLSearchParams()

    const searchInputWithoutMask = removeSpecialCharacters(searchInput)

    if (searchInput) query.append('search-input', searchInputWithoutMask)
    if (statusId) query.append('status-id', statusId)

    setQuery(query)
    await fetchClients(query)
  }

  const resetFilter = () => {
    filterForm.reset(FILTER_FORM_DEFAULT_VALUES)

    setSkip(0)
    setPage(1)

    fetchClients()
  }

  // --------------------------- PAGINATION ---------------------------
  const [skip, setSkip] = useState<number>(0)
  const [page, setPage] = useState<number>(1)

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

  // --------------------------- USE EFFECT ---------------------------
  // Carrega lista de clientes quando a página carrega ou a paginação muda
  useEffect(() => {
    if (query) {
      fetchClients(query)
    } else fetchClients()
  }, [skip])

  // --------------------------- RETURN ---------------------------
  return (
    <DashboardLayout
      secondaryText={`Total: ${clientsCount} clientes`}
      title="Clientes"
    >
      <div className='flex flex-row'>
        <Button type="button" onClick={() => push('/painel/clientes/cadastrar-cliente')}>
          Cadastrar cliente
        </Button>
      </div>

      {/* Filter */}
      <Form { ...filterForm }>
        <form
          className='flex flex-row gap-4 items-end'
          onSubmit={filterForm.handleSubmit((data) => submitFilter(data))}
        >

          {/* Search Input */}
          <div className="flex flex-col grow space-y-1.5">
            <Label className='bg-transparent text-sm' htmlFor="searchInput">Pesquisar</Label>
            <Input
              { ...filterForm.register("searchInput") }
              className='bg-white'
              placeholder="CNPJ / Nome Fantasia / Segmento" type="text"
            />
          </div>

          {/* Status */}
          <div className="flex flex-col space-y-1.5 bg-white">
          <FormField
            control={filterForm.control}
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

          {/* Buttons */}
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

      {/* Table */}
      <DataTable columns={columns} data={clients} />

      {/* Pagination */}
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
