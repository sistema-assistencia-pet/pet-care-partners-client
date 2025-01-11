'use client'

import { useForm } from 'react-hook-form'
import { type ColumnDef } from "@tanstack/react-table"
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { z } from 'zod'

import {
  captalize,
  removeSpecialCharacters,
  transformCurrencyFromCentsToBRLString,
} from '@/lib/utils'
import { Button } from '@/components/ui/button'
import DashboardLayout from '@/components/DashboardLayout'
import { DataTable } from '../../../../../components/DataTable'
import { Eye, FilterX, Pencil, Trash, Trash2 } from 'lucide-react'
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
import { PAGINATION_LIMIT, SELECT_DEFAULT_VALUE } from '@/lib/constants'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { sendRequest } from '@/lib/sendRequest'
import { STATE, STATUS } from '@/lib/enums'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { DetailsRow } from '@/components/DetailsRow'
import { InputContainer } from '@/components/InputContainer'
import { zodResolver } from '@hookform/resolvers/zod'

export default function VoucherCodesPage() {
  // --------------------------- PAGE SETUP ---------------------------
  interface IVoucherCode {
    id: string
    code: string
    voucherId: string
    wasRedeemed: boolean
    wasValidated: boolean
    statusId: number
    createdAt: string
    updatedAt: string
  }

  const params = useParams()
  const { push } = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()

  const columns: ColumnDef<IVoucherCode>[] = [
    {
      header: `Código`,
      accessorKey: `code`
    },
    {
      header: `Foi resgatado?`,
      accessorKey: `wasRedeemed`,
      cell: ({ row: { original: { wasRedeemed } } }) => (
        <span>{wasRedeemed ? 'Sim' : 'Não'}</span>
      )
    },
    {
      header: `Foi validado?`,
      accessorKey: `wasValidated`,
      cell: ({ row: { original: { wasValidated } } }) => (
        <span>{wasValidated ? 'Sim' : 'Não'}</span>
      )
    },
    {
      header: `Status`,
      accessorKey: `statusId`,
      cell: ({ row: { original: { statusId } } }) => (
        <span>{STATUS[statusId]}</span>
      )
    },
    {
      header: `Ações`,
      accessorKey: `id`,
      cell: ({ row: { original: { id, statusId } } }) => (
        <AlertDialog>
          <AlertDialogTrigger 
            className='disabled:opacity-50 rounded-md w-9 h-9 bg-destructive text-white flex flex-col justify-center'
            disabled={statusId === STATUS.Excluído}
            title='Excluir'
          >
            <Trash2  className='mx-auto'/>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão?</AlertDialogTitle>
              <AlertDialogDescription>
                A operação <strong className='text-black'>não</strong> poderá ser desfeita!
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <Button variant="destructive" onClick={() => deleteVoucherCode(id)}>
                Excluir
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )
    }
  ]

  // --------------------------- FILTER ---------------------------
  interface IFilterFormValues {
    wasRedeemed: typeof SELECT_DEFAULT_VALUE | 'true' | 'false'
  }

  const FILTER_FORM_DEFAULT_VALUES: IFilterFormValues = {
    wasRedeemed: SELECT_DEFAULT_VALUE
  }

  const [query, setQuery] = useState<URLSearchParams | null>(null)

  const filterForm = useForm<IFilterFormValues>({
    mode: 'onSubmit',
    defaultValues: FILTER_FORM_DEFAULT_VALUES
  })

  const submitFilter = async (data: IFilterFormValues) => {
    const { wasRedeemed } = data
    const query = new URLSearchParams()

    if (
      (wasRedeemed === 'true') ||
      (wasRedeemed === 'false')
    ) {
      query.append('was-redeemed', wasRedeemed)
    } else query.set('was-redeemed', '')

    setQuery(query)
    await fetchVoucherCodes(query)
  }

  const resetFilter = () => {
    filterForm.reset(FILTER_FORM_DEFAULT_VALUES)

    fetchVoucherCodes()
  }

  // --------------------------- CREATE ONE ---------------------------
  const createVoucherCodeFormSchema = z.object({
    voucherId: z
      .string({ required_error: 'O campo Id do Voucher é obrigatório.' })
      .uuid({ message: 'O campo Id do Voucher é obrigatório.' }),
    code: z
      .string({ required_error: 'O campo Código é obrigatório.' })
      .min(1, { message: 'O campo Código é obrigatório.' })
  })

  type CreateVoucherCodeFormSchema = z.infer<typeof createVoucherCodeFormSchema>
  
  const CREATE_VOUCHER_CODE_FORM_DEFAULT_VALUES: CreateVoucherCodeFormSchema = {
    voucherId: params.id as string,
    code: ''
  }

  const createVoucherCodeForm = useForm<CreateVoucherCodeFormSchema>({
    mode: 'onBlur',
    defaultValues: CREATE_VOUCHER_CODE_FORM_DEFAULT_VALUES,
    resolver: zodResolver(createVoucherCodeFormSchema)
  })

  const createVoucherCode = async (createVoucherCodeData: CreateVoucherCodeFormSchema): Promise<void> => {
    const response = await sendRequest<{ voucherCodeId: string }>({
      endpoint: '/voucher-code',
      method: 'POST',
      data: createVoucherCodeData
    })

    if (response.error) {
      toast({
        description: response.message,
        variant: 'destructive'
      })
    } else {
      toast({
        description: response.message
      })
    }

    fetchVoucherCodes()
  }

  // --------------------------- CREATE MANY CODES ---------------------------
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

  const sendCSVToCreateVoucherCodes = async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)

    const response = await sendRequest({
      endpoint: `/voucher-code/${params.id}/create-in-bulk`,
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

    fetchVoucherCodes()
  }

  // --------------------------- DELETE ---------------------------
  const deleteVoucherCode = async (id: string) => {
    const response = await sendRequest({
      endpoint: `/voucher-code/${id}/delete`,
      method: 'PATCH'
    })

    if (response.error) {
      toast({
        description: response.message,
        variant: 'destructive'
      })
    }

    toast({
      description: response.message,
      variant: 'success'
    })

    fetchVoucherCodes()
  }

  // --------------------------- FETCH VOUCHER CODES ---------------------------
  const [vouchercodes, setVoucherCodes] = useState<IVoucherCode[]>([])
  const [vouchercodesCount, setVoucherCodesCount] = useState<number>(0)

  const fetchVoucherCodes = async (query?: URLSearchParams) => {
    const response = await sendRequest<
      { voucherCodes: IVoucherCode[] }
    >({
      endpoint: `/voucher-code?voucher-id=${params.id}${query ? `&${query.toString()}` : ''}`,
      method: 'GET',
    })

    if (response.error) {
      toast({
        description: response.message,
        variant: 'destructive'
      })

      setVoucherCodes([])
      setVoucherCodesCount(0)

      return
    }

    setVoucherCodes(response.data.voucherCodes)
    setVoucherCodesCount(parseInt(response.headers[`x-total-count`]))
  }

  // --------------------------- USE EFFECT ---------------------------
  // Carrega lista de parceiros quando a página carrega ou a paginação muda
  useEffect(() => {
    if (query) {
      fetchVoucherCodes(query)
    } else fetchVoucherCodes()
  }, [])

  // Dispara envio do arquivo CSV para criação de códigos de voucher
  useEffect(() => {
    if (fileSelected) {
      sendCSVToCreateVoucherCodes(fileSelected)
    }
  }, [fileSelected])

  // --------------------------- RETURN ---------------------------
  return (
    <DashboardLayout
      secondaryText={`Total: ${vouchercodesCount} vouchercodes`}
      title="Códigos do Voucher"
    >

      {/* Top Bar */}
      <div className='flex justify-between items-end w-full'>

        {/* Create Voucher Codes */}
        <div className='flex gap-4 items-end'>

          {/* Create Many */}
          <Label
            htmlFor="file-input"
            className="uppercase text-sm font-medium bg-primary text-primary-foreground shadow hover:bg-primary/90 leading-9 rounded-md px-8 cursor-pointer"
          >
            Cadastrar Códigos em Lote
          </Label>
          <Input
            accept=".csv"
            className="hidden"
            id="file-input"
            onChange={handleFileChange}
            type="file"
            multiple={false}
            placeholder='Cadastrar Códigos em Lote'
          />

          {/* Create One */}
          <AlertDialog>
            <AlertDialogTrigger title='Editar' className='uppercase px-8 h-9 rounded-md bg-secondary text-sm font-medium flex flex-col justify-center shadow-sm hover:opacity-80'>
              Cadastrar Um Código
            </AlertDialogTrigger>
            <AlertDialogContent className='max-h-screen overflow-y-auto'>
              <AlertDialogTitle>Cadastrar código de voucher</AlertDialogTitle>
              <Form { ...createVoucherCodeForm }>
                <form
                  className='flex flex-col gap-4'
                  onSubmit={createVoucherCodeForm.handleSubmit((data) => createVoucherCode(data))}
                >

                  <DetailsRow>
                    <InputContainer>
                      <Label htmlFor="code">Código</Label>
                      <Input className="bg-white" { ...createVoucherCodeForm.register("code") } />
                      {
                        createVoucherCodeForm.formState.errors.code
                          && <span className="text-red-500 text-xs">{createVoucherCodeForm.formState.errors.code.message}</span>
                      }
                    </InputContainer>
                  </DetailsRow>

                  <AlertDialogFooter>
                    <AlertDialogCancel type="button">Fechar</AlertDialogCancel>
                    <AlertDialogAction type="submit" disabled={!createVoucherCodeForm.formState.isValid}>
                      Confirmar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </form>
              </Form>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Filter Form */}
        <Form { ...filterForm }>
          <form
            className='flex gap-4 items-end'
            onSubmit={filterForm.handleSubmit((data) => submitFilter(data))}
          >
            {/* Was Voucher Code Redeemed ? */}
            <div className="flex flex-col space-y-1.5">
              <Label className='bg-transparent text-sm' htmlFor="wasRedeemed">Foi Resgatado?</Label>
              <FormField
                control={filterForm.control}
                name="wasRedeemed"
                render={({ field }) => (
                  <FormItem>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-28 bg-white">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={SELECT_DEFAULT_VALUE}>Todos</SelectItem>
                        <SelectItem value="true">Sim</SelectItem>
                        <SelectItem value="false">Não</SelectItem>
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

      </div>

      {/* Table */}
      <DataTable columns={columns} data={vouchercodes} />

    </DashboardLayout>
  )
}
