import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiShield, FiUnlock, FiBell } from 'react-icons/fi';
import { Button, Field, Input, Textarea, Select } from '../../components/FormControls';
import * as adminApi from '../../api/admin';
import { toastSuccess, toastError, confirmAction, apiErrorMessage } from '../../lib/alerts';
import { useForm } from 'react-hook-form';

function OtpLogsPanel() {
  const queryClient = useQueryClient();
  const [blockedOnly, setBlockedOnly] = useState(true);

  const { data, isLoading } = useQuery({
    queryKey: ['otp-logs', blockedOnly],
    queryFn: () => adminApi.listOtpLogs({ blocked: blockedOnly, limit: 50 }),
  });

  const logs = data?.data || [];

  const unblockMutation = useMutation({
    mutationFn: adminApi.unblockOtpLog,
    onSuccess: () => {
      toastSuccess('Number unblocked successfully');
      queryClient.invalidateQueries({ queryKey: ['otp-logs'] });
    },
    onError: (error) => toastError(apiErrorMessage(error, 'Failed to unblock')),
  });

  const handleUnblock = async (log) => {
    const confirmed = await confirmAction({
      title: 'Unblock this number?',
      text: `${log.identifier} will immediately be able to request new OTP codes again.`,
      confirmText: 'Unblock',
    });
    if (confirmed) unblockMutation.mutate(log._id);
  };

  return (
    <div className="bg-surface rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-lg flex items-center gap-2">
          <FiShield /> OTP Abuse Monitor
        </h3>
        <label className="flex items-center gap-2 text-sm text-ink-soft cursor-pointer">
          <input type="checkbox" checked={blockedOnly} onChange={(e) => setBlockedOnly(e.target.checked)} />
          Blocked only
        </label>
      </div>

      {isLoading ? (
        <p className="text-ink-soft text-sm">Loading...</p>
      ) : logs.length === 0 ? (
        <p className="text-ink-soft text-sm py-6 text-center">No logs to show.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="border-b border-border text-ink-soft">
            <tr>
              <th className="text-left py-2 px-3">Identifier</th>
              <th className="text-left py-2 px-3">Attempts</th>
              <th className="text-left py-2 px-3">Last Sent</th>
              <th className="text-left py-2 px-3">Blocked Until</th>
              <th className="text-left py-2 px-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log._id} className="border-b border-border">
                <td className="py-2 px-3 font-mono">{log.identifier}</td>
                <td className="py-2 px-3">{log.attempts}</td>
                <td className="py-2 px-3">{log.lastSentAt ? new Date(log.lastSentAt).toLocaleString() : '—'}</td>
                <td className="py-2 px-3">{log.blockedUntil ? new Date(log.blockedUntil).toLocaleString() : '—'}</td>
                <td className="py-2 px-3">
                  {log.blockedUntil && new Date(log.blockedUntil) > new Date() && (
                    <Button
                      variant="secondary"
                      onClick={() => handleUnblock(log)}
                      className="flex items-center gap-1 py-1.5 px-3 text-xs"
                    >
                      <FiUnlock className="w-3.5 h-3.5" /> Unblock
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function BroadcastPanel() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: { target: 'all', titlePt: '', bodyPt: '' },
  });

  const broadcastMutation = useMutation({
    mutationFn: adminApi.broadcastNotification,
    onSuccess: (res) => {
      toastSuccess(`Notification sent to ${res.data.recipientCount} user(s)`);
      reset({ target: 'all', titlePt: '', bodyPt: '' });
    },
    onError: (error) => toastError(apiErrorMessage(error, 'Failed to send notification')),
  });

  const onSubmit = (values) => {
    broadcastMutation.mutate({
      target: values.target,
      title: { pt: values.titlePt },
      body: { pt: values.bodyPt },
    });
  };

  return (
    <div className="bg-surface rounded-lg border border-border p-6">
      <h3 className="font-display font-bold text-lg flex items-center gap-2 mb-4">
        <FiBell /> Broadcast Notification
      </h3>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Send to">
          <Select {...register('target')}>
            <option value="all">All active users</option>
            <option value="customers">Customers only</option>
            <option value="vendors">Vendors only</option>
          </Select>
        </Field>
        <Field label="Title">
          <Input {...register('titlePt', { required: true })} placeholder="New promotion!" />
        </Field>
        <Field label="Message">
          <Textarea {...register('bodyPt', { required: true })} placeholder="Get 20% off this weekend..." />
        </Field>
        <Button type="submit" disabled={isSubmitting}>
          Send Notification
        </Button>
      </form>
    </div>
  );
}

export default function SecurityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-ink">Security & Notifications</h1>
        <p className="text-ink-soft mt-1">OTP abuse monitoring and broadcast messaging</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OtpLogsPanel />
        <BroadcastPanel />
      </div>
    </div>
  );
}
