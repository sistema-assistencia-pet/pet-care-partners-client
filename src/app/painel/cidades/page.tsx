'use client'

import { type ColumnDef } from "@tanstack/react-table"
import { useForm } from 'react-hook-form'
import { useEffect, useState } from 'react'
import { v4 as uuid } from 'uuid'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from '@/components/ui/button'
import DashboardLayout from '@/components/DashboardLayout'
import { DataTable } from '../../../components/DataTable'
import { FilterX, Pencil, Trash } from 'lucide-react'
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
import { PAGINATION_LIMIT, SELECT_DEFAULT_VALUE } from '@/lib/constants'
import { sendRequest } from '@/lib/sendRequest'
import { STATE } from '@/lib/enums'
import { useToast } from '@/components/ui/use-toast'

export default function CitiesPage() {
  // --------------------------- PAGE SETUP ---------------------------
  interface ICity {
    id: number
    name: string
    stateId: number
  }
  
  interface ICityToBeDisplayed {
    id: number
    name: string
    state: string
  }

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
        <div className='flex gap-4'>
          <Button
            className=''
            onClick={() => startCityUpdateProcess(id)}
            size="icon"
            title="Editar cidade"
            variant="outline"
            >
            <Pencil />
          </Button>
          <Button
            className=''
            onClick={() => startCityDeleteProcess(id)}
            size="icon"
            title="Excluir cidade"
            variant="destructive"
            >
            <Trash />
          </Button>
        </div>
      )
    }
  ]

  // --------------------------- FILTER ---------------------------
  interface IFilterFormValues {
    searchInput: string
    stateId: string
  }

  const FILTER_FORM_DEFAULT_VALUES: IFilterFormValues = {
    searchInput: '',
    stateId: SELECT_DEFAULT_VALUE
  }

  const [query, setQuery] = useState<URLSearchParams | null>(null)

  const filterForm = useForm<IFilterFormValues>({
    mode: 'onSubmit',
    defaultValues: FILTER_FORM_DEFAULT_VALUES
  })

  const submitFilter = async (data: IFilterFormValues) => {
    const { searchInput, stateId } = data
    const query = new URLSearchParams()

    if (searchInput) query.append('search-input', searchInput)
    if (stateId && stateId != SELECT_DEFAULT_VALUE) query.append('state-id', stateId)

    setQuery(query)
    await fetchCities(query)
  }

  const resetFilter = () => {
    filterForm.reset(FILTER_FORM_DEFAULT_VALUES)
    setQuery(null)

    setSkip(0)
    setPage(1)

    fetchCities()
  }

  // --------------------------- FETCH CITIES ---------------------------
  const [cities, setCities] = useState<ICityToBeDisplayed[]>([])
  const [citiesCount, setCitiesCount] = useState<number>(0)

  const formatCities = (cities: ICity[]): ICityToBeDisplayed[] => {
    return cities.map((city) => {
      return {
        id: city.id ?? '',
        name: city.name ?? '',
        state: STATE[city.stateId] ?? ''
      }
    })
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

  // --------------------------- CREATE CITY ---------------------------
  interface INewCityFormValues {
    name: string
    stateId: string
  }
  
  const NEW_CITY_FORM_DEFAULT_VALUES: INewCityFormValues = {
    name: '',
    stateId: SELECT_DEFAULT_VALUE
  }

  const newCityForm = useForm<INewCityFormValues>({
    mode: 'onSubmit',
    defaultValues: NEW_CITY_FORM_DEFAULT_VALUES
  })

  const submitNewCity = async (data: INewCityFormValues) => {
    const { name, stateId } = data
    const query = new URLSearchParams()

    if (name) query.append('search-input', name)
    if (stateId && stateId != SELECT_DEFAULT_VALUE) query.append('state-id', stateId)

    const response = await sendRequest<{ cityId: string }>({
      endpoint: '/city',
      method: 'POST',
      data: { name, stateId }
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

    fetchCities()
    newCityForm.reset(NEW_CITY_FORM_DEFAULT_VALUES)
  }

  // --------------------------- UPDATE CITY ---------------------------
  const [cityToBeUpdatedName, setCityToBeUpdatedName] = useState<string>('')
  const [isUpdateCityDialogOpen, setIsUpdateCityDialogOpen] = useState(false);
  const [cityBeingUpdatedId, setCityBeingUpdatedId] = useState<number | null>(null)

  const startCityUpdateProcess = (cityId: number) => {
    setCityBeingUpdatedId(cityId)
    setIsUpdateCityDialogOpen(true)
  }

  const submitUpdatedCity = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const response = await sendRequest<{ city: ICity }>({
      endpoint: `/city/${cityBeingUpdatedId}`,
      method: 'PATCH',
      data: { name: cityToBeUpdatedName }
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

    fetchCities()
    setCityToBeUpdatedName('')
    setCityBeingUpdatedId(null)
    setIsUpdateCityDialogOpen(false)
  }

  // --------------------------- DELETE CITY ---------------------------
  const [isDeleteCityDialogOpen, setIsDeleteCityDialogOpen] = useState(false);
  const [cityBeingDeletedId, setCityBeingDeletedId] = useState<number | null>(null)

  const startCityDeleteProcess = (cityId: number) => {
    setCityBeingDeletedId(cityId)
    setIsDeleteCityDialogOpen(true)
  }

  const submitDeleteCity = async () => {
    const response = await sendRequest<{ city: ICity }>({
      endpoint: `/city/${cityBeingDeletedId}`,
      method: 'DELETE'
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

    fetchCities()
    setCityBeingDeletedId(null)
    setIsDeleteCityDialogOpen(false)
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
  // Carrega lista de cidades quando a página carrega ou a paginação muda
  useEffect(() => {
    if (query) {
      fetchCities(query)
    } else fetchCities()
  }, [skip])

  // --------------------------- RETURN ---------------------------
  return (
    <DashboardLayout
      secondaryText={`Total: ${citiesCount} cidades`}
      title="Cidades"
    >
      {/* Add City Dialog */}
      <div className="flex justify-between w-full">
        <AlertDialog>
          <AlertDialogTrigger className='rounded-md font-medium text-sm uppercase px-8 h-9 bg-primary text-white flex flex-col justify-center'>
            Cadastrar cidade
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Cadastrar cidade</AlertDialogTitle>
            <AlertDialogDescription>
              <Form {...newCityForm}>
                <form
                  className='flex flex-col gap-4'
                  onSubmit={newCityForm.handleSubmit((data) => submitNewCity(data))}
                >
                  <div className="flex flex-col space-y-1.5 bg-white">
                    {/* name input */}
                    <div className="flex flex-col grow space-y-1.5 bg-white">
                      <Input { ...newCityForm.register("name") } placeholder="Nome da cidade" type="text" />
                    </div>

                    {/* state */}
                    <div className="flex flex-col space-y-1.5 bg-white">
                      <FormField
                        control={newCityForm.control}
                        name="stateId"
                        render={({ field }) => (
                          <FormItem>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="w-28">
                                  <SelectValue placeholder="Estado" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
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
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      className='rounded-md font-medium text-sm uppercase px-8 h-9 bg-primary text-white flex flex-col justify-center disabled:opacity-50'
                      disabled={
                        newCityForm.getValues('name').length === 0
                        || !newCityForm.getValues('stateId')
                      }
                      type="submit"
                    >
                      Cadastrar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </form>
              </Form>
            </AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Update City Dialog */}
      <AlertDialog open={isUpdateCityDialogOpen} onOpenChange={setIsUpdateCityDialogOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Editar cidade</AlertDialogTitle>
          <form
            className='flex flex-col gap-4'
            onSubmit={submitUpdatedCity}
            >
            <div className="flex flex-col space-y-1.5 bg-white">
              <Label
                htmlFor="update-city-name-input"
                >
                Nome da cidade
              </Label>
              <Input
                id="update-city-name-input"
                onChange={({ target: { value } }) => setCityToBeUpdatedName(value)}
                type="text"
                value={cityToBeUpdatedName}
                />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel type="button" onClick={() => setIsUpdateCityDialogOpen(false)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className='rounded-md font-medium text-sm uppercase px-8 h-9 bg-primary text-white flex flex-col justify-center disabled:opacity-50'
                disabled={!cityToBeUpdatedName.length}
                type="submit"
                >
                Enviar
              </AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete City Dialog */}
      <AlertDialog open={isDeleteCityDialogOpen} onOpenChange={setIsDeleteCityDialogOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Excluir cidade</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir esta cidade? <br />
            Essa ação <strong className='text-black'>não</strong> poderá ser desfeita.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel type="button" onClick={() => setIsUpdateCityDialogOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className='rounded-md font-medium text-sm uppercase px-8 h-9 bg-destructive hover:bg-destructive hover:opacity-90 text-white flex flex-col justify-center disabled:opacity-50'
              onClick={submitDeleteCity}
              type="button"
              >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
              className="bg-white"
              placeholder="Nome da cidade" type="text"
            />
          </div>

          {/* State */}
          <div className="flex flex-col space-y-1.5 bg-white">
            <FormField
              control={filterForm.control}
              name="stateId"
              render={({ field }) => (
                <FormItem>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-28">
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
      <DataTable columns={columns} data={cities} />

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
