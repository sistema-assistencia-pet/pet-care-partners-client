'use client'

import { FieldValues, useForm } from 'react-hook-form'
import { type ColumnDef } from "@tanstack/react-table"
import { useEffect, useState } from 'react'

import { applyCnpjMask, applyCpfMask, captalize, formatDateTime, removeCnpjMask, removeCpfMask } from '@/lib/utils'
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
import { useRouter } from 'next/navigation'
interface IMember {
  id: string
  client: {
    cnpj: string
    fantasyName: string
  }
  cpf: string
  name: string
  status: string
  createdAt: string
}

interface IFormValues {
  cpf: string
  name: string
  clientCnpj: string
  statusId: string
}

const PAGINATION_LIMIT = 10
const FORM_FILTER_DEFAULT_VALUES: IFormValues = {
  cpf: '',
  name: '',
  clientCnpj: '',
  statusId: '1'
}

export default function MembersPage() {
  const [members, setMembers] = useState<IMember[]>([])
  const [membersCount, setMembersCount] = useState<number>(0)
  const [skip, setSkip] = useState<number>(0)
  const [page, setPage] = useState<number>(1)
  const [query, setQuery] = useState<URLSearchParams | null>(null)

  const form = useForm<IFormValues>({
    mode: 'onSubmit',
    defaultValues: FORM_FILTER_DEFAULT_VALUES
  })
  const { push } = useRouter()
  const { toast } = useToast()

  const columns: ColumnDef<IMember>[] = [
    {
      header: `CPF`,
      accessorKey: `cpf`
    },
    {
      header: `Nome`,
      accessorKey: `name`
    },
    {
      header: `CNPJ do Cliente`,
      accessorKey: `client.cnpj`
    },
    {
      header: `Nome Fantasia do Cliente`,
      accessorKey: `client.fantasyName`
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
          onClick={() => push(`/painel/associados/${id}`)}
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
    const { cpf, name, clientCnpj, statusId } = data
    const query = new URLSearchParams()

    if (cpf) query.append('cpf', cpf)
    if (name) query.append('name', name)
    if (clientCnpj) query.append('client-cnpj', removeCpfMask(clientCnpj))
    if (statusId) query.append('status-id', statusId)

    setQuery(query)
    await fetchMembers(query)
  }

  const resetFilter = () => {
    form.reset(FORM_FILTER_DEFAULT_VALUES)

    setSkip(0)
    setPage(1)

    fetchMembers()
  }

  const formatMember = (member: { statusId: number } & Omit<IMember, 'status'>) => ({
    ...member,
    cpf: applyCpfMask(member.cpf),
    client: {
      cnpj: applyCnpjMask(member.client.cnpj),
      fantasyName: captalize(member.client.fantasyName)
    },
    name: captalize(member.name),
    createdAt: formatDateTime(member.createdAt),
    status: STATUS[member.statusId]
  })

  const fetchMembers = async (query?: URLSearchParams) => {
    const response = await sendRequest<{ members: Array<{ statusId: number } & Omit<IMember, 'status'>> }>({
      endpoint: `/member?take=${PAGINATION_LIMIT}&skip=${skip}${query ? `&${query.toString()}` : '&status-id=1'}`,
      method: 'GET',
    })

    if (response.error) {
      toast({
        description: response.message,
        variant: 'destructive'
      })

      setMembers([])
      setMembersCount(0)

      return
    }

    const formattedMembers = response.data.members.map((member) => (formatMember(member)))

    setMembers(formattedMembers)
    setMembersCount(parseInt(response.headers[`x-total-count`]))
  }

  // Carrega lista de associados
  useEffect(() => {
    if (query) {
      fetchMembers(query)
    } else fetchMembers()
  }, [skip])

  return (
    <DashboardLayout title="Associados" secondaryText={`Total: ${membersCount} associados`}>
      <Form { ...form }>
        <form
          className='flex flex-row gap-4'
          onSubmit={form.handleSubmit((data) => submitFilter(data))}
        >
          <div className="flex flex-col grow space-y-1.5 bg-white">
            <Input { ...form.register("cpf") } placeholder="CPF" type="text" />
          </div>
          <div className="flex flex-col grow space-y-1.5 bg-white">
            <Input { ...form.register("clientCnpj") } placeholder="CNPJ do cliente" type="text" />
          </div>
          <div className="flex flex-col grow space-y-1.5 bg-white">
            <Input { ...form.register("name") } placeholder="Nome" type="text" />
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

      <DataTable columns={columns} data={members} />

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
              {`${page} de ${Math.ceil(membersCount/PAGINATION_LIMIT)}`}
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              disabled={membersCount <= page * PAGINATION_LIMIT}
              onClick={handleNextPagination}
              type="button"
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </DashboardLayout>
  )
}
