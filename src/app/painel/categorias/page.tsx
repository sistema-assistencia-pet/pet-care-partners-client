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

interface ICategory {
  id: string
  name: number
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

export default function CategoriesPage() {
  const [categories, setCategories] = useState<ICategory[]>([])
  const [categoriesCount, setCategoriesCount] = useState<number>(0)
  const [query, setQuery] = useState<URLSearchParams | null>(null)

  const form = useForm<IFormValues>({
    mode: 'onSubmit',
    defaultValues: FORM_FILTER_DEFAULT_VALUES
  })
  const { push } = useRouter()
  const { toast } = useToast()

  const columns: ColumnDef<ICategory>[] = [
    {
      header: `Nome`,
      accessorKey: `name`,
    },
    {
      header: `Ações`,
      accessorKey: `id`,
      cell: ({ row: { original: { id } } }) => (
        <Button
          className=''
          onClick={() => push(`/painel/categorias/${id}`)}
          size="icon"
          title="Visualizar Detalhes"
          variant="outline"
        >
          <Eye />
        </Button>
      )
    }
  ]

  const fetchCategories = async (query?: URLSearchParams) => {
    const response = await sendRequest<{ categories: ICategory[] }>({
      endpoint: `/category?${query ? `&${query.toString()}` : ''}`,
      method: 'GET',
    })

    if (response.error) {
      toast({
        description: response.message,
        variant: 'destructive'
      })

      setCategories([])
      setCategoriesCount(0)

      return
    }

    setCategories(response.data.categories)
    setCategoriesCount(parseInt(response.headers[`x-total-count`]))
  }

  // Carrega lista de categorias
  useEffect(() => {
    if (query) {
      fetchCategories(query)
    } else fetchCategories()
  }, [])

  return (
    <DashboardLayout
      secondaryText={`Total: ${categoriesCount} categorias`}
      title="Categorias"
    >
      <div className='flex flex-row'>
        <Button type="button" onClick={() => push('/painel/categorias/cadastrar-categoria')}>
          Cadastrar categoria
        </Button>
      </div>

      {/* table */}
      <DataTable columns={columns} data={categories} />

    </DashboardLayout>
  )
}
