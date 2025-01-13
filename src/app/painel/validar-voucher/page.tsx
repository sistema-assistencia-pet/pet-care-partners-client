'use client'

import { useForm } from 'react-hook-form'
import { useState } from 'react'

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import DashboardLayout from '@/components/DashboardLayout'
import { FilterX } from 'lucide-react'
import { Form } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { InputContainer } from '@/components/InputContainer'
import InputMask from "react-input-mask"
import { Label } from '@/components/ui/label'
import { removeCpfMask } from '@/lib/utils'
import { sendRequest } from '@/lib/sendRequest'


export default function MembersPage() {
  // --------------------------- VALIDATE ---------------------------
  interface IFormValues {
    memberCpf: string
    code: string
  }

  const FORM_DEFAULT_VALUES: IFormValues = {
    memberCpf: '',
    code: ''
  }

  const filterForm = useForm<IFormValues>({
    mode: 'onSubmit',
    defaultValues: FORM_DEFAULT_VALUES
  })

  const validate = async (data: IFormValues) => {
    const { code, memberCpf } = data

    const response = await sendRequest({
      endpoint: `/voucher-code/validate`,
      method: 'POST',
      data: {
        code: code.trim(),
        memberCpf: removeCpfMask(memberCpf.trim())
      }
    })

    setMessage(response.message)

    if (response.error) {
      setIsErrorDialogOpen(true)
    } else {
      setIsSuccessDialogOpen(true)
      setMessage(response.message)
    }
  }

  const resetValidationForm = () => {
    filterForm.reset(FORM_DEFAULT_VALUES)
  }

  // --------------------------- DIALOG ---------------------------
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState<boolean>(false)
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState<boolean>(false)
  const [message, setMessage] = useState<string>('')

  // --------------------------- RETURN ---------------------------
  return (
    <DashboardLayout title="Validar voucher">

      {/* Validate */}
      <Form { ...filterForm }>
        <form
          className='flex flex-row gap-4 items-end'
          onSubmit={filterForm.handleSubmit((data) => validate(data))}
        >

          {/* MEMBER CPF */}
          <InputContainer size="w-1/4">
            <Label htmlFor="memberCpf">CPF do Associado</Label>
            <InputMask
              className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              mask="999.999.999-99"
              required
              { ...filterForm.register("memberCpf",) }
            />
          </InputContainer>
          <InputContainer size="w-1/4">
            <Label className='bg-transparent text-sm' htmlFor="code">Código do Voucher</Label>
            <Input
              { ...filterForm.register("code") }
              className='bg-white'
              required
              type="text"
            />
          </InputContainer>

          {/* Buttons */}
          <Button
            className="w-28"
            type='submit'
          >
            Validar
          </Button>
          <Button
            className="min-w-9 h-9 p-0"
            onClick={resetValidationForm}
            title="Limpar filtros"
            type='button'
            variant="outline"
          >
            <FilterX className="w-5 h-5"/>
          </Button>
        </form>
      </Form>

      {/* Success Dialog */}
      <AlertDialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Pronto!</AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="bg-green-500 hover:bg-green-400 text-white hover:text-white"
              type="button"
              onClick={() => setIsSuccessDialogOpen(false)}
            >
              Fechar
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Error Dialog */}
      <AlertDialog open={isErrorDialogOpen} onOpenChange={setIsErrorDialogOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Falha...</AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="bg-red-500 hover:bg-red-400 text-white hover:text-white"
              type="button"
              onClick={() => setIsErrorDialogOpen(false)}
            >
              Fechar
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </DashboardLayout>
  )
}
