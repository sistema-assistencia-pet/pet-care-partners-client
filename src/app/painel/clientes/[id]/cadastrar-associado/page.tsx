'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useParams, useRouter } from 'next/navigation'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
import DashboardLayout from '@/components/DashboardLayout'
import { DetailsRow } from '@/components/DetailsRow'
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { InputContainer } from '@/components/InputContainer'
import InputMask from "react-input-mask"
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

const newMemberFormSchema = z.object({
  cpf: z
    .string({ required_error: 'O campo CPF é obrigatório.' })
    .min(11, { message: 'O campo CPF deve ter pelo menos 11 caracteres.' })
    .max(14, { message: 'O campo CPF deve ter no máximo 14 caracteres.' }),
  name: z
    .string({ required_error: 'O campo Nome é obrigatório.' })
    .min(3, {  message: 'O campo Nome deve ter pelo menos 3 caracteres.' }),
  email: z
    .string({ required_error: 'O campo E-mail é obrigatório.' })
    .email({ message: 'O campo E-mail deve ser um e-mail válido.' }),
  phoneNumber: z
    .string({ required_error: 'O campo Telefone é obrigatório.' })
    .min(10, { message: 'O campo Telefone deve ter pelo menos 10 caracteres.' }),
  birthDate: z
    .string({ required_error: 'O campo Data de Nascimento é obrigatório.' })
    .length(10, { message: 'O campo Data de Nascimento deve ter pelo menos 10 caracteres.' }),
  cep: z
    .string({ required_error: 'O campo CEP é obrigatório.' })
    .length(9, { message: 'O campo CEP deve ter pelo menos 9 caracteres.' }),
  clientId: z
    .string({ required_error: 'O campo ID do Cliente é obrigatório.' })
    .uuid({ message: 'O campo ID do Cliente deve ser um UUID válido.' }),
  statusId: z.coerce
    .number({ required_error: 'O campo Status é obrigatório.' })
    .gte(1, { message: 'O campo Status deve 1 (ativo), 2 (inativo) ou 3 (excluído).' })
    .lte(3, { message: 'O campo Status deve 1 (ativo), 2 (inativo) ou 3 (excluído).' })
})

type NewMemberFormSchema = z.infer<typeof newMemberFormSchema>

const NEW_MEMBER_FORM_DEFAULT_VALUES: NewMemberFormSchema = {
  cpf: '',
  name: '',
  email: '',
  phoneNumber: '',
  birthDate: '',
  cep: '',
  clientId: '',
  statusId: STATUS.Ativo
}

export default function RegisterMember() {
  const form = useForm<NewMemberFormSchema>({
    mode: 'onBlur',
    defaultValues: NEW_MEMBER_FORM_DEFAULT_VALUES,
    resolver: zodResolver(newMemberFormSchema)
  })

  const params = useParams()
  const { back } = useRouter()
  const { toast } = useToast()

  const formatNewMemberData = (newMemberData: NewMemberFormSchema): NewMemberFormSchema => ({
    ...newMemberData,
    cpf: newMemberData.cpf.replaceAll('.', '').replace('-', '').replaceAll('_', ''),
    phoneNumber: newMemberData.phoneNumber.replace('(', '').replace(')', '').replace('-', '').replace(' ', '').replaceAll('_', ''),
    birthDate: newMemberData.birthDate.split('/').reverse().join('-').replaceAll('_', ''),
    cep: newMemberData.cep.replaceAll('-', '').replaceAll('_', '')
  })

  const postMember = async (newMemberData: NewMemberFormSchema) => {
    const formattedNewMemberData = formatNewMemberData(newMemberData)
    
    const response = await sendRequest({
      endpoint: '/member',
      method: 'POST',
      data: formattedNewMemberData
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
      form.setValue('clientId', params.id as string)
    }
  }, [])
  return (
    <DashboardLayout title="Cadastrar Novo Associado">
      <Form { ...form }>
        <form
          className='flex flex-col my-4 gap-4'
          onSubmit={form.handleSubmit((data) => postMember(data))}
        >
          <DetailsRow>
            <InputContainer size="w-1/2">
              <Label htmlFor="name">Nome</Label>
              <Input className="bg-white" { ...form.register("name") } />
              {
                form.formState.errors.name
                  && <span className="text-red-500 text-xs">{form.formState.errors.name.message}</span>
              }
            </InputContainer>
            <InputContainer size="w-1/4">
              <Label htmlFor="cpf">CPF</Label>
              <InputMask
                className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                mask="999.999.999-99"
                { ...form.register("cpf",) }
              />
              {
                form.formState.errors.cpf
                  && <span className="text-red-500 text-xs">{form.formState.errors.cpf.message}</span>
              }
            </InputContainer>
            <InputContainer size="w-1/4">
              <Label htmlFor="birthDate">Data de Nascimento</Label>
              <InputMask
                className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                mask="99/99/9999"
                { ...form.register("birthDate",) }
              />
              {
                form.formState.errors.birthDate
                  && <span className="text-red-500 text-xs">{form.formState.errors.birthDate.message}</span>
              }
            </InputContainer>
          </DetailsRow>

          <DetailsRow>
            <InputContainer size="w-1/4">
              <Label htmlFor="cep">CEP</Label>
              <InputMask
                className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                mask="99999-999"
                { ...form.register("cep",) }
              />
              {
                form.formState.errors.cep
                  && <span className="text-red-500 text-xs">{form.formState.errors.cep.message}</span>
              }
            </InputContainer>
            <InputContainer size="w-1/4">
              <Label htmlFor="email">E-mail</Label>
              <Input className="bg-white" { ...form.register("email") } />
              {
                form.formState.errors.email
                  && <span className="text-red-500 text-xs">{form.formState.errors.email.message}</span>
              }
            </InputContainer>
            <InputContainer size="w-1/4">
              <Label htmlFor="phoneNumber">Telefone</Label>
              <InputMask
                className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                mask="(99) 99999-9999"
                { ...form.register("phoneNumber",) }
              />
              {
                form.formState.errors.phoneNumber
                  && <span className="text-red-500 text-xs">{form.formState.errors.phoneNumber.message}</span>
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
          </DetailsRow>

          <Button className="my-4" disabled={!form.formState.isValid} type='submit'>
            Cadastrar Associado
          </Button>
        </form>
      </Form>
    </DashboardLayout>
  )
}
