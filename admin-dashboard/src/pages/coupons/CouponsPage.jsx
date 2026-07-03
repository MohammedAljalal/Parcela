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
import * as couponsApi from '../../api/coupons';
import { toastSuccess, toastError, confirmDelete, apiErrorMessage } from '../../lib/alerts';

const COUPON_TYPES = [
  { value: 'percentage', label: 'Percentage (%)' },
  { value: 'fixed', label: 'Fixed amount (CVE)' },
  { value: 'free_delivery', label: 'Free delivery' },
];

const schema = z.object({
  code: z.string().min(3).max(20),
  descriptionPt: z.string().optional(),
  type: z.enum(['percentage', 'fixed', 'free_delivery']),
  value: z.coerce.number().min(0).optional(),
  maxDiscount: z.coerce.number().min(0).optional(),
  minOrderAmount: z.coerce.number().min(0).optional(),
  usageLimit: z.coerce.number().int().min(0).optional(),
  usagePerUser: z.coerce.number().int().min(1).optional(),
  expiresAt: z.string().optional(),
  isActive: z.boolean().optional(),
});

const columnHelper = createColumnHelper();

export default function CouponsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['coupons-admin', search],
    queryFn: () => couponsApi.listCouponsAdmin({ search, limit: 100 }),
  });

  const coupons = data?.data || [];

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });
  const watchType = watch('type');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['coupons-admin'] });

  const openCreate = () => {
    setEditingCoupon(null);
    reset({
      code: '',
      descriptionPt: '',
      type: 'percentage',
      value: 10,
      maxDiscount: '',
      minOrderAmount: 0,
      usageLimit: 0,
      usagePerUser: 1,
      expiresAt: '',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEdit = (coupon) => {
    setEditingCoupon(coupon);
    reset({
      code: coupon.code,
      descriptionPt: coupon.description?.pt || '',
      type: coupon.type,
      value: coupon.value,
      maxDiscount: coupon.maxDiscount ?? '',
      minOrderAmount: coupon.minOrderAmount || 0,
      usageLimit: coupon.usageLimit || 0,
      usagePerUser: coupon.usagePerUser || 1,
      expiresAt: coupon.expiresAt ? coupon.expiresAt.substring(0, 10) : '',
      isActive: coupon.isActive,
    });
    setIsModalOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: couponsApi.createCoupon,
    onSuccess: () => {
      toastSuccess('Coupon created successfully');
      invalidate();
      setIsModalOpen(false);
    },
    onError: (error) => toastError(apiErrorMessage(error, 'Failed to create coupon')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => couponsApi.updateCoupon(id, payload),
    onSuccess: () => {
      toastSuccess('Coupon updated successfully');
      invalidate();
      setIsModalOpen(false);
    },
    onError: (error) => toastError(apiErrorMessage(error, 'Failed to update coupon')),
  });

  const deleteMutation = useMutation({
    mutationFn: couponsApi.deleteCoupon,
    onSuccess: () => {
      toastSuccess('Coupon deleted successfully');
      invalidate();
    },
    onError: (error) => toastError(apiErrorMessage(error, 'Failed to delete coupon')),
  });

  const onSubmit = (values) => {
    const basePayload = {
      description: { pt: values.descriptionPt || '' },
      value: values.type === 'free_delivery' ? 0 : values.value,
      maxDiscount: values.maxDiscount === '' ? null : Number(values.maxDiscount),
      minOrderAmount: values.minOrderAmount ?? 0,
      usageLimit: values.usageLimit ?? 0,
      usagePerUser: values.usagePerUser ?? 1,
      expiresAt: values.expiresAt || null,
      isActive: values.isActive ?? true,
    };

    if (editingCoupon) {
      updateMutation.mutate({ id: editingCoupon._id, payload: basePayload });
    } else {
      createMutation.mutate({ ...basePayload, code: values.code.toUpperCase(), type: values.type });
    }
  };

  const handleDelete = async (coupon) => {
    if (!(await confirmDelete(`the coupon "${coupon.code}"`))) return;
    deleteMutation.mutate(coupon._id);
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('code', {
        header: 'Code',
        cell: (info) => <span className="font-mono font-semibold">{info.getValue()}</span>,
      }),
      columnHelper.accessor('type', {
        header: 'Type',
        cell: (info) => <span className="capitalize">{info.getValue().replace('_', ' ')}</span>,
      }),
      columnHelper.accessor('value', {
        header: 'Value',
        cell: (info) =>
          info.row.original.type === 'percentage'
            ? `${info.getValue()}%`
            : info.row.original.type === 'fixed'
              ? `${info.getValue()} CVE`
              : '—',
      }),
      columnHelper.accessor((row) => `${row.usedCount}/${row.usageLimit || '∞'}`, { id: 'usage', header: 'Used' }),
      columnHelper.accessor('expiresAt', {
        header: 'Expires',
        cell: (info) => (info.getValue() ? new Date(info.getValue()).toLocaleDateString() : 'Never'),
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
          <h1 className="text-3xl font-display font-bold text-ink">Coupons</h1>
          <p className="text-ink-soft mt-1">Promo codes and discounts</p>
        </div>
        <Button onClick={openCreate} className="flex items-center gap-2">
          <FiPlus /> Add Coupon
        </Button>
      </div>

      <div className="bg-surface p-4 rounded-lg border border-border">
        <div className="flex items-center gap-2 bg-bg px-4 py-2 rounded-lg max-w-xs">
          <FiSearch className="text-ink-faint" />
          <input
            type="text"
            placeholder="Search by code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none w-full text-sm"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={coupons}
        isLoading={isLoading}
        onEdit={openEdit}
        onDelete={handleDelete}
        pdfTitle="Coupons"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCoupon ? 'Edit Coupon' : 'Add Coupon'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
              {editingCoupon ? 'Save Changes' : 'Create Coupon'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Code" error={errors.code?.message} required>
              <Input
                {...register('code')}
                placeholder="SUMMER20"
                disabled={!!editingCoupon}
                style={{ textTransform: 'uppercase' }}
              />
            </Field>
            <Field label="Type" required>
              <Select {...register('type')} disabled={!!editingCoupon}>
                {COUPON_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Description (Portuguese)">
            <Input {...register('descriptionPt')} placeholder="Desconto de verão" />
          </Field>

          {watchType !== 'free_delivery' && (
            <div className="grid grid-cols-2 gap-4">
              <Field
                label={watchType === 'percentage' ? 'Discount (%)' : 'Discount Amount (CVE)'}
                error={errors.value?.message}
              >
                <Input type="number" step="0.01" {...register('value')} />
              </Field>
              <Field label="Max Discount (CVE)" hint="Cap for percentage discounts">
                <Input type="number" step="0.01" {...register('maxDiscount')} placeholder="No cap" />
              </Field>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Minimum Order Amount (CVE)">
              <Input type="number" step="0.01" {...register('minOrderAmount')} />
            </Field>
            <Field label="Expires At">
              <Input type="date" {...register('expiresAt')} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Usage Limit" hint="0 = unlimited">
              <Input type="number" {...register('usageLimit')} />
            </Field>
            <Field label="Uses Per Customer">
              <Input type="number" {...register('usagePerUser')} />
            </Field>
          </div>

          <Field>
            <Checkbox label="Active" {...register('isActive')} />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
