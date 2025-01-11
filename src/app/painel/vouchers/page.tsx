'use client'

import { Controller, useForm } from 'react-hook-form'
import { type ColumnDef } from "@tanstack/react-table"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { v4 as uuid } from 'uuid'

import {
  captalize,
  formatCurrency,
  leaveOnlyDigits,
  removeSpecialCharacters,
  transformCurrencyFromCentsToBRLString,
} from '@/lib/utils'
import { Button } from '@/components/ui/button'
import DashboardLayout from '@/components/DashboardLayout'
import { DataTable } from '../../../components/DataTable'
import { Check, Eye, FilterX, Pencil, Plus, Settings, Settings2, XIcon } from 'lucide-react'
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
import { PAGINATION_LIMIT, SELECT_DEFAULT_VALUE, WAITING_TIME_IN_HOURS_DEFAULT_VALUE } from '@/lib/constants'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { sendRequest } from '@/lib/sendRequest'
import { ROLE, STATE, STATUS, WAITING_TIME_IN_HOURS } from '@/lib/enums'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { DetailsRow } from '@/components/DetailsRow'
import { InputContainer } from '@/components/InputContainer'
import { DetailsField } from '@/components/DetailsField'

export default function VouchersPage() {
  // --------------------------- PAGE SETUP ---------------------------
  interface ICategory {
    id: number
    name: string
  }

  interface ICity {
    id: number
    name: string
  }

  interface IState {
    id: number
    name: string
  }

  interface IPartner {
    id: string
    fantasyName: string
    category: ICategory
    city: ICity
    state: IState
  }

  interface IVoucherSettingsByClient {
    clientId: string
    reservedBalanceInCents: number
  }

  interface IVoucher {
    id: string
    title: string
    description: string
    rules: string
    value: number
    voucherSettingsByClients: IVoucherSettingsByClient[]
    partner: IPartner
  }

  const { push } = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()

  const columns: ColumnDef<IVoucher>[] = [
    {
      header: `Título`,
      accessorKey: `title`
    },
    {
      header: `Valor`,
      accessorKey: `value`,
      cell: ({ row: { original: { value } } }) => (
        <span>{transformCurrencyFromCentsToBRLString(value)}</span>
      )
    },
    {
      header: `Estabelecimento`,
      accessorKey: `partner.fantasyName`,
    },
    {
      header: `Categoria`,
      accessorKey: `partner.category.name`
    },
    {
      header: `Estado`,
      accessorKey: `partner.state.name`
    }
  ]

  if (user?.roleId === ROLE.CLIENT_ADMIN) {
    columns.push(
      {
        header: `Disponível`,
        size: 2,
        accessorKey: `voucherSettingsByClients`,
        cell: ({ row: { original: { voucherSettingsByClients } } }) => {
          if (
            voucherSettingsByClients
              .find((voucherSettingsByClient) => voucherSettingsByClient.clientId === user.client?.id)
          ) {
            return <div className='flex gap-4 items-center'>
              <Check className='text-green-400 h-5'/>
            </div>
          } else {
            return <div className='flex gap-4 items-center'>
              <XIcon className='text-destructive h-5'/>
            </div>
          }
      }},
      {
        header: `Saldo Alocado`,
        size: 2,
        accessorKey: `voucherSettingsByClients`,
        cell: ({ row: { original: { voucherSettingsByClients } } }) => {
          if (
            voucherSettingsByClients
              .find((voucherSettingsByClient) => voucherSettingsByClient.clientId === user.client?.id)
          ) {
            return <div className='flex gap-4 items-center'>
              <span>
                R$ {
                  transformCurrencyFromCentsToBRLString(voucherSettingsByClients
                    .find((voucherSettingsByClient) => voucherSettingsByClient.clientId === user.client?.id)
                      ?.reservedBalanceInCents ?? 0)
                }
              </span>
            </div>
          } else {
            return <div className='flex gap-4 items-center'>
              <span>-</span>
            </div>
          }
      }},
      {
        header: `Ações`,
        size: 2,
        accessorKey: `voucherSettingsByClients`,
        cell: ({ row: { original: { id, voucherSettingsByClients } } }) => (
          <div className='flex gap-4 items-center'>
            <Button
              className=''
              onClick={() => push(`/painel/vouchers/${id}`)}
              size="icon"
              title="Visualizar Detalhes"
              variant="outline"
            >
              <Eye />
            </Button>
            <Button
              className=''
              onClick={() => startVoucherConfigurationProcess(id)}
              size="icon"
              title="Configurar voucher"
              variant="outline"
              >
              <Settings className='h-5'/>
            </Button>
            {
              voucherSettingsByClients
                .find((voucherSettingsByClient) => voucherSettingsByClient.clientId === user.client?.id) && (
                  <Button
                    className=''
                    onClick={() => startVoucherConfigurationRemovingProcess(id)}
                    size="icon"
                    title="Remover voucher"
                    variant="outline"
                    >
                    <XIcon className='text-destructive h-5' />
                  </Button>
                )
            }
          </div>
        )
      }
    )
  } else {
    columns.push(
      {
        header: `Ações`,
        size: 2,
        accessorKey: `voucherSettingsByClients`,
        cell: ({ row: { original: { id } } }) => (
          <div className='flex gap-4 items-center'>
            <Button
              className=''
              onClick={() => push(`/painel/vouchers/${id}`)}
              size="icon"
              title="Visualizar Detalhes"
              variant="outline"
            >
              <Eye />
            </Button>
          </div>
        )
      }
    )
  }

  // --------------------------- FILTER ---------------------------
  interface IFilterFormValues {
    searchInput: string
    categoryId: string
    cityId: string
    stateId: string
    statusId: string
    onlyMine: 'true' | 'false'
  }

  const FILTER_FORM_DEFAULT_VALUES: IFilterFormValues = {
    searchInput: '',
    categoryId: SELECT_DEFAULT_VALUE,
    cityId: SELECT_DEFAULT_VALUE,
    stateId: SELECT_DEFAULT_VALUE,
    statusId: '1',
    onlyMine: 'false'
  }

  const [query, setQuery] = useState<URLSearchParams | null>(null)

  const filterForm = useForm<IFilterFormValues>({
    mode: 'onSubmit',
    defaultValues: FILTER_FORM_DEFAULT_VALUES
  })

  const submitFilter = async (data: IFilterFormValues) => {
    const { searchInput, categoryId, cityId, stateId, onlyMine, statusId } = data
    const query = new URLSearchParams()

    const searchInputWithoutMask = removeSpecialCharacters(searchInput)

    if (searchInput) query.append('search-input', searchInputWithoutMask)
    if (categoryId && categoryId !== SELECT_DEFAULT_VALUE) query.append('category-id', categoryId)
    if (cityId && cityId !== SELECT_DEFAULT_VALUE) query.append('city-id', cityId)
    if (stateId && stateId !== SELECT_DEFAULT_VALUE) query.append('state-id', stateId)
    if (statusId) query.append('status-id', statusId)
    if (onlyMine === 'true' && user?.client?.id) query.append('client-id', user?.client?.id)

    setQuery(query)
    await fetchVouchers(query)
  }

  const resetFilter = () => {
    filterForm.reset(FILTER_FORM_DEFAULT_VALUES)

    setSkip(0)
    setPage(1)

    setCities([])
    fetchVouchers()
  }

  // --------------------------- FETCH VOUCHERS ---------------------------
  const [vouchers, setVouchers] = useState<IVoucher[]>([])
  const [vouchersCount, setVouchersCount] = useState<number>(0)

  const formatVoucher = (voucher: IVoucher): IVoucher => ({
    ...voucher,
    partner: {
      ...voucher.partner,
      fantasyName: captalize(voucher.partner.fantasyName),
      category: { id: voucher.partner.category.id, name: captalize(voucher.partner.category.name) },
      city: { id: voucher.partner.city.id, name: captalize(voucher.partner.city.name) },
      state: { id: voucher.partner.state.id, name: captalize(voucher.partner.state.name) },
    }
  })

  const fetchVouchers = async (query?: URLSearchParams) => {
    const response = await sendRequest<
      { vouchers: IVoucher[] }
    >({
      endpoint: `/voucher?take=${PAGINATION_LIMIT}&skip=${skip}${query ? `&${query.toString()}` : '&status-id=1'}`,
      method: 'GET',
    })

    if (response.error) {
      toast({
        description: response.message,
        variant: 'destructive'
      })

      setVouchers([])
      setVouchersCount(0)

      return
    }

    const formattedVouchers = response.data.vouchers.map((voucher) => formatVoucher(voucher))

    setVouchers(formattedVouchers)
    setVouchersCount(parseInt(response.headers[`x-total-count`]))
  }

  // --------------------------- FETCH CATEGORIES ---------------------------
  interface ICategory {
    id: number
    name: string
  }

  const [categories, setCategories] = useState<ICategory[]>([])

  const formatCategory = (category: ICategory): ICategory => ({
    ...category,
    name: captalize(category.name),
  })

  const fetchCategories = async () => {
    const response = await sendRequest<
      { categories: ICategory[] }
    >({
      endpoint: '/category',
      method: 'GET',
    })

    if (response.error) {
      toast({
        description: response.message,
        variant: 'destructive'
      })

      setCategories([])

      return
    }

    const formattedCategories = response.data.categories.map((category) => formatCategory(category))

    setCategories(formattedCategories)
  }

  // --------------------------- FETCH CITIES ---------------------------
  const selectedStateId = filterForm.watch('stateId')

  const [cities, setCities] = useState<ICity[]>([])

  const formatCity = (city: ICity): ICity => ({
    ...city,
    name: captalize(city.name),
  })

  const fetchCities = async (stateId: string) => {
    const response = await sendRequest<
      { cities: ICity[] }
    >({
      endpoint: `/city/?state-id=${stateId}`,
      method: 'GET',
    })

    if (response.error) {
      toast({
        description: response.message,
        variant: 'destructive'
      })

      setCities([])

      return
    }

    const formattedCities = response.data.cities.map((city) => formatCity(city))

    setCities(formattedCities)
  }

  // --------------------------- FETCH CLIENT ---------------------------
  interface IClientFromAPI {
    availableBalanceInCents: number
  }

  const [client, setClient] = useState<IClientFromAPI | null>(null)

  const fetchClient = async (id: string) => {
    const response = await sendRequest<{ client: IClientFromAPI }>({
      endpoint: `/client/${id}`,
      method: 'GET',
    })

    if (response.error) {
      toast({
        description: response.message,
        variant: 'destructive'
      })

      setClient(null)

      return
    }

    setClient(response.data.client)
  }

  // -------------- CLIENT-VOUCHER CONFIGURATION --------------
  const [isVoucherConfigurationDialogOpen, setIsVoucherConfigurationDialogOpen] = useState(false);
  const [voucherConfigurationBeingUpdatedId, setVoucherConfigurationBeingUpdatedId] = useState<string | null>(null)

  interface INewVoucherConfiguration {
    rechargeType: '-' | '+'
    rechargeAmountInCents: string
    waitingTimeInHours: string
  }

  const NEW_VOUCHER_CONFIGURATION_DEFAULT_VALUES: INewVoucherConfiguration = {
    rechargeType: '+',
    rechargeAmountInCents: '',
    waitingTimeInHours: WAITING_TIME_IN_HOURS_DEFAULT_VALUE.toString()
  }

  const newVoucherConfigurationForm = useForm<INewVoucherConfiguration>({
    mode: 'onSubmit',
    defaultValues: NEW_VOUCHER_CONFIGURATION_DEFAULT_VALUES
  })

  const startVoucherConfigurationProcess = (voucherId: string) => {
    setVoucherConfigurationBeingUpdatedId(voucherId)
    setIsVoucherConfigurationDialogOpen(true)
  }

  const submitVoucherConfiguration = async (newVoucherConfigurationData: INewVoucherConfiguration) => {
    const response = await sendRequest({
      endpoint: `/client/${user?.client?.id}/configure-voucher`,
      method: 'POST',
      data: {
        rechargeAmountInCents: parseInt(
          `${newVoucherConfigurationData.rechargeType}${leaveOnlyDigits(newVoucherConfigurationData.rechargeAmountInCents ?? 0)}`
        ),
        waitingTimeInHours: parseInt(newVoucherConfigurationData.waitingTimeInHours ?? WAITING_TIME_IN_HOURS_DEFAULT_VALUE),
        voucherId: voucherConfigurationBeingUpdatedId
      }
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
      variant: 'success'
    })

    fetchVouchers()
    setVoucherConfigurationBeingUpdatedId(null)
    setIsVoucherConfigurationDialogOpen(false)
  }

  // -------------- REMOVE CLIENT-VOUCHER CONFIGURATION --------------
  const [isRemoveVoucherConfigurationDialogOpen, setIsRemoveVoucherConfigurationDialogOpen] = useState(false);
  const [voucherConfigurationBeingDeletedId, setVoucherConfigurationBeingDeletedId] = useState<string | null>(null)

  const startVoucherConfigurationRemovingProcess = (voucherId: string) => {
    setVoucherConfigurationBeingDeletedId(voucherId)
    setIsRemoveVoucherConfigurationDialogOpen(true)
  }

  const submitRemoveVoucherConfiguration = async () => {
    const response = await sendRequest({
      endpoint: `/client/${user?.client?.id}/remove-voucher-configuration`,
      method: 'POST',
      data: { voucherId: voucherConfigurationBeingDeletedId }
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
      variant: 'success'
    })

    fetchVouchers()
    setVoucherConfigurationBeingDeletedId(null)
    setIsRemoveVoucherConfigurationDialogOpen(false)
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
  // Carrega lista de categorias quando a página carrega
  useEffect(() => {
    fetchCategories()
    if(user?.client?.id) fetchClient(user.client.id)
  }, [])

  // Carrega lista de parceiros quando a página carrega ou a paginação muda
  useEffect(() => {
    if (query) {
      fetchVouchers(query)
    } else fetchVouchers()
  }, [skip])

  // Carrega lista de cidades quando um estado é selecionado
  useEffect(() => {
    if (typeof selectedStateId === 'string' && selectedStateId !== SELECT_DEFAULT_VALUE) {
      fetchCities(selectedStateId)
    } else {
      filterForm.setValue('cityId', SELECT_DEFAULT_VALUE)
      setCities([])
    }
  }, [selectedStateId])

  // --------------------------- RETURN ---------------------------
  return (
    <DashboardLayout
      secondaryText={`Total: ${vouchersCount} vouchers`}
      title="Vouchers"
    >
      <div className='flex flex-row'>
        <Button type="button" onClick={() => push('/painel/vouchers/cadastrar-voucher')}>
          Cadastrar voucher
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
            <Input className='bg-white' { ...filterForm.register("searchInput") } placeholder="Nome / Categoria do Parceiro" type="text" />
          </div>

          {/* Show all or filter by client */}
          <div className="flex flex-col space-y-1.5">
            <Label className='bg-transparent text-sm' htmlFor="onlyMine">Exibir</Label>
            <FormField
              control={filterForm.control}
              name="onlyMine"
              render={({ field }) => (
                <FormItem>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-36 bg-white" disabled={!user?.client?.id}>
                        <SelectValue placeholder="Exibir" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="false">Todos</SelectItem>
                      <SelectItem value="true">Somente meus</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>

          {/* Category */}
          <div className="flex flex-col space-y-1.5">
            <Label className='bg-transparent text-sm' htmlFor="categoryId">Categoria</Label>
            <FormField
              control={filterForm.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-28 bg-white">
                        <SelectValue placeholder="Categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem key={uuid()} value={SELECT_DEFAULT_VALUE}>Todas</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={uuid()} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>

          {/* State */}
          <div className="flex flex-col space-y-1.5">
            <Label className='bg-transparent text-sm' htmlFor="stateId">Estado</Label>
            <FormField
              control={filterForm.control}
              name="stateId"
              render={({ field }) => (
                <FormItem>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-28 bg-white">
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem key={uuid()} value={(SELECT_DEFAULT_VALUE)}>Todos</SelectItem>
                        {
                          Object
                            .entries(STATE)
                            .filter(([key, _value]) => isNaN(Number(key)))
                            .map(([key, value]) => (
                              <SelectItem key={uuid()} value={value.toString()}>{key}</SelectItem>
                            )
                          )
                        }
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>

          {/* City */}
          <div className="flex flex-col space-y-1.5">
            <Label className='bg-transparent text-sm' htmlFor="cityId">Cidade</Label>
            <FormField
              control={filterForm.control}
              name="cityId"
              render={({ field }) => (
                <FormItem>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-28 bg-white">
                        <SelectValue placeholder="Cidade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem key={uuid()} value={SELECT_DEFAULT_VALUE}>Todas</SelectItem>
                      {cities.map((city) => (
                        <SelectItem key={uuid()} value={city.id.toString()}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>

          {/* Status */}
          <div className="flex flex-col space-y-1.5">
            <Label className='bg-transparent text-sm' htmlFor="statusId">Status</Label>
            <FormField
              control={filterForm.control}
              name="statusId"
              render={({ field }) => (
                <FormItem>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-28 bg-white">
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

      {/*  Configure Voucher Dialog */}
      <AlertDialog open={isVoucherConfigurationDialogOpen} onOpenChange={setIsVoucherConfigurationDialogOpen}>
        <AlertDialogContent className='max-w-[50%]'>
          <AlertDialogTitle>Disponibilizar voucher</AlertDialogTitle>
          <AlertDialogDescription>
            <Form {...newVoucherConfigurationForm}>
              <form
                className='flex flex-col gap-4'
                onSubmit={newVoucherConfigurationForm.handleSubmit((data) => submitVoucherConfiguration(data))}
              >
                <DetailsRow>
                  <span className='text-lg'>
                    <span className='font-semibold'>Saldo disponível: R$</span> {transformCurrencyFromCentsToBRLString(client?.availableBalanceInCents ?? 0)}
                  </span>
                </DetailsRow>

                <DetailsRow>
                  <InputContainer>
                    <Label htmlFor="rechargeType">Tipo</Label>
                    <FormField
                      control={newVoucherConfigurationForm.control}
                      name="rechargeType"
                      render={({ field }) => (
                        <FormItem>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className='bg-white'>
                                <SelectValue placeholder="Tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value='+'>Adicionar</SelectItem>
                              <SelectItem value='-'>Remover</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </InputContainer>
                  <InputContainer>
                    <Label htmlFor="rechargeAmountInCents">Valor da Recarga</Label>
                    <Controller
                      name="rechargeAmountInCents"
                      control={newVoucherConfigurationForm.control}
                      render={({ field }) => (
                        <Input
                          className="bg-white"
                          value={field.value}
                          onChange={(e) => field.onChange(formatCurrency(e.target.value))}
                          placeholder="00,00"
                        />
                      )}
                    />
                  </InputContainer>
                  <InputContainer>
                  <Label htmlFor="waitingTimeInHours">Tempo de espera entre utilizações</Label>
                  <FormField
                    control={newVoucherConfigurationForm.control}
                    name="waitingTimeInHours"
                    render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder="" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                          {
                            Object
                              .entries(WAITING_TIME_IN_HOURS)
                              .filter(([key, _value]) => isNaN(Number(key)))
                              .map(([key, value]) => (
                                <SelectItem key={uuid()} value={value.toString()}>{key}</SelectItem>
                              )
                            )
                          }
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </InputContainer>
                </DetailsRow>
                <AlertDialogFooter>
                  <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    className='rounded-md font-medium text-sm uppercase px-8 h-9 bg-primary text-white flex flex-col justify-center disabled:opacity-50'
                    // disabled={
                    //   newCityForm.getValues('name').length === 0
                    //   || !newCityForm.getValues('stateId')
                    // }
                    type="submit"
                  >
                    Confirmar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </form>
            </Form>
          </AlertDialogDescription>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Category Dialog */}
      <AlertDialog open={isRemoveVoucherConfigurationDialogOpen} onOpenChange={setIsRemoveVoucherConfigurationDialogOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Remover voucher?</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir esta categoria? <br />
            Após remover o voucher, o saldo alocado a ele irá retornar para o saldo disponível do cliente. <br />
            Essa ação <strong className='text-black'>não</strong> poderá ser desfeita.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel type="button" onClick={() => setIsRemoveVoucherConfigurationDialogOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className='rounded-md font-medium text-sm uppercase px-8 h-9 bg-destructive text-white flex flex-col justify-center disabled:opacity-50 hover:bg-destructive hover:opacity-90'
              onClick={submitRemoveVoucherConfiguration}
              type="button"
              >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Table */}
      <DataTable columns={columns} data={vouchers} />

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
              {`${page} de ${Math.ceil(vouchersCount/PAGINATION_LIMIT)}`}
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              disabled={vouchersCount <= page * PAGINATION_LIMIT}
              onClick={handleNextPagination}
              type="button"
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </DashboardLayout>
  )
}
