'use client'

import CurrencyInput from 'react-currency-input-field'
import InputMask from "react-input-mask"
import { useForm, useFieldArray } from 'react-hook-form'
import { useParams, useRouter } from 'next/navigation'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
import DashboardLayout from '@/components/DashboardLayout'
import { DetailsRow } from '@/components/DetailsRow'
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { InputContainer } from '@/components/InputContainer'
import { Label } from '@/components/ui/label'
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
import { useEffect } from 'react'
import { Minus, Plus } from 'lucide-react'

const newOrderItemFormSchema = z.object({
  medicineName: z
    .string({ required_error: 'O campo Nome do Medicamento é obrigatório.' })
    .min(1, { message: 'O campo Nome do Medicamento deve ter pelo menos 1 caracter.' }),
  medicineType: z
    .string({ required_error: 'O campo Tipo do Medicamento é obrigatório.' })
    .min(1, { message: 'O campo Tipo do Medicamento deve ter pelo menos 1 caracter.' }),
  quantity: z
    .number({ required_error: 'O campo Quantidade é obrigatório.' })
    .gte(1, { message: 'O campo Quantidade deve ser maior ou igual a 1.' }),
  listPrice: z.coerce
    .number({ required_error: 'O campo Valor de Tabela é obrigatório.' })
    .gte(0, { message: 'O campo Valor de Tabela deve ser maior ou igual a 0.' }),
  discountPrice: z.coerce
    .number({ required_error: 'O campo Valor com Desconto é obrigatório.' })
    .gte(0, { message: 'O campo Valor com Desconto deve ser maior ou igual a 0.' })
})

type NewOrderItemFormSchema = z.infer<typeof newOrderItemFormSchema>

const newOrderFormSchema = z.object({
  memberId: z
    .string({ required_error: 'O campo ID do Associado é obrigatório.' })
    .uuid({ message: 'O campo ID do Associado deve ser um UUID válido.' }),
  statusId: z.coerce
    .number({ required_error: 'O campo Status é obrigatório.' })
    .gte(1, { message: 'O campo Status deve 1 (ativo), 2 (inativo) ou 3 (excluído).' })
    .lte(3, { message: 'O campo Status deve 1 (ativo), 2 (inativo) ou 3 (excluído).' }),
  totalValue: z.coerce
    .number({ required_error: 'O campo Valor Total é obrigatório.' })
    .gte(0, { message: 'O campo Valor Total deve ser maior ou igual a 0.' }),
  totalSavings: z.coerce
    .number({ required_error: 'O campo Economia Total é obrigatório.' })
    .gte(0, { message: 'O campo Economia Total deve ser maior ou igual a 0.' }),
  isRecurring: z.coerce
    .boolean({ required_error: 'O campo Compra Recorrente é obrigatório.' }),
  items: z.array(newOrderItemFormSchema)
}).refine((fields) => fields.items.length > 0, {
  path: ['items'],
  message: 'Deve haver pelo menos um item no pedido.'
}).refine((fields) => fields.totalValue = fields.items.reduce(
  (acc, item) => acc + item.listPrice, 0
))

type NewOrderFormSchema = z.infer<typeof newOrderFormSchema>

const NEW_ITEM_FORM_DEFAULT_VALUES: NewOrderItemFormSchema = {
  medicineName: '',
  medicineType: '',
  quantity: 1,
  listPrice: 0,
  discountPrice: 0
}

const NEW_ORDER_FORM_DEFAULT_VALUES: NewOrderFormSchema = {
  memberId: '',
  statusId: STATUS.Ativo,
  totalValue: 0,
  totalSavings: 0,
  isRecurring: false,
  items: []
}

