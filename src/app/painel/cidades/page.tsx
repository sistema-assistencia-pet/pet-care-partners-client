'use client'

import { type ColumnDef } from "@tanstack/react-table"
import { useForm } from 'react-hook-form'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { v4 as uuid } from 'uuid'

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
import { useToast } from '@/components/ui/use-toast'
import { STATES } from '@/lib/enums'

interface ICity {
  id: string
  name: number
  stateId: number
}

interface ICityToBeDisplayed {
  id: string
  name: number
  state: string
}

interface IFormValues {
  searchInput: string
  stateId: number
}

const PAGINATION_LIMIT = 10
const FORM_FILTER_DEFAULT_VALUES: IFormValues = {
  searchInput: '',
  stateId: 0
}

export default function CitiesPage() {
  const [cities, setCities] = useState<ICityToBeDisplayed[]>([])
  const [citiesCount, setCitiesCount] = useState<number>(0)
  const [skip, setSkip] = useState<number>(0)
  const [page, setPage] = useState<number>(1)
  const [query, setQuery] = useState<URLSearchParams | null>(null)

  const form = useForm<IFormValues>({
    mode: 'onSubmit',
    defaultValues: FORM_FILTER_DEFAULT_VALUES
  })
  const { push } = useRouter()
  const { toast } = useToast()

  const columns: ColumnDef<ICityToBeDisplayed>[] = [
    {
      header: `Nome`,
      accessorKey: `name`,
    },
    {
      header: `Estado`,
      accessorKey: `state`
    },
    {
      header: `Ações`,
      accessorKey: `id`,
      cell: ({ row: { original: { id } } }) => (
        <Button
          className=''
          onClick={() => push(`/painel/cidades/${id}`)}
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

  const formatCities = (cities: ICity[]): ICityToBeDisplayed[] => {
    return cities.map((city) => {
      return {
        id: city.id,
        name: city.name,
        state: STATES[city.stateId]
      }
    })
  }

  const submitFilter = async (data: IFormValues) => {
    const { searchInput, stateId } = data
    const query = new URLSearchParams()

    if (searchInput) query.append('search-input', searchInput)
    if (stateId && stateId != 0) query.append('state-id', stateId.toString())

    setQuery(query)
    await fetchCities(query)
  }

  const resetFilter = () => {
    form.reset(FORM_FILTER_DEFAULT_VALUES)
    setQuery(null)

    setSkip(0)
    setPage(1)

    fetchCities()
  }

  const fetchCities = async (query?: URLSearchParams) => {
    const response = await sendRequest<{ cities: ICity[] }>({
      endpoint: `/city?take=${PAGINATION_LIMIT}&skip=${skip}${query ? `&${query.toString()}` : ''}`,
      method: 'GET',
    })

    if (response.error) {
      toast({
        description: response.message,
        variant: 'destructive'
      })

      setCities([])
      setCitiesCount(0)

      return
    }

    const formattedCities = formatCities(response.data.cities)

    setCities(formattedCities)
    setCitiesCount(parseInt(response.headers[`x-total-count`]))
  }

  // Carrega lista de cidades
  useEffect(() => {
    if (query) {
      fetchCities(query)
    } else fetchCities()
  }, [skip])

  return (
    <DashboardLayout
      secondaryText={`Total: ${citiesCount} cidades`}
      title="Cidades"
    >
      <div className='flex flex-row'>
        <Button type="button" onClick={() => push('/painel/cidades/cadastrar-cidade')}>
          Cadastrar cidade
        </Button>
      </div>

      {/* filter */}
      <Form { ...form }>
        <form
          className='flex flex-row gap-4'
          onSubmit={form.handleSubmit((data) => submitFilter(data))}
        >

          {/* search input */}
          <div className="flex flex-col grow space-y-1.5 bg-white">
            <Input { ...form.register("searchInput") } placeholder="Nome da cidade" type="text" />
          </div>

          {/* state */}
          <div className="flex flex-col space-y-1.5 bg-white">
            <FormField
              control={form.control}
              name="stateId"
              render={({ field }) => (
                <FormItem>
                  <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger className="w-28">
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem key={uuid()} value={(0).toString()}>Todos</SelectItem>
                      {
                        Object.entries(STATES).filter(([key, _value]) => isNaN(Number(key))).map(([key, value]) => (
                          <SelectItem key={uuid()} value={value.toString()}>{key}</SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>

          {/* buttons */}
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

      {/* table */}
      <DataTable columns={columns} data={cities} />

      {/* pagination */}
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
              {`${page} de ${Math.ceil(citiesCount/PAGINATION_LIMIT)}`}
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              disabled={citiesCount <= page * PAGINATION_LIMIT}
              onClick={handleNextPagination}
              type="button"
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </DashboardLayout>
  )
}
