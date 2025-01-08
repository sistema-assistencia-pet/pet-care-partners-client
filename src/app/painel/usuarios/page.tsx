'use client'

import { useForm } from 'react-hook-form'
import { type ColumnDef } from "@tanstack/react-table"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import {
  applyCnpjMask,
  applyCpfMask,
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
import { Label } from '@/components/ui/label'
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
import { PAGINATION_LIMIT } from '@/lib/constants'

export default function UsersPage() {
  // --------------------------- PAGE SETUP ---------------------------
  const { push } = useRouter()
  const { toast } = useToast()

  interface IStatus {
    id: number
    translation: string
  }

  interface IRole {
    id: number
    translation: string
  }

  interface IClientMinData {
    id: string
    fantasyName: string
  }

  interface IUser {
    id: string
    cpf: string
    name: string
    client: IClientMinData | null
    role: IRole
    status: IStatus
    createdAt: string
  }

  const columns: ColumnDef<IUser>[] = [
    {
      header: `CPF`,
      accessorKey: `cpf`
    },
    {
      header: `Nome`,
      accessorKey: `name`
    },
    {
      header: `Nível de acesso`,
      accessorKey: `role.translation`
    },
    {
      header: `Nome Fantasia do Cliente`,
      accessorKey: `client.fantasyName`
    },
    {
      header: `Status`,
      accessorKey: `status.translation`
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
          onClick={() => push(`/painel/usuarios/${id}`)}
          size="icon"
          title="Visualizar Detalhes"
          variant="outline"
        >
          <Eye />
        </Button>
      )
    }
  ]

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
    await fetchUsers(query)
  }

  const resetFilter = () => {
    filterForm.reset(FILTER_FORM_DEFAULT_VALUES)

    setSkip(0)
    setPage(1)

    fetchUsers()
  }

  // --------------------------- FETCH USERS ---------------------------
  const [users, setUsers] = useState<IUser[]>([])
  const [usersCount, setUsersCount] = useState<number>(0)

  const formatUser = (user: IUser): IUser => ({
    ...user,
    cpf: applyCpfMask(user.cpf),
    name: captalize(user.name),
    client: {
      id: user.client?.id ?? '',
      fantasyName: captalize(user.client?.fantasyName ?? '-')
    },
    status: {
      id: user.status.id,
      translation: captalize(user.status.translation)
    },
    createdAt: formatDateTime(user.createdAt)
  })

  const fetchUsers = async (query?: URLSearchParams) => {
    const response = await sendRequest<{ users: IUser[] }>({
      endpoint: `/user?take=${PAGINATION_LIMIT}&skip=${skip}${query ? `&${query.toString()}` : '&status-id=1'}`,
      method: 'GET',
    })

    if (response.error) {
      toast({
        description: response.message,
        variant: 'destructive'
      })

      setUsers([])
      setUsersCount(0)

      return
    }

    const formattedUsers = response.data.users.map((user) => (formatUser(user)))

    setUsers(formattedUsers)
    setUsersCount(parseInt(response.headers[`x-total-count`]))
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
  // Carrega lista de usuários quando a página carrega ou a paginação muda
  useEffect(() => {
    if (query) {
      fetchUsers(query)
    } else fetchUsers()
  }, [skip])

  // --------------------------- RETURN ---------------------------
  return (
    <DashboardLayout title="Usuários" secondaryText={`Total: ${usersCount} usuários`}>

      {/* Create Users */}
      <div className='flex flex-row'>
        <Button type="button" onClick={() => push('/painel/usuarios/cadastrar-usuario')}>
          Cadastrar usuário
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
              placeholder="CPF / Nome" type="text"
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
      <DataTable columns={columns} data={users} />

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
              {`${page} de ${Math.ceil(usersCount/PAGINATION_LIMIT)}`}
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              disabled={usersCount <= page * PAGINATION_LIMIT}
              onClick={handleNextPagination}
              type="button"
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </DashboardLayout>
  )
}
