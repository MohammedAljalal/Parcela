import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { useForm, useFieldArray } from 'react-hook-form';
import { FiPlus, FiSearch, FiX, FiImage, FiTrash2 } from 'react-icons/fi';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { Field, Input, Textarea, Select, Checkbox, Button, Badge } from '../../components/FormControls';
import * as productsApi from '../../api/products';
import * as categoriesApi from '../../api/categories';
import * as islandsApi from '../../api/islands';
import { toastSuccess, toastError, confirmDelete, apiErrorMessage } from '../../lib/alerts';

const columnHelper = createColumnHelper();

const emptyDefaults = {
  namePt: '',
  nameEn: '',
  descriptionPt: '',
  descriptionEn: '',
  category: '',
  price: '',
  compareAtPrice: '',
  stock: 0,
  sku: '',
  storeName: 'Parcela Store',
  deliveryInfoPt: '',
  tags: '',
  isFeatured: false,
  isPromoted: false,
  isActive: true,
  availableIslands: [],
  specifications: [],
};

function ProductFormModal({ isOpen, onClose, editingProduct, categories, islands }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [newPreviews, setNewPreviews] = useState([]);
  const [removedImageIds, setRemovedImageIds] = useState([]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: emptyDefaults });
  const { fields, append, remove } = useFieldArray({ control, name: 'specifications' });

  const isEditing = !!editingProduct;

  // Re-seed the form whenever a different product is opened for editing.
  useEffect(() => {
    if (!isOpen) return;
    setNewPreviews([]);
    setRemovedImageIds([]);
    if (editingProduct) {
      reset({
        namePt: editingProduct.name?.pt || '',
        nameEn: editingProduct.name?.en || '',
        descriptionPt: editingProduct.description?.pt || '',
        descriptionEn: editingProduct.description?.en || '',
        category: editingProduct.category?._id || '',
        price: editingProduct.price,
        compareAtPrice: editingProduct.compareAtPrice ?? '',
        stock: editingProduct.stock,
        sku: editingProduct.sku || '',
        storeName: editingProduct.vendorInfo?.storeName || '',
        deliveryInfoPt: editingProduct.deliveryInfo?.pt || '',
        tags: (editingProduct.tags || []).join(', '),
        isFeatured: editingProduct.isFeatured,
        isPromoted: editingProduct.isPromoted,
        isActive: editingProduct.isActive,
        availableIslands: editingProduct.availableIslands?.map((i) => i._id || i) || [],
        specifications: editingProduct.specifications || [],
      });
    } else {
      reset(emptyDefaults);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editingProduct]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['products-admin'] });

  const createMutation = useMutation({
    mutationFn: ({ payload, files }) => productsApi.createProduct(payload, files),
    onSuccess: () => {
      toastSuccess('Product created successfully');
      invalidate();
      onClose();
    },
    onError: (error) => toastError(apiErrorMessage(error, 'Failed to create product')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload, files }) => productsApi.updateProduct(id, payload, files),
    onSuccess: () => {
      toastSuccess('Product updated successfully');
      invalidate();
      onClose();
    },
    onError: (error) => toastError(apiErrorMessage(error, 'Failed to update product')),
  });

  const removeImageMutation = useMutation({
    mutationFn: ({ id, imageId }) => productsApi.deleteProductImage(id, imageId),
    onSuccess: () => invalidate(),
    onError: (error) => toastError(apiErrorMessage(error, 'Failed to remove image')),
  });

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    setNewPreviews(files.map((f) => ({ file: f, url: URL.createObjectURL(f) })));
  };

  const handleRemoveExistingImage = (imageId) => {
    if (!isEditing) return;
    removeImageMutation.mutate({ id: editingProduct._id, imageId });
  };

  const onSubmit = (values) => {
    if (!values.category) {
      toastError('Please select a category');
      return;
    }

    const payload = {
      name: { pt: values.namePt, en: values.nameEn || '' },
      description: { pt: values.descriptionPt || '', en: values.descriptionEn || '' },
      category: values.category,
      price: Number(values.price),
      compareAtPrice: values.compareAtPrice === '' ? null : Number(values.compareAtPrice),
      stock: Number(values.stock) || 0,
      sku: values.sku || undefined,
      vendorInfo: { storeName: values.storeName },
      deliveryInfo: { pt: values.deliveryInfoPt || '' },
      tags: values.tags
        ? values.tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      isFeatured: values.isFeatured,
      isPromoted: values.isPromoted,
      isActive: values.isActive,
      availableIslands: values.availableIslands || [],
      specifications: values.specifications || [],
    };

    const files = newPreviews.map((p) => p.file);

    if (isEditing) updateMutation.mutate({ id: editingProduct._id, payload, files });
    else createMutation.mutate({ payload, files });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Product' : 'Add Product'}
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
            {isEditing ? 'Save Changes' : 'Create Product'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-3 gap-6">
        {/* Left column: images */}
        <div className="col-span-1 space-y-4">
          <Field label="Images" hint="Up to 8 images total">
            {isEditing && editingProduct.images?.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-2">
                {editingProduct.images
                  .filter((img) => !removedImageIds.includes(img._id))
                  .map((img) => (
                    <div key={img._id} className="relative group">
                      <img src={img.url} alt="" className="w-full h-20 object-cover rounded-lg border border-border" />
                      <button
                        type="button"
                        onClick={() => {
                          handleRemoveExistingImage(img._id);
                          setRemovedImageIds((p) => [...p, img._id]);
                        }}
                        className="absolute -top-1.5 -right-1.5 bg-danger-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100"
                      >
                        <FiX className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
              </div>
            )}
            {newPreviews.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-2">
                {newPreviews.map((p, idx) => (
                  <img
                    key={idx}
                    src={p.url}
                    alt=""
                    className="w-full h-20 object-cover rounded-lg border border-border"
                  />
                ))}
              </div>
            )}
            <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
              <FiImage className="w-6 h-6 mx-auto text-ink-faint mb-1" />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="text-xs w-full"
              />
            </div>
          </Field>

          <Field label="Islands Available" hint="Leave empty to deliver everywhere">
            <div className="border border-border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
              {islands.map((island) => (
                <label key={island._id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" value={island._id} {...register('availableIslands')} />
                  {island.name}
                </label>
              ))}
            </div>
          </Field>
        </div>

        {/* Middle + right columns: details */}
        <div className="col-span-2 space-y-1">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name (Portuguese)" error={errors.namePt?.message} required>
              <Input {...register('namePt', { required: true })} />
            </Field>
            <Field label="Name (English)">
              <Input {...register('nameEn')} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Description (Portuguese)">
              <Textarea {...register('descriptionPt')} />
            </Field>
            <Field label="Description (English)">
              <Textarea {...register('descriptionEn')} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Category" required>
              <Select {...register('category', { required: true })}>
                <option value="">— Select category —</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name?.pt}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Store Name" required>
              <Input {...register('storeName', { required: true })} />
            </Field>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <Field label="Price (CVE)" required>
              <Input type="number" step="0.01" {...register('price', { required: true })} />
            </Field>
            <Field label="Compare-at Price">
              <Input type="number" step="0.01" {...register('compareAtPrice')} />
            </Field>
            <Field label="Stock">
              <Input type="number" {...register('stock')} />
            </Field>
            <Field label="SKU">
              <Input {...register('sku')} />
            </Field>
          </div>

          <Field label="Tags" hint="Comma-separated">
            <Input {...register('tags')} placeholder="electronics, sale, new" />
          </Field>

          <Field label="Delivery Info (Portuguese)">
            <Input {...register('deliveryInfoPt')} placeholder="Entrega em 24-48h" />
          </Field>

          <Field label="Specifications">
            <div className="space-y-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2">
                  <Input placeholder="Label" {...register(`specifications.${index}.label`)} />
                  <Input placeholder="Value" {...register(`specifications.${index}.value`)} />
                  <button type="button" onClick={() => remove(index)} className="text-danger-500 px-2">
                    <FiTrash2 />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => append({ label: '', value: '' })}
                className="text-primary-500 text-sm font-medium"
              >
                + Add specification
              </button>
            </div>
          </Field>

          <div className="flex gap-6 pt-2">
            <Checkbox label="Featured" {...register('isFeatured')} />
            <Checkbox label="Promoted" {...register('isPromoted')} />
            <Checkbox label="Active" {...register('isActive')} />
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['products-admin', search, categoryFilter],
    queryFn: () => productsApi.listProductsAdmin({ search, category: categoryFilter || undefined, limit: 50 }),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories-admin-all'],
    queryFn: () => categoriesApi.listCategoriesAdmin({ limit: 200 }),
  });
  const categories = categoriesData?.data || [];

  const { data: islands = [] } = useQuery({ queryKey: ['islands-admin'], queryFn: islandsApi.listIslands });

  const products = data?.data || [];

  const deleteMutation = useMutation({
    mutationFn: productsApi.deleteProduct,
    onSuccess: () => {
      toastSuccess('Product deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['products-admin'] });
    },
    onError: (error) => toastError(apiErrorMessage(error, 'Failed to delete product')),
  });

  const openCreate = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };
  const openEdit = (product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = async (product) => {
    if (!(await confirmDelete(`"${product.name?.pt}"`))) return;
    deleteMutation.mutate(product._id);
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor((row) => row.images?.[0]?.url, {
        id: 'image',
        header: '',
        cell: (info) => (
          <img
            src={info.getValue() || 'https://placehold.co/48x48'}
            alt=""
            className="w-10 h-10 rounded-lg object-cover"
          />
        ),
      }),
      columnHelper.accessor((row) => row.name?.pt, { id: 'name', header: 'Name' }),
      columnHelper.accessor((row) => row.category?.name?.pt, { id: 'category', header: 'Category' }),
      columnHelper.accessor('price', { header: 'Price', cell: (info) => `${info.getValue()} CVE` }),
      columnHelper.accessor('stock', {
        header: 'Stock',
        cell: (info) => (
          <span className={info.getValue() <= 3 ? 'text-danger-600 font-medium' : ''}>{info.getValue()}</span>
        ),
      }),
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
          <h1 className="text-3xl font-display font-bold text-ink">Products</h1>
          <p className="text-ink-soft mt-1">Manage your product catalogue</p>
        </div>
        <Button onClick={openCreate} className="flex items-center gap-2">
          <FiPlus /> Add Product
        </Button>
      </div>

      <div className="bg-surface p-4 rounded-lg border border-border flex gap-4">
        <div className="flex items-center gap-2 bg-bg px-4 py-2 rounded-lg max-w-xs flex-1">
          <FiSearch className="text-ink-faint" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none w-full text-sm"
          />
        </div>
        <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="max-w-[200px]">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name?.pt}
            </option>
          ))}
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={products}
        isLoading={isLoading}
        onEdit={openEdit}
        onDelete={handleDelete}
        pdfTitle="Products"
      />

      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingProduct={editingProduct}
        categories={categories}
        islands={islands}
      />
    </div>
  );
}
