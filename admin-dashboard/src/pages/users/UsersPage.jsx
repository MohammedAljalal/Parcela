import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FiPlus, FiSearch, FiLock, FiUnlock } from 'react-icons/fi';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { Field, Input, Select, Button, Badge } from '../../components/FormControls';
import * as usersApi from '../../api/users';
import { toastSuccess, toastError, confirmDelete, confirmAction, apiErrorMessage } from '../../lib/alerts';

const ROLES = ['customer', 'vendor', 'admin'];

const columnHelper = createColumnHelper();

export default function UsersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['users', search, role],
    queryFn: () => usersApi.listUsers({ search, role: role || undefined, limit: 50 }),
  });

  const users = data?.data || [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['users'] });

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm();

  const createMutation = useMutation({
    mutationFn: usersApi.createUser,
    onSuccess: () => {
      toastSuccess('User created successfully');
      invalidate();
      setIsCreateOpen(false);
    },
    onError: (error) => toastError(apiErrorMessage(error, 'Failed to create user')),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }) => usersApi.updateUserStatus(id, isActive),
    onSuccess: () => {
      toastSuccess('Status updated');
      invalidate();
    },
    onError: (error) => toastError(apiErrorMessage(error, 'Failed to update status')),
  });

  const deleteMutation = useMutation({
    mutationFn: usersApi.deleteUser,
    onSuccess: () => {
      toastSuccess('User deleted successfully');
      invalidate();
    },
    onError: (error) => toastError(apiErrorMessage(error, 'Failed to delete user')),
  });

  const openCreate = () => {
    reset({ name: '', email: '', phone: '', password: '', role: 'customer' });
    setIsCreateOpen(true);
  };

  const onSubmitCreate = (values) => {
    createMutation.mutate({
      name: values.name,
      email: values.email || undefined,
      phone: values.phone || undefined,
      password: values.password,
      role: values.role,
    });
  };

  const handleToggleStatus = useCallback(
    async (user) => {
      const willBan = user.isActive;
      const confirmed = await confirmAction({
        title: willBan ? `Ban ${user.name}?` : `Unban ${user.name}?`,
        text: willBan
          ? 'They will be logged out immediately and unable to sign back in.'
          : 'They will regain access to their account.',
        confirmText: willBan ? 'Ban' : 'Unban',
        danger: willBan,
      });
      if (confirmed) statusMutation.mutate({ id: user._id, isActive: !user.isActive });
    },
    [statusMutation]
  );

  const handleDelete = async (user) => {
    if (!(await confirmDelete(user.name))) return;
    deleteMutation.mutate(user._id);
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', { header: 'Name' }),
      columnHelper.accessor('email', { header: 'Email', cell: (info) => info.getValue() || '—' }),
      columnHelper.accessor('phone', { header: 'Phone', cell: (info) => info.getValue() || '—' }),
      columnHelper.accessor('role', {
        header: 'Role',
        cell: (info) => <Badge color="primary">{info.getValue()}</Badge>,
      }),
      columnHelper.accessor('isActive', {
        header: 'Status',
        cell: (info) => (
          <button onClick={() => handleToggleStatus(info.row.original)} className="inline-flex">
            <Badge color={info.getValue() ? 'success' : 'danger'}>
              <span className="flex items-center gap-1">
                {info.getValue() ? <FiUnlock className="w-3 h-3" /> : <FiLock className="w-3 h-3" />}
                {info.getValue() ? 'Active' : 'Banned'}
              </span>
            </Badge>
          </button>
        ),
      }),
      columnHelper.accessor('createdAt', {
        header: 'Joined',
        cell: (info) => new Date(info.getValue()).toLocaleDateString(),
      }),
    ],
    [handleToggleStatus]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-display font-bold text-ink">Users</h1>
          <p className="text-ink-soft mt-1">Customers, vendors and admins</p>
        </div>
        <Button onClick={openCreate} className="flex items-center gap-2">
          <FiPlus /> Add User
        </Button>
      </div>

      <div className="bg-surface p-4 rounded-lg border border-border flex flex-wrap gap-4">
        <div className="flex items-center gap-2 bg-bg px-4 py-2 rounded-lg max-w-xs flex-1">
          <FiSearch className="text-ink-faint" />
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none w-full text-sm"
          />
        </div>
        <Select value={role} onChange={(e) => setRole(e.target.value)} className="max-w-[160px]">
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={users}
        isLoading={isLoading}
        onEdit={(user) => navigate(`/users/${user._id}`)}
        editLabel="View"
        onDelete={handleDelete}
        pdfTitle="Users"
      />

      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add User"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit(onSubmitCreate)} disabled={isSubmitting}>
              Create User
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onSubmitCreate)}>
          <Field label="Name" required>
            <Input {...register('name', { required: true })} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Email" hint="Either email or phone is required">
              <Input type="email" {...register('email')} />
            </Field>
            <Field label="Phone" hint="e.g. +2389991234">
              <Input {...register('phone')} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Password" required>
              <Input type="password" {...register('password', { required: true, minLength: 6 })} />
            </Field>
            <Field label="Role">
              <Select {...register('role')}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </form>
      </Modal>
    </div>
  );
}
