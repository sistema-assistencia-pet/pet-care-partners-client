'use client'

import { type ColumnDef } from "@tanstack/react-table"
import React, { useEffect, useState } from 'react'

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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pencil, Trash } from 'lucide-react'
import { sendRequest } from '@/lib/sendRequest'
import { useToast } from '@/components/ui/use-toast'

interface ICategory {
  id: number
  name: string
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<ICategory[]>([])
  const [categoriesCount, setCategoriesCount] = useState<number>(0)
  const [newCategoryName, setNewCategoryName] = useState<string>('')
  const [categoryToBeUpdatedName, setCategoryToBeUpdatedName] = useState<string>('')
  const [isUpdateCategoryDialogOpen, setIsUpdateCategoryDialogOpen] = useState(false);
  const [categoryBeingUpdatedId, setCategoryBeingUpdatedId] = useState<number | null>(null)
  const [isDeleteCategoryDialogOpen, setIsDeleteCategoryDialogOpen] = useState(false);
  const [categoryBeingDeletedId, setCategoryBeingDeletedId] = useState<number | null>(null)

  const { toast } = useToast()

  const columns: ColumnDef<ICategory>[] = [
    {
      header: `Nome`,
      accessorKey: `name`,
    },
    {
      header: `Ações`,
      accessorKey: `id`,
      cell: ({ row: { original: { id } } }) => (
        <div className='flex gap-4'>
          <Button
            className=''
            onClick={() => startCategoryUpdateProcess(id)}
            size="icon"
            title="Editar categoria"
            variant="outline"
            >
            <Pencil />
          </Button>
          <Button
            className=''
            onClick={() => startCategoryDeleteProcess(id)}
            size="icon"
            title="Excluir categoria"
            variant="destructive"
            >
            <Trash />
          </Button>
        </div>
      )
    }
  ]

  const fetchCategories = async () => {
    const response = await sendRequest<{ categories: ICategory[] }>({
      endpoint: '/category',
      method: 'GET',
    })

    if (response.error) {
      toast({
        description: response.message,
        variant: 'destructive'
      })

      setCategories([])
      setCategoriesCount(0)

      return
    }

    setCategories(response.data.categories)
    setCategoriesCount(parseInt(response.headers[`x-total-count`]))
  }

  const submitNewCategory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const response = await sendRequest<{ categoryId: string }>({
      endpoint: '/category',
      method: 'POST',
      data: { name: newCategoryName }
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

    fetchCategories()
    setNewCategoryName('')
  }

  const startCategoryUpdateProcess = (categoryId: number) => {
    setCategoryBeingUpdatedId(categoryId)
    setIsUpdateCategoryDialogOpen(true)
  }

  const submitUpdatedCategory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const response = await sendRequest<{ category: ICategory }>({
      endpoint: `/category/${categoryBeingUpdatedId}`,
      method: 'PATCH',
      data: { name: categoryToBeUpdatedName }
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

    fetchCategories()
    setCategoryToBeUpdatedName('')
    setCategoryBeingUpdatedId(null)
    setIsUpdateCategoryDialogOpen(false)
  }

  const startCategoryDeleteProcess = (categoryId: number) => {
    setCategoryBeingDeletedId(categoryId)
    setIsDeleteCategoryDialogOpen(true)
  }

  const submitDeleteCategory = async () => {
    const response = await sendRequest<{ category: ICategory }>({
      endpoint: `/category/${categoryBeingDeletedId}`,
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

    fetchCategories()
    setCategoryBeingDeletedId(null)
    setIsDeleteCategoryDialogOpen(false)
  }

  // Carrega lista de categorias
  useEffect(() => {
    fetchCategories()
  }, [])

  return (
    <DashboardLayout
      secondaryText={`Total: ${categoriesCount} categorias`}
      title="Categorias"
    >

      {/* Add Category Dialog */}
      <div className="flex justify-between w-full">
        <AlertDialog>
          <AlertDialogTrigger className='rounded-md font-medium text-sm uppercase px-8 h-9 bg-primary text-white flex flex-col justify-center'>
            Cadastrar categoria
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Cadastrar categoria</AlertDialogTitle>
            <AlertDialogDescription>
                <form
                  className='flex flex-col gap-4'
                  onSubmit={submitNewCategory}
                >
                  <div className="flex flex-col space-y-1.5 bg-white">
                    <Label
                      htmlFor="category-name-input"
                    >
                      Nome da categoria
                    </Label>
                    <Input
                      id="category-name-input"
                      onChange={({ target: { value } }) => setNewCategoryName(value)}
                      type="text"
                      value={newCategoryName}
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      className='rounded-md font-medium text-sm uppercase px-8 h-9 bg-primary text-white flex flex-col justify-center disabled:opacity-50'
                      disabled={!newCategoryName.length}
                      type="submit"
                    >
                      Cadastrar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </form>
            </AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Update Category Dialog */}
      <AlertDialog open={isUpdateCategoryDialogOpen} onOpenChange={setIsUpdateCategoryDialogOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Editar categoria</AlertDialogTitle>
          <form
            className='flex flex-col gap-4'
            onSubmit={submitUpdatedCategory}
            >
            <div className="flex flex-col space-y-1.5 bg-white">
              <Label
                htmlFor="update-category-name-input"
                >
                Nome da categoria
              </Label>
              <Input
                id="update-category-name-input"
                onChange={({ target: { value } }) => setCategoryToBeUpdatedName(value)}
                type="text"
                value={categoryToBeUpdatedName}
                />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel type="button" onClick={() => setIsUpdateCategoryDialogOpen(false)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className='rounded-md font-medium text-sm uppercase px-8 h-9 bg-primary text-white flex flex-col justify-center disabled:opacity-50'
                disabled={!categoryToBeUpdatedName.length}
                type="submit"
                >
                Enviar
              </AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Category Dialog */}
      <AlertDialog open={isDeleteCategoryDialogOpen} onOpenChange={setIsDeleteCategoryDialogOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Excluir categoria</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir esta categoria? <br />
            Essa ação não poderá ser desfeita.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel type="button" onClick={() => setIsUpdateCategoryDialogOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className='rounded-md font-medium text-sm uppercase px-8 h-9 bg-primary text-white flex flex-col justify-center disabled:opacity-50'
              onClick={submitDeleteCategory}
              type="button"
              >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* table */}
      <DataTable columns={columns} data={categories} />

    </DashboardLayout>
  )
}
