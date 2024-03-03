'use client'

import { FieldValues, useForm } from 'react-hook-form'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import DashboardLayout from '@/components/DashboardLayout'
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
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
import { useParams } from 'next/navigation'

export default function ClientDetailsPage() {
  // const form = useForm<IFormValues>({
  //   mode: 'onSubmit',
  //   defaultValues: FORM_FILTER_DEFAULT_VALUES
  // })

  const params = useParams()
  console.log(params)
  const { toast } = useToast()

  // const fetchClients = async (query?: URLSearchParams) => {
  //   const response = await sendRequest<{ clients: Array<{ statusId: number } & Omit<IClient, 'status'>> }>({
  //     endpoint: `/client?take=${PAGINATION_LIMIT}&skip=${skip}${query ? `&${query.toString()}` : '&status-id=1'}`,
  //     method: 'GET',
  //   })

  //   if (response.error) {
  //     toast({
  //       description: response.message,
  //       variant: 'destructive'
  //     })

  //     setClients([])
  //     setClientsCount(0)

  //     return
  //   }

  //   toast({
  //     description: response.message
  //   })

  //   const formattedClients = response.data.clients.map((client) => formatClient(client))

  //   setClients(formattedClients)
  //   setClientsCount(parseInt(response.headers[`x-total-count`]))
  // }

  return (
    <DashboardLayout title="Cadastrar novo cliente">
      {/* <Form { ...form }>
        <form
          className='flex flex-row my-4 gap-4'
          onSubmit={form.handleSubmit((data) => submitFilter(data))}
        >
          <div className="flex flex-col grow space-y-1.5 bg-white">
            <Input { ...form.register("cnpj") } placeholder="CNPJ" type="text" />
          </div>
          <div className="flex flex-col grow space-y-1.5 bg-white">
            <Input { ...form.register("fantasyName") } placeholder="Nome Fantasia" type="text" />
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
      </Form> */}
    </DashboardLayout>
  )
}
