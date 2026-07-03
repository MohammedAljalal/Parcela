import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { useForm } from 'react-hook-form';
import { FiSearch } from 'react-icons/fi';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { Field, Select, Textarea, Input, Button, Badge } from '../../components/FormControls';
import * as ordersApi from '../../api/orders';
import { toastSuccess, toastError, apiErrorMessage } from '../../lib/alerts';

const STATUSES = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];

const STATUS_COLORS = {
  pending: 'gray',
  paid: 'info',
  processing: 'primary',
  shipped: 'warning',
  delivered: 'success',
  cancelled: 'danger',
};

// Mirrors backend's ALLOWED_TRANSITIONS in order.controller.js — keep in sync.
// Showing every status in the dropdown regardless of the order's current status
// let admins pick an illegal transition and get a bare "failed to update" toast,
// so we only offer the transitions the server will actually accept.
const ALLOWED_TRANSITIONS = {
  pending: ['paid', 'cancelled'],
  paid: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

const columnHelper = createColumnHelper();

function OrderDetailModal({ orderId, onClose }) {
  const queryClient = useQueryClient();
  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => ordersApi.getOrder(orderId),
    enabled: !!orderId,
  });

  const { register, handleSubmit, reset } = useForm();

  const updateMutation = useMutation({
    mutationFn: (payload) => ordersApi.updateOrderStatus(orderId, payload),
    onSuccess: () => {
      toastSuccess('Order status updated');
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders-admin'] });
      reset({ status: '', note: '', trackingCode: '' });
    },
    onError: (error) => toastError(apiErrorMessage(error, 'Failed to update status')),
  });

  const onSubmit = (values) => {
    if (!values.status) return;
    updateMutation.mutate(values);
  };

  const nextStatuses = order ? ALLOWED_TRANSITIONS[order.status] ?? [] : [];
  const isFinalStatus = order && nextStatuses.length === 0;

  return (
    <Modal isOpen={!!orderId} onClose={onClose} title={order ? `Order ${order.orderNumber}` : 'Order'} size="lg">
      {isLoading || !order ? (
        <p className="text-ink-soft text-sm py-8 text-center">Loading...</p>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-ink mb-2">Customer</h4>
              <p className="text-sm text-ink-soft">{order.user?.name}</p>
              <p className="text-sm text-ink-soft">{order.user?.phone}</p>
            </div>
            <div>
              <h4 className="font-medium text-ink mb-2">Delivery Address</h4>
              <p className="text-sm text-ink-soft">
                {order.deliveryAddress?.recipient}, {order.deliveryAddress?.phone}
              </p>
              <p className="text-sm text-ink-soft">
                {order.deliveryAddress?.address}, {order.deliveryAddress?.city}
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-ink mb-2">Items</h4>
            <div className="border border-border rounded-lg divide-y divide-border">
              {order.items?.map((item) => (
                <div key={item._id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="text-ink">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="font-medium text-ink">{(item.price * item.quantity).toFixed(2)} CVE</span>
                </div>
              ))}
            </div>
            <div className="text-sm text-ink-soft mt-3 space-y-1 text-right">
              <p>Subtotal: {order.subtotal} CVE</p>
              <p>Delivery: {order.deliveryFee} CVE</p>
              {order.discount > 0 && <p>Discount: -{order.discount} CVE</p>}
              <p className="font-bold text-ink text-base">Total: {order.total} CVE</p>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-ink mb-2">Status History</h4>
            <div className="space-y-2">
              {order.statusHistory?.map((h, idx) => (
                <div key={idx} className="flex items-center gap-3 text-sm">
                  <Badge color={STATUS_COLORS[h.status]}>{h.status}</Badge>
                  <span className="text-ink-soft">{new Date(h.timestamp).toLocaleString()}</span>
                  {h.note && <span className="text-ink-faint">— {h.note}</span>}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="border-t border-border pt-5">
            <h4 className="font-medium text-ink mb-3">Update Status</h4>
            {isFinalStatus ? (
              <p className="text-ink-soft text-sm">
                This order is <strong>{order.status}</strong> and cannot be moved to another status.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="New Status">
                    <Select {...register('status')}>
                      <option value="">— Select —</option>
                      {nextStatuses.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Tracking Code (optional)">
                    <Input {...register('trackingCode')} />
                  </Field>
                </div>
                <Field label="Note (optional)">
                  <Textarea {...register('note')} rows={2} />
                </Field>
                <Button type="submit" disabled={updateMutation.isPending}>
                  Update Status
                </Button>
              </>
            )}
          </form>
        </div>
      )}
    </Modal>
  );
}

export default function OrdersPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['orders-admin', search, status],
    queryFn: () => ordersApi.listOrdersAdmin({ search, status: status || undefined, limit: 50 }),
  });

  const orders = data?.data || [];

  const columns = useMemo(
    () => [
      columnHelper.accessor('orderNumber', { header: 'Order #' }),
      columnHelper.accessor((row) => row.user?.name, { id: 'customer', header: 'Customer' }),
      columnHelper.accessor('total', { header: 'Total', cell: (info) => `${info.getValue()} CVE` }),
      columnHelper.accessor('paymentStatus', {
        header: 'Payment',
        cell: (info) => (
          <Badge color={info.getValue() === 'paid' ? 'success' : info.getValue() === 'failed' ? 'danger' : 'gray'}>
            {info.getValue()}
          </Badge>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => <Badge color={STATUS_COLORS[info.getValue()]}>{info.getValue()}</Badge>,
      }),
      columnHelper.accessor('createdAt', {
        header: 'Date',
        cell: (info) => new Date(info.getValue()).toLocaleDateString(),
      }),
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-ink">Orders</h1>
        <p className="text-ink-soft mt-1">Track and manage customer orders</p>
      </div>

      <div className="bg-surface p-4 rounded-lg border border-border flex gap-4">
        <div className="flex items-center gap-2 bg-bg px-4 py-2 rounded-lg max-w-xs flex-1">
          <FiSearch className="text-ink-faint" />
          <input
            type="text"
            placeholder="Search by order # or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none w-full text-sm"
          />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="max-w-[180px]">
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={orders}
        isLoading={isLoading}
        showActions
        onEdit={(order) => setSelectedOrderId(order._id)}
        editLabel="View"
        pdfTitle="Orders"
      />

      {selectedOrderId && <OrderDetailModal orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} />}
    </div>
  );
}
