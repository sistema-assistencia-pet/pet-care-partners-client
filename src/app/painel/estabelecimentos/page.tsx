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
import { CATEGORY, STATUS } from '@/lib/enums'
import { useToast } from '@/components/ui/use-toast'

interface ICategory {
  id: number
  name: string
}
interface IPartner {
  id: string
  cnpj: string
  fantasyName: string
  category: ICategory
  isOnline: boolean
  statusId: string
  createdAt: string
}

interface IFormValues {
  searchInput: string
  categoryId: string
  statusId: string
  isOnline: string
}

const PAGINATION_LIMIT = 10
const FORM_FILTER_DEFAULT_VALUES: IFormValues = {
  searchInput: '',
  categoryId: '',
  statusId: '1',
  isOnline: ''
}

export default function PartnersPage() {
  const [partners, setPartners] = useState<IPartner[]>([])
  const [partnersCount, setPartnersCount] = useState<number>(0)
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

  const columns: ColumnDef<IPartner>[] = [
    {
      header: `CNPJ`,
      accessorKey: `cnpj`,
    },
    {
      header: `Nome Fantasia`,
      accessorKey: `fantasyName`
    },
    {
      header: `Categoria`,
      accessorKey: `category.name`
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
          onClick={() => push(`/painel/estabelecimentos/${id}`)}
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
    const { searchInput, categoryId, isOnline, statusId } = data
    const query = new URLSearchParams()

    const searchInputWithoutMask = removeCnpjMask(searchInput)

    if (searchInput) query.append('search-input', searchInputWithoutMask)
    if (categoryId) query.append('category-id', categoryId)
    if (statusId) query.append('status-id', statusId)
    if (statusId) query.append('is-online', isOnline)

    setQuery(query)
    await fetchPartners(query)
  }

  const resetFilter = () => {
    form.reset(FORM_FILTER_DEFAULT_VALUES)

    setSkip(0)
    setPage(1)

    fetchPartners()
  }

  const formatPartner = (partner: { statusId: number } & Omit<IPartner, 'status'>) => ({
    ...partner,
    cnpj: applyCnpjMask(partner.cnpj),
    fantasyName: captalize(partner.fantasyName),
    category: { id: partner.category.id, name: captalize(partner.category.name) },
    createdAt: formatDateTime(partner.createdAt),
    status: STATUS[partner.statusId],
  })

  const fetchPartners = async (query?: URLSearchParams) => {
    const response = await sendRequest<
      { partners: Array<Omit<IPartner, 'status'> & { statusId: number }>, systemTotalSavings: number }
    >({
      endpoint: `/partner?take=${PAGINATION_LIMIT}&skip=${skip}${query ? `&${query.toString()}` : '&status-id=1'}`,
      method: 'GET',
    })

    if (response.error) {
      toast({
        description: response.message,
        variant: 'destructive'
      })

      setPartners([])
      setPartnersCount(0)
      // setSystemTotalSavings(formatCurrency(0))

      return
    }

    const formattedPartners = response.data.partners.map((partner) => formatPartner(partner))

    setPartners(formattedPartners)
    setPartnersCount(parseInt(response.headers[`x-total-count`]))
    // setSystemTotalSavings(formatCurrency(response.data.systemTotalSavings))
  }

  // Carrega lista de estabelecimentos
  useEffect(() => {
    if (query) {
      fetchPartners(query)
    } else fetchPartners()
  }, [skip])

  return (
    <DashboardLayout
      secondaryText={`Total: ${partnersCount} estabelecimentos`}
      // systemTotalSavingsText={`Economia total do sistema: ${systemTotalSavings}`}
      title="Estabelecimentos"
    >
      <div className='flex flex-row'>
        <Button type="button" onClick={() => push('/painel/estabelecimentos/cadastrar-estabelecimento')}>
          Cadastrar estabelecimento
        </Button>
      </div>

      <Form { ...form }>
        <form
          className='flex flex-row gap-4'
          onSubmit={form.handleSubmit((data) => submitFilter(data))}
        >
          <div className="flex flex-col grow space-y-1.5 bg-white">
            <Input { ...form.register("searchInput") } placeholder="CNPJ / Nome / Tag" type="text" />
          </div>
          <div className="flex flex-col space-y-1.5 bg-white">
            <FormField
              control={form.control}
              name="isOnline"
              render={({ field }) => (
                <FormItem>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-28">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="true">Online</SelectItem>
                      <SelectItem value="false">Presencial</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>
          <div className="flex flex-col space-y-1.5 bg-white">
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-28">
                        <SelectValue placeholder="Categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">{CATEGORY[1]}</SelectItem>
                      <SelectItem value="2">{CATEGORY[2]}</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
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

      <DataTable columns={columns} data={partners} />

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
              {`${page} de ${Math.ceil(partnersCount/PAGINATION_LIMIT)}`}
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              disabled={partnersCount <= page * PAGINATION_LIMIT}
              onClick={handleNextPagination}
              type="button"
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </DashboardLayout>
  )
}