export default function RegisterOrder() {
  const form = useForm<NewOrderFormSchema>({
    mode: 'onBlur',
    defaultValues: NEW_ORDER_FORM_DEFAULT_VALUES,
    resolver: zodResolver(newOrderFormSchema)
  })

  const { append, fields, remove } = useFieldArray({
    control: form.control,
    name: 'items'
  })

  const params = useParams()
  const { back } = useRouter()
  const { toast } = useToast()

  const postOrder = async (newOrderData: NewOrderFormSchema) => {
    const response = await sendRequest({
      endpoint: '/order',
      method: 'POST',
      data: newOrderData
    })

    if (response.error) {
      toast({
        description: response.message,
        variant: 'destructive'
      })
    } else {
      toast({
        description: response.message,
        variant: 'success'
      })
    }

  back()
  }

  useEffect(() => {
    if (params.id) {
      form.setValue('memberId', params.id as string)
    }
  }, [])
  return (
    <DashboardLayout title="Cadastrar Novo Pedido">
      <Form { ...form }>
        <form
          className='flex flex-col my-4 gap-4'
          onSubmit={form.handleSubmit((data) => console.log(data))}
        >
          <DetailsRow>
            <InputContainer size="w-1/4">
              <Label htmlFor="isRecurring">Compra recorrente</Label>
              <FormField
                control={form.control}
                name="isRecurring"
                render={({ field }) => (
                  <FormItem>
                    <Select onValueChange={field.onChange} defaultValue={field.value.toString()}>
                      <FormControl>
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="false">Não</SelectItem>
                        <SelectItem value="true">Sim</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              {
                form.formState.errors.isRecurring
                  && <span className="text-red-500 text-xs">{form.formState.errors.isRecurring.message}</span>
              }
            </InputContainer>
            <InputContainer size="w-1/4">
              <Label htmlFor="statusId">Status</Label>
              <FormField
                control={form.control}
                name="statusId"
                render={({ field }) => (
                  <FormItem>
                    <Select onValueChange={field.onChange} defaultValue={field.value.toString()}>
                      <FormControl>
                        <SelectTrigger className="bg-white">
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
              {
                form.formState.errors.statusId
                  && <span className="text-red-500 text-xs">{form.formState.errors.statusId.message}</span>
              }
            </InputContainer>
            <InputContainer  size="w-1/4">
              <Label htmlFor="totalValue">Valor Total</Label>
              <CurrencyInput
                { ...form.register("totalValue") }
                className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                allowNegativeValue={false}
                disabled
                fixedDecimalLength={2}
                disableGroupSeparators={true}
              />
              {
                form.formState.errors.totalValue
                  && <span className="text-red-500 text-xs">{form.formState.errors.totalValue.message}</span>
              }
            </InputContainer>
            <InputContainer  size="w-1/4">
              <Label htmlFor="totalSavings">Valor com Desconto</Label>
              <CurrencyInput
                { ...form.register("totalSavings") }
                className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                allowNegativeValue={false}
                disabled
                fixedDecimalLength={2}
                disableGroupSeparators={true}
              />
              {
                form.formState.errors.totalSavings
                  && <span className="text-red-500 text-xs">{form.formState.errors.totalSavings.message}</span>
              }
            </InputContainer>
          </DetailsRow>

          <DetailsRow>
            <Label>Items do pedido:</Label>
          </DetailsRow>
          {
            fields.map((field, index) => (
              <div className='flex bg-white p-4 rounded-md border flex-col my-4 gap-4' key={field.id}>
                <DetailsRow>
                  <InputContainer size="w-1/2">
                    <Label htmlFor={`items.${index}.medicineName`}>Nome do Medicamento</Label>
                    <Input className="bg-background" { ...form.register(`items.${index}.medicineName`) } />
                    {
                      form.formState.errors.items
                        && <span className="text-red-500 text-xs">{form.formState.errors.items[index]?.medicineName?.message ?? ''}</span>
                    }
                  </InputContainer>
                  <InputContainer size="w-1/2">
                    <Label htmlFor={`items.${index}.medicineType`}>Tipo do Medicamento</Label>
                    <Input className="bg-background" { ...form.register(`items.${index}.medicineType`) } />
                    {
                      form.formState.errors.items
                        && <span className="text-red-500 text-xs">{form.formState.errors.items[index]?.medicineType?.message}</span>
                    }
                  </InputContainer>
                </DetailsRow>
                <DetailsRow>
                  <InputContainer size="w-1/3">
                    <Label htmlFor={`items.${index}.quantity`}>Quantidade</Label>
                    <Input className="bg-background" { ...form.register(`items.${index}.quantity`, { valueAsNumber: true }) } type="number" />
                    {
                      form.formState.errors.items
                        && <span className="text-red-500 text-xs">{form.formState.errors.items[index]?.quantity?.message}</span>
                    }
                  </InputContainer>
                  <InputContainer size="w-1/3">
                    <Label htmlFor={`items.${index}.listPrice`}>Valor de Tabela</Label>
                    <CurrencyInput
                      { ...form.register(`items.${index}.listPrice`) }
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      allowNegativeValue={false}
                      fixedDecimalLength={2}
                      disableGroupSeparators={true}
                      placeholder="00.00"
                      onChange={(event) => {form.setValue('totalValue', parseFloat(parseFloat(event.target.value || '0').toFixed(2)))}} // TODO: verificar 
                    />
                    {
                      form.formState.errors.items
                        && <span className="text-red-500 text-xs">{form.formState.errors.items[index]?.listPrice?.message}</span>
                    }
                  </InputContainer>
                  <InputContainer size="w-1/3">
                    <Label htmlFor={`items.${index}.discountPrice`}>Valor com Desconto</Label>
                    <CurrencyInput
                      { ...form.register(`items.${index}.discountPrice`) }
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      allowNegativeValue={false}
                      fixedDecimalLength={2}
                      disableGroupSeparators={true}
                      placeholder="00.00"
                    />
                    {
                      form.formState.errors.items
                        && <span className="text-red-500 text-xs">{form.formState.errors.items[index]?.discountPrice?.message}</span>
                    }
                  </InputContainer>
                </DetailsRow>

                {
                  form.formState.errors.items
                    && <span className="text-red-500 text-xs">{form.formState.errors.items?.message}</span>
                }
                <div>
                  <Button
                    className="gap-4 mt-4"
                    onClick={() => remove(index)}
                    type='button'
                    variant="destructive"
                  >
                    <Minus /> Remover item
                  </Button>
                </div>
              </div>
            ))
          }

          <div>
            <Button
              className="gap-4 mt-4"
              onClick={() => append(NEW_ITEM_FORM_DEFAULT_VALUES)}
              type='button'
              variant="secondary"
            >
              <Plus /> Adicionar item
            </Button>
          </div>

          <Button className="my-4" disabled={!form.formState.isValid} type='submit'>
            Cadastrar Pedido
          </Button>
        </form>
      </Form>
    </DashboardLayout>
  )
}
