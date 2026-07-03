import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FiPlus, FiSearch } from 'react-icons/fi';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { Field, Input, Select, Checkbox, Button, Badge } from '../../components/FormControls';
import * as categoriesApi from '../../api/categories';
import { toastSuccess, toastError, confirmDelete, apiErrorMessage } from '../../lib/alerts';

const schema = z.object({
  namePt: z.string().min(2, 'Required, min 2 characters'),
  nameEn: z.string().optional(),
  icon: z.string().optional(),
  image: z.string().optional(),
  parent: z.string().optional(),
  sortOrder: z.coerce.number().int().optional(),
  isActive: z.boolean().optional(),
});

const columnHelper = createColumnHelper();

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['categories-admin', search],
    queryFn: () => categoriesApi.listCategoriesAdmin({ search, limit: 100 }),
  });

  const categories = useMemo(() => data?.data || [], [data]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const openCreate = () => {
    setEditingCategory(null);
    reset({ namePt: '', nameEn: '', icon: '', image: '', parent: '', sortOrder: 0, isActive: true });
    setIsModalOpen(true);
  };

  const openEdit = (category) => {
    setEditingCategory(category);
    reset({
      namePt: category.name?.pt || '',
      nameEn: category.name?.en || '',
      icon: category.icon || '',
      image: category.image || '',
      parent: category.parent?._id || '',
      sortOrder: category.sortOrder || 0,
      isActive: category.isActive,
    });
    setIsModalOpen(true);
  };

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['categories-admin'] });

  const createMutation = useMutation({
    mutationFn: categoriesApi.createCategory,
    onSuccess: () => {
      toastSuccess('Category created successfully');
      invalidate();
      setIsModalOpen(false);
    },
    onError: (error) => toastError(apiErrorMessage(error, 'Failed to create category')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => categoriesApi.updateCategory(id, payload),
    onSuccess: () => {
      toastSuccess('Category updated successfully');
      invalidate();
      setIsModalOpen(false);
    },
    onError: (error) => toastError(apiErrorMessage(error, 'Failed to update category')),
  });

  const deleteMutation = useMutation({
    mutationFn: categoriesApi.deleteCategory,
    onSuccess: () => {
      toastSuccess('Category deleted successfully');
      invalidate();
    },
    onError: (error) => toastError(apiErrorMessage(error, 'Failed to delete category')),
  });

  const onSubmit = (values) => {
    const payload = {
      name: { pt: values.namePt, en: values.nameEn || '' },
      icon: values.icon || '',
      image: values.image || '',
      parent: values.parent || null,
      sortOrder: values.sortOrder ?? 0,
      isActive: values.isActive ?? true,
    };

    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory._id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = async (category) => {
    if (!(await confirmDelete(`the category "${category.name?.pt}"`))) return;
    deleteMutation.mutate(category._id);
  };

  const parentOptions = useMemo(
    () => categories.filter((c) => !editingCategory || c._id !== editingCategory._id),
    [categories, editingCategory]
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor((row) => row.name?.pt, {
        id: 'name',
        header: 'Name',
        cell: (info) => (
          <div className="flex items-center gap-2">
            {info.row.original.icon && <span>{info.row.original.icon}</span>}
            <span className="font-medium text-ink">{info.getValue()}</span>
          </div>
        ),
      }),
      columnHelper.accessor((row) => row.parent?.name?.pt, {
        id: 'parent',
        header: 'Parent',
        cell: (info) => info.getValue() || <span className="text-ink-faint">— top level —</span>,
      }),
      columnHelper.accessor('productsCount', { header: 'Products' }),
      columnHelper.accessor('sortOrder', { header: 'Order' }),
      columnHelper.accessor('isActive', {
        header: 'Status',
        cell: (info) => (
          <Badge color={info.getValue() ? 'success' : 'danger'}>{info.getValue() ? 'Active' : 'Inactive'}</Badge>
        ),
      }),
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-ink">Categories</h1>
          <p className="text-ink-soft mt-1">Manage product categories and subcategories</p>
        </div>
        <Button onClick={openCreate} className="flex items-center gap-2">
          <FiPlus /> Add Category
        </Button>
      </div>

      <div className="bg-surface p-4 rounded-lg border border-border">
        <div className="flex items-center gap-2 bg-bg px-4 py-2 rounded-lg max-w-xs">
          <FiSearch className="text-ink-faint" />
          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none w-full text-sm"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={categories}
        isLoading={isLoading}
        onEdit={openEdit}
        onDelete={handleDelete}
        pdfTitle="Categories"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Add Category'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
            >
              {editingCategory ? 'Save Changes' : 'Create Category'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-1">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name (Portuguese)" error={errors.namePt?.message} required>
              <Input {...register('namePt')} placeholder="Eletrónica" />
            </Field>
            <Field label="Name (English)" error={errors.nameEn?.message}>
              <Input {...register('nameEn')} placeholder="Electronics" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Icon" hint="Emoji or icon identifier">
              <Input {...register('icon')} placeholder="📱" />
            </Field>
            <Field label="Image URL">
              <Input {...register('image')} placeholder="https://..." />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Parent Category" hint="Leave empty for a top-level category">
              <Select {...register('parent')}>
                <option value="">— Top level —</option>
                {parentOptions.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name?.pt}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Sort Order">
              <Input type="number" {...register('sortOrder')} />
            </Field>
          </div>

          <Field>
            <Checkbox label="Active (visible in the app)" {...register('isActive')} />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
