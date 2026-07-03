import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { FiArrowLeft, FiLock, FiUnlock, FiKey } from 'react-icons/fi';
import { Field, Input, Select, Button, Badge } from '../../components/FormControls';
import * as usersApi from '../../api/users';
import { toastSuccess, toastError, confirmAction, apiErrorMessage } from '../../lib/alerts';
import Swal from 'sweetalert2';

const ROLES = ['customer', 'vendor', 'admin'];
const TABS = ['Overview', 'Orders', 'Addresses'];

export default function UserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('Overview');

  const { data, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => usersApi.getUser(id),
  });

  const { data: orders } = useQuery({
    queryKey: ['user-orders', id],
    queryFn: () => usersApi.getUserOrders(id),
    enabled: activeTab === 'Orders',
  });

  const { data: addresses } = useQuery({
    queryKey: ['user-addresses', id],
    queryFn: () => usersApi.getUserAddresses(id),
    enabled: activeTab === 'Addresses',
  });

  const { register, handleSubmit } = useForm();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['user', id] });

  const updateMutation = useMutation({
    mutationFn: (payload) => usersApi.updateUser(id, payload),
    onSuccess: () => {
      toastSuccess('User updated successfully');
      invalidate();
    },
    onError: (error) => toastError(apiErrorMessage(error, 'Failed to update user')),
  });

  const statusMutation = useMutation({
    mutationFn: (isActive) => usersApi.updateUserStatus(id, isActive),
    onSuccess: () => {
      toastSuccess('Status updated');
      invalidate();
    },
    onError: (error) => toastError(apiErrorMessage(error, 'Failed to update status')),
  });

  const roleMutation = useMutation({
    mutationFn: (role) => usersApi.updateUserRole(id, role),
    onSuccess: () => {
      toastSuccess('Role updated');
      invalidate();
    },
    onError: (error) => toastError(apiErrorMessage(error, 'Failed to update role')),
  });

  const passwordMutation = useMutation({
    mutationFn: (password) => usersApi.resetUserPassword(id, password),
    onSuccess: () => toastSuccess('Password reset successfully'),
    onError: (error) => toastError(apiErrorMessage(error, 'Failed to reset password')),
  });

  if (isLoading || !data) return <div className="text-center py-12 text-ink-soft">Loading...</div>;

  const { user, stats } = data;

  const onSubmitInfo = (values) => {
    updateMutation.mutate({
      name: values.name,
      email: values.email || '',
      phone: values.phone || '',
    });
  };

  const handleToggleStatus = async () => {
    const willBan = user.isActive;
    const confirmed = await confirmAction({
      title: willBan ? 'Ban this user?' : 'Unban this user?',
      text: willBan ? 'They will be logged out immediately.' : 'They will regain account access.',
      confirmText: willBan ? 'Ban' : 'Unban',
      danger: willBan,
    });
    if (confirmed) statusMutation.mutate(!user.isActive);
  };

  const handleRoleChange = async (e) => {
    const newRole = e.target.value;
    const confirmed = await confirmAction({
      title: `Change role to "${newRole}"?`,
      text: 'This changes what the user can access in the app.',
      confirmText: 'Change Role',
    });
    if (confirmed) roleMutation.mutate(newRole);
    else e.target.value = user.role;
  };

  const handleResetPassword = async () => {
    const { value: password } = await Swal.fire({
      title: 'Reset Password',
      input: 'password',
      inputLabel: 'New password (min 6 characters)',
      inputPlaceholder: 'Enter new password',
      showCancelButton: true,
      confirmButtonText: 'Reset Password',
      confirmButtonColor: '#1A3FB8',
      customClass: { popup: 'parcela-swal' },
      inputValidator: (value) => {
        if (!value || value.length < 6) return 'Password must be at least 6 characters';
      },
    });
    if (password) passwordMutation.mutate(password);
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/users')}
        className="flex items-center gap-2 text-ink-soft hover:text-ink text-sm"
      >
        <FiArrowLeft /> Back to Users
      </button>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-500 text-white flex items-center justify-center font-display font-bold text-xl">
            {user.name?.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-ink">{user.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge color="primary">{user.role}</Badge>
              <Badge color={user.isActive ? 'success' : 'danger'}>{user.isActive ? 'Active' : 'Banned'}</Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleResetPassword} className="flex items-center gap-2">
            <FiKey /> Reset Password
          </Button>
          <Button
            variant={user.isActive ? 'danger' : 'primary'}
            onClick={handleToggleStatus}
            className="flex items-center gap-2"
          >
            {user.isActive ? <FiLock /> : <FiUnlock />} {user.isActive ? 'Ban User' : 'Unban User'}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-surface rounded-lg border border-border p-4">
          <p className="text-xs text-ink-soft">Orders</p>
          <p className="text-xl font-display font-bold">{stats.ordersCount}</p>
        </div>
        <div className="bg-surface rounded-lg border border-border p-4">
          <p className="text-xs text-ink-soft">Total Spent</p>
          <p className="text-xl font-display font-bold">{stats.totalSpent} CVE</p>
        </div>
        <div className="bg-surface rounded-lg border border-border p-4">
          <p className="text-xs text-ink-soft">Addresses</p>
          <p className="text-xl font-display font-bold">{stats.addressesCount}</p>
        </div>
        <div className="bg-surface rounded-lg border border-border p-4">
          <p className="text-xs text-ink-soft">Reviews</p>
          <p className="text-xl font-display font-bold">{stats.reviewsCount}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-primary-500 text-primary-500'
                : 'border-transparent text-ink-soft hover:text-ink'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Overview' && (
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-surface rounded-lg border border-border p-6">
            <h3 className="font-display font-bold mb-4">Account Info</h3>
            <form onSubmit={handleSubmit(onSubmitInfo)} key={user._id}>
              <Field label="Name">
                <Input defaultValue={user.name} {...register('name')} />
              </Field>
              <Field label="Email">
                <Input type="email" defaultValue={user.email} {...register('email')} />
              </Field>
              <Field label="Phone">
                <Input defaultValue={user.phone} {...register('phone')} />
              </Field>
              <Button type="submit" disabled={updateMutation.isPending}>
                Save Changes
              </Button>
            </form>
          </div>
          <div className="bg-surface rounded-lg border border-border p-6">
            <h3 className="font-display font-bold mb-4">Role & Permissions</h3>
            <Field label="Role" hint="Changing this affects what the user can do in the app">
              <Select defaultValue={user.role} onChange={handleRoleChange}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </div>
      )}

      {activeTab === 'Orders' && (
        <div className="bg-surface rounded-lg border border-border overflow-hidden">
          {!orders ? (
            <p className="p-6 text-ink-soft text-sm">Loading...</p>
          ) : orders.length === 0 ? (
            <p className="p-6 text-ink-soft text-sm">No orders yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-bg border-b border-border">
                <tr>
                  <th className="text-left px-6 py-3 font-medium">Order #</th>
                  <th className="text-left px-6 py-3 font-medium">Total</th>
                  <th className="text-left px-6 py-3 font-medium">Status</th>
                  <th className="text-left px-6 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((o) => (
                  <tr key={o._id}>
                    <td className="px-6 py-3">{o.orderNumber}</td>
                    <td className="px-6 py-3">{o.total} CVE</td>
                    <td className="px-6 py-3">
                      <Badge color="primary">{o.status}</Badge>
                    </td>
                    <td className="px-6 py-3">{new Date(o.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'Addresses' && (
        <div className="grid grid-cols-2 gap-4">
          {!addresses ? (
            <p className="text-ink-soft text-sm">Loading...</p>
          ) : addresses.length === 0 ? (
            <p className="text-ink-soft text-sm">No saved addresses.</p>
          ) : (
            addresses.map((a) => (
              <div key={a._id} className="bg-surface rounded-lg border border-border p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-ink">{a.recipient}</p>
                  {a.isDefault && <Badge color="primary">Default</Badge>}
                </div>
                <p className="text-sm text-ink-soft">{a.phone}</p>
                <p className="text-sm text-ink-soft">
                  {a.address}, {a.city}
                </p>
                <p className="text-xs text-ink-faint mt-1">{a.island?.name}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
