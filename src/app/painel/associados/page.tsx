'use client'

import { FieldValues, useForm } from 'react-hook-form'
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
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { applyCnpjMask, applyCpfMask, captalize, formatDateTime, removeCnpjMask } from '@/lib/utils'
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
import { Label } from '@/components/ui/label'

interface IClient {
  id: string
  cnpj: string
  fantasyName: string
  segment: string
  status: string
  createdAt: string
}

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
  const [clients, setClients] = useState<IClient[]>([])
  const [clientIdSelected, setClientIdSelected] = useState<string>('')
  const [skip, setSkip] = useState<number>(0)
  const [page, setPage] = useState<number>(1)
  const [query, setQuery] = useState<URLSearchParams | null>(null)
  const [fileSelected, setFileSelected] = useState<File | null>(null)

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

    const clientCnpjWithoutMask = removeCnpjMask(clientCnpj)

    if (cpf) query.append('cpf', cpf)
    if (name) query.append('name', name)
    if (clientCnpj) query.append('client-cnpj', clientCnpjWithoutMask)
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

  const formatClient = (client: { statusId: number } & Omit<IClient, 'status'>) => ({
    ...client,
    cnpj: applyCnpjMask(client.cnpj),
    fantasyName: captalize(client.fantasyName),
    segment: captalize(client.segment),
    createdAt: formatDateTime(client.createdAt),
    status: STATUS[client.statusId],
  })

  const fetchClients = async () => {
    const response = await sendRequest<
      { clients: Array<Omit<IClient, 'status'> & { statusId: number }>, systemTotalSavings: number }
    >({
      endpoint: '/client',
      method: 'GET',
    })

    if (response.error) {
      toast({
        description: response.message,
        variant: 'destructive'
      })

      setClients([])
      // setSystemTotalSavings(formatCurrency(0))

      return
    }

    const formattedClients = response.data.clients.map((client) => formatClient(client))

    setClients(formattedClients)    // setSystemTotalSavings(formatCurrency(response.data.systemTotalSavings))
  }

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
      endpoint: `/member/${clientIdSelected}/create-members-in-bulk`,
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
      description: response.message,
      variant: "success"
    })
  }

  useEffect(() => {
    if (fileSelected) {
      sendCSVToCreateMembers(fileSelected)
    }
  }, [fileSelected])

  // Carrega lista de associados
  useEffect(() => {
    if (query) {
      fetchMembers(query)
    } else fetchMembers()

    fetchClients()
  }, [skip])

  return (
    <DashboardLayout title="Associados" secondaryText={`Total: ${membersCount} associados`}>
      <div className="flex justify-between w-full">
        <div className="flex gap-4">
          <AlertDialog>
            <AlertDialogTrigger className='rounded-md font-medium text-sm uppercase px-8 h-9 bg-primary text-white flex flex-col justify-center'>
              Cadastrar associado(s)
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogTitle>Escolha o cliente</AlertDialogTitle>
              <AlertDialogDescription>
                {/* <Form { ...form }> */}
                  <form
                    className='flex flex-col gap-4'
                  >
                    <div className="flex flex-col space-y-1.5 bg-white">
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
                {/* </Form> */}
              </AlertDialogDescription>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
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
