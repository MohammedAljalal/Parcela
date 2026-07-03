import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FiPlus } from 'react-icons/fi';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { Field, Input, Checkbox, Button, Badge } from '../../components/FormControls';
import * as islandsApi from '../../api/islands';
import { confirmAction, toastSuccess, toastError, apiErrorMessage } from '../../lib/alerts';

const schema = z.object({
  name: z.string().min(2, 'Required'),
  code: z.string().min(2).max(3),
  region: z.string().optional(),
  capital: z.string().optional(),
  deliveryFee: z.coerce.number().min(0),
  minDays: z.coerce.number().int().min(1),
  maxDays: z.coerce.number().int().min(1),
  sortOrder: z.coerce.number().int().optional(),
  isActive: z.boolean().optional(),
});

const columnHelper = createColumnHelper();

export default function IslandsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIsland, setEditingIsland] = useState(null);

  const { data: islands = [], isLoading } = useQuery({
    queryKey: ['islands-admin'],
    queryFn: islandsApi.listIslands,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['islands-admin'] });

  const openCreate = () => {
    setEditingIsland(null);
    reset({
      name: '',
      code: '',
      region: '',
      capital: '',
      deliveryFee: 0,
      minDays: 1,
      maxDays: 2,
      sortOrder: 0,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEdit = (island) => {
    setEditingIsland(island);
    reset({
      name: island.name,
      code: island.code,
      region: island.region || '',
      capital: island.capital || '',
      deliveryFee: island.deliveryFee,
      minDays: island.estimatedDeliveryDays?.min || 1,
      maxDays: island.estimatedDeliveryDays?.max || 2,
      sortOrder: island.sortOrder || 0,
      isActive: island.isActive,
    });
    setIsModalOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: islandsApi.createIsland,
    onSuccess: () => {
      toastSuccess('Island created successfully');
      invalidate();
      setIsModalOpen(false);
    },
    onError: (error) => toastError(apiErrorMessage(error, 'Failed to create island')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => islandsApi.updateIsland(id, payload),
    onSuccess: () => {
      toastSuccess('Island updated successfully');
      invalidate();
      setIsModalOpen(false);
    },
    onError: (error) => toastError(apiErrorMessage(error, 'Failed to update island')),
  });

  const disableMutation = useMutation({
    mutationFn: islandsApi.deleteIsland,
    onSuccess: () => {
      toastSuccess('Island disabled successfully');
      invalidate();
    },
    onError: (error) => toastError(apiErrorMessage(error, 'Failed to disable island')),
  });

  const onSubmit = (values) => {
    const payload = {
      name: values.name,
      code: values.code.toUpperCase(),
      region: values.region || '',
      capital: values.capital || '',
      deliveryFee: values.deliveryFee,
      estimatedDeliveryDays: { min: values.minDays, max: values.maxDays },
      sortOrder: values.sortOrder ?? 0,
      isActive: values.isActive ?? true,
    };
    if (editingIsland) updateMutation.mutate({ id: editingIsland._id, payload });
    else createMutation.mutate(payload);
  };

  const handleDisable = async (island) => {
    const confirmed = await confirmAction({
      title: 'Disable this island?',
      text: `"${island.name}" will be hidden from the app. You can re-enable it later by editing it.`,
      confirmText: 'Disable',
      danger: true,
    });
    if (confirmed) disableMutation.mutate(island._id);
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', { header: 'Name' }),
      columnHelper.accessor('code', { header: 'Code' }),
      columnHelper.accessor('region', { header: 'Region' }),
      columnHelper.accessor('deliveryFee', { header: 'Delivery Fee', cell: (info) => `${info.getValue()} CVE` }),
      columnHelper.accessor((row) => `${row.estimatedDeliveryDays?.min}-${row.estimatedDeliveryDays?.max} days`, {
        id: 'eta',
        header: 'ETA',
      }),
      columnHelper.accessor('isActive', {
        header: 'Status',
        cell: (info) => (
          <Badge color={info.getValue() ? 'success' : 'danger'}>{info.getValue() ? 'Active' : 'Disabled'}</Badge>
        ),
      }),
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-display font-bold text-ink">Islands</h1>
          <p className="text-ink-soft mt-1">Delivery zones and shipping fees</p>
        </div>
        <Button onClick={openCreate} className="flex items-center gap-2">
          <FiPlus /> Add Island
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={islands}
        isLoading={isLoading}
        onEdit={openEdit}
        onDelete={handleDisable}
        pdfTitle="Islands"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingIsland ? 'Edit Island' : 'Add Island'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
              {editingIsland ? 'Save Changes' : 'Create Island'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name" error={errors.name?.message} required>
              <Input {...register('name')} placeholder="Santiago" />
            </Field>
            <Field label="Code" hint="2-3 uppercase letters" error={errors.code?.message} required>
              <Input {...register('code')} placeholder="STI" maxLength={3} style={{ textTransform: 'uppercase' }} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Region">
              <Input {...register('region')} placeholder="Sotavento" />
            </Field>
            <Field label="Capital">
              <Input {...register('capital')} placeholder="Praia" />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Delivery Fee (CVE)" error={errors.deliveryFee?.message}>
              <Input type="number" step="0.01" {...register('deliveryFee')} />
            </Field>
            <Field label="Min Days" error={errors.minDays?.message}>
              <Input type="number" {...register('minDays')} />
            </Field>
            <Field label="Max Days" error={errors.maxDays?.message}>
              <Input type="number" {...register('maxDays')} />
            </Field>
          </div>
          <Field label="Sort Order">
            <Input type="number" {...register('sortOrder')} />
          </Field>
          <Field>
            <Checkbox label="Active (available for delivery)" {...register('isActive')} />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
