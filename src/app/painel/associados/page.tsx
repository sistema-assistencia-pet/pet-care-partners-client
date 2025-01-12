'use client'

import { useForm } from 'react-hook-form'
import { type ColumnDef } from "@tanstack/react-table"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { v4 as uuid } from 'uuid'

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
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
import { PAGINATION_LIMIT } from '@/lib/constants'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { sendRequest } from '@/lib/sendRequest'
import { ROLE, STATUS } from '@/lib/enums'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/contexts/AuthContext'

export default function MembersPage() {
  // --------------------------- PAGE SETUP ---------------------------
  const { push } = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  interface IMember {
    id: string
    cpf: string
    name: string
    client: {
      id: string
      cnpj: string
      fantasyName: string
    }
    status: {
      id: number
      translation: string
    }
    createdAt: string
  }

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
    await fetchMembers(query)
  }

  const resetFilter = () => {
    filterForm.reset(FILTER_FORM_DEFAULT_VALUES)

    setSkip(0)
    setPage(1)

    fetchMembers()
  }

  // --------------------------- FETCH MEMBERS ---------------------------
  const [members, setMembers] = useState<IMember[]>([])
  const [membersCount, setMembersCount] = useState<number>(0)

  const formatMember = (member: IMember): IMember => ({
    ...member,
    cpf: applyCpfMask(member.cpf),
    name: captalize(member.name),
    client: {
      id: member.client.id,
      cnpj: applyCnpjMask(member.client.cnpj),
      fantasyName: captalize(member.client.fantasyName)
    },
    status: {
      id: member.status.id,
      translation: captalize(member.status.translation)
    },
    createdAt: formatDateTime(member.createdAt)
  })

  const fetchMembers = async (query?: URLSearchParams) => {
    const response = await sendRequest<{ members: IMember[] }>({
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

  // --------------------------- FETCH CLIENTS ---------------------------
  interface IClient {
    id: string
    cnpj: string
    fantasyName: string
    segment: string
    availableBalanceInCents: number
    createdAt: string
    city: {
      id: number
      name: string
    } | null
    state: {
      id: number
      name: string
    } | null
  }

  const [clients, setClients] = useState<IClient[]>([])

  const formatClient = (client: IClient): IClient => ({
    ...client,
    cnpj: applyCnpjMask(client.cnpj ?? ''),
    fantasyName: captalize(client.fantasyName ?? ''),
    segment: captalize(client.segment ?? ''),
    createdAt: formatDateTime(client.createdAt ?? ''),
    city: client.city ? {
      id: client.city.id ?? '',
      name: captalize(client.city.name ?? '')
    } : null,
    state: client.state ? {
      id: client.state.id ?? '',
      name: captalize(client.state.name ?? '')
    } : null
  })

  const fetchClients = async () => {
    const response = await sendRequest<{ clients: IClient[] }>({
      endpoint: '/client',
      method: 'GET',
    })

    if (response.error) {
      toast({
        description: response.message,
        variant: 'destructive'
      })

      setClients([])

      return
    }

    const formattedClients = response.data.clients.map((client) => formatClient(client))

    setClients(formattedClients)
  }

  // --------------------------- CREATE MANY MEMBERS ---------------------------
  const [clientIdSelected, setClientIdSelected] = useState<string>('')
  const [fileSelected, setFileSelected] = useState<File | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files

    if (files && files.length > 0) {
      const file = files[0]

      if (file.type === "text/csv") {
        setFileSelected(file)
      } else {
        toast({
          description: "O arquivo selecionado não tem a extensão .csv",
          variant: "destructive"
        })
        setFileSelected(null)
      }
    }
  }

  const sendCSVToCreateMembers = async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)

    const response = await sendRequest({
      endpoint: `/member/${clientIdSelected}/create-in-bulk`,
      method: 'POST',
      data: formData,
    })

    if (response.error) {
      toast({
        description: response.message,
        variant: 'destructive'
      })

      return
    }

    toast({
      description: `${response.message} Você pode fechar essa janela agora.`,
      variant: "success"
    })

    fetchMembers()
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
  // Dispara a criação de associados em lote quando um arquivo é selecionado
  useEffect(() => {
    if (fileSelected) {
      sendCSVToCreateMembers(fileSelected)
    }
  }, [fileSelected])

  // Carrega lista de associados quando a página carrega ou a paginação muda
  useEffect(() => {
    if (query) {
      fetchMembers(query)
    } else fetchMembers()
  }, [skip])

  // Se for ususário MASTER, carrega lista de clientes quando a página carrega
  useEffect(() => {
    if (user?.roleId === ROLE.MASTER) {
      fetchClients()
    } else if (user?.roleId === ROLE.CLIENT_ADMIN) { // Se não, pré-seleciona cliente do usuário para criação de novos associados
      console.log(user?.client?.id)
      setClientIdSelected(user.client?.id ?? '')
    }
  }, [user])

  // --------------------------- RETURN ---------------------------
  return (
    <DashboardLayout title="Associados" secondaryText={`Total: ${membersCount} associados`}>

      {/* Create Members */}
      <div className="flex justify-between w-full">
        <div className="flex gap-4">
          <AlertDialog>
            <AlertDialogTrigger className='rounded-md font-medium text-sm uppercase px-8 h-9 bg-primary text-white flex flex-col justify-center'>
              Cadastrar associado(s)
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogTitle>Escolha o cliente</AlertDialogTitle>
              <AlertDialogDescription>
                <form
                  className='flex flex-col gap-4'
                >
                  <div className="flex flex-col space-y-1.5 bg-white">
                    {
                      user?.roleId === ROLE.MASTER && (
                        <select
                          className='h-8 px-4 border rounded-md'
                          value={clientIdSelected}
                          onChange={({ target }) => setClientIdSelected(target.value)}
                        >
                          <option value="" />
                          {
                            clients.map(({ id, fantasyName }) => (
                              <option key={uuid()} value={id}>{fantasyName}</option>
                            ))
                          }
                        </select>
                      )
                    }
                  </div>
                  <AlertDialogFooter>
                    <div className='flex flex-col gap-4 justify-end'>
                      <AlertDialogCancel type="button">Fechar</AlertDialogCancel>
                    </div>
                    <div className='flex flex-col gap-4'>
                      <Button
                        disabled={clientIdSelected === ''}
                        onClick={() => push(`/painel/clientes/${clientIdSelected}/cadastrar-associado`)}
                        type="button"
                        variant="secondary"
                      >
                        Cadastrar um associado
                      </Button>
                      <Label
                        htmlFor="file-input"
                        className="uppercase bg-primary text-primary-foreground shadow hover:bg-primary/90 leading-9 rounded-md px-8 cursor-pointer"
                      >
                        Cadastrar Associados em Lote
                      </Label>
                      <Input
                        accept=".csv"
                        disabled={clientIdSelected === ''}
                        className="hidden"
                        id="file-input"
                        onChange={handleFileChange}
                        type="file"
                        multiple={false}
                        placeholder='Cadastrar Associados em Lote'
                      />
                    </div>
                  </AlertDialogFooter>
                </form>
              </AlertDialogDescription>
            </AlertDialogContent>
          </AlertDialog>
        </div>
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
              placeholder="CPF / Nome / CNPJ do Cliente / Nome do Cliente" type="text"
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
      <DataTable columns={columns} data={members} />

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
