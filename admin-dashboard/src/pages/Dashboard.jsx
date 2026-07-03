import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { FiUsers, FiShoppingCart, FiTrendingUp, FiPackage, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import * as adminApi from '../api/admin';

// ── Stat Card ───────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, trend, iconClass, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.32, delay, ease: 'easeOut' }}
    className="card p-6 group hover:shadow-lg transition-all duration-300 cursor-default"
    style={{ borderRadius: 18 }}
  >
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: '#6B7280' }}>
          {label}
        </p>
        <p
          className="text-3xl font-display font-bold mt-2 leading-none"
          style={{ color: '#0D1B2A' }}
        >
          {value.toLocaleString()}
        </p>
        {trend != null && (
          <div className="flex items-center gap-1 mt-3">
            {trend > 0 ? (
              <FiArrowUp style={{ width: 13, height: 13, color: '#22C55E' }} />
            ) : (
              <FiArrowDown style={{ width: 13, height: 13, color: '#EF4444' }} />
            )}
            <p
              className="text-xs font-semibold"
              style={{ color: trend > 0 ? '#15803D' : '#B91C1C' }}
            >
              {Math.abs(trend)}%
            </p>
            <p className="text-xs" style={{ color: '#9CA3AF' }}>
              vs last month
            </p>
          </div>
        )}
      </div>
      {/* Icon box */}
      <div
        className={`${iconClass} w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ml-4 shadow-md group-hover:scale-110 transition-transform duration-300`}
      >
        <Icon style={{ width: 22, height: 22, color: '#ffffff' }} />
      </div>
    </div>
  </motion.div>
);

// ── Custom Tooltip ───────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-3 py-2 text-sm"
      style={{
        background: '#0D2F8F',
        color: '#fff',
        boxShadow: '0 8px 24px rgba(13,27,42,0.24)',
      }}
    >
      <p className="text-xs font-medium mb-1" style={{ color: '#8BAAD6' }}>
        {label}
      </p>
      <p className="font-bold">{payload[0].value?.toLocaleString()}</p>
    </div>
  );
};

// ── Loading Skeleton ─────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="card p-6 animate-pulse" style={{ borderRadius: 18 }}>
    <div className="flex items-start justify-between">
      <div className="space-y-3 flex-1">
        <div className="h-4 rounded-lg w-24" style={{ background: '#E2E6EF' }} />
        <div className="h-8 rounded-lg w-20" style={{ background: '#E2E6EF' }} />
        <div className="h-3 rounded-lg w-32" style={{ background: '#E2E6EF' }} />
      </div>
      <div className="w-12 h-12 rounded-2xl" style={{ background: '#E2E6EF' }} />
    </div>
  </div>
);

// ── Main Dashboard ───────────────────────────────────────────────
export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: adminApi.getDashboardStats,
  });

  const { data: charts, isLoading: chartsLoading } = useQuery({
    queryKey: ['dashboard-charts'],
    queryFn: adminApi.getDashboardCharts,
  });

  const { data: activity, isLoading: activityLoading } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: adminApi.getRecentActivity,
  });

  const isLoading = statsLoading || chartsLoading || activityLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
      >
        <h1 className="text-2xl font-display font-bold" style={{ color: '#0D1B2A' }}>
          Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
          Welcome back to Parcela Admin
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          [0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard
              icon={FiUsers}
              label="Total Users"
              value={stats?.users?.total || 0}
              trend={
                stats?.users?.new
                  ? +((stats.users.new / stats.users.total) * 100).toFixed(1)
                  : null
              }
              iconClass="stat-icon-blue"
              delay={0}
            />
            <StatCard
              icon={FiShoppingCart}
              label="Total Orders"
              value={stats?.orders?.total || 0}
              trend={
                stats?.orders?.completed
                  ? +((stats.orders.completed / stats.orders.total) * 100).toFixed(1)
                  : null
              }
              iconClass="stat-icon-green"
              delay={0.06}
            />
            <StatCard
              icon={FiTrendingUp}
              label="Total Revenue"
              value={stats?.revenue?.total || 0}
              iconClass="stat-icon-amber"
              delay={0.12}
            />
            <StatCard
              icon={FiPackage}
              label="Products"
              value={stats?.products?.total || 0}
              trend={stats?.products?.lowStock ? -stats.products.lowStock : null}
              iconClass="stat-icon-violet"
              delay={0.18}
            />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, delay: 0.22 }}
          className="card p-6"
          style={{ borderRadius: 18 }}
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-bold text-base" style={{ color: '#0D1B2A' }}>
              Revenue (Last 30 Days)
            </h3>
            <span className="badge badge-primary">CVE</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={charts?.revenueByDay || []}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1A3FB8" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#1A3FB8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E6EF" />
              <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fontSize: 11 }} />
              <YAxis stroke="#9CA3AF" tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#1A3FB8"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: '#1A3FB8', stroke: '#E8EEF9', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Orders by Status */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, delay: 0.28 }}
          className="card p-6"
          style={{ borderRadius: 18 }}
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-bold text-base" style={{ color: '#0D1B2A' }}>
              Orders by Status
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={charts?.ordersByStatus || []} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E6EF" />
              <XAxis dataKey="status" stroke="#9CA3AF" tick={{ fontSize: 11 }} />
              <YAxis stroke="#9CA3AF" tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#1A3FB8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Recent Orders */}
      {activity?.recentOrders && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, delay: 0.34 }}
          className="card overflow-hidden"
          style={{ borderRadius: 18 }}
        >
          <div
            className="flex items-center justify-between px-6 py-4 border-b"
            style={{ borderColor: '#F2F4F8' }}
          >
            <h3 className="font-display font-bold text-base" style={{ color: '#0D1B2A' }}>
              Recent Orders
            </h3>
            <span className="badge badge-gray">
              {activity.recentOrders.length} orders
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="table-header">
                <tr>
                  {['Order', 'Customer', 'Amount', 'Status'].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                      style={{ color: '#6B7280' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activity.recentOrders.map((order, i) => (
                  <tr
                    key={order._id}
                    className="table-row border-b transition-colors"
                    style={{ borderColor: '#F2F4F8' }}
                  >
                    <td className="px-6 py-3.5 font-semibold font-mono text-xs" style={{ color: '#0D1B2A' }}>
                      {order.orderNumber}
                    </td>
                    <td className="px-6 py-3.5" style={{ color: '#6B7280' }}>
                      {order.user?.name}
                    </td>
                    <td className="px-6 py-3.5 font-semibold" style={{ color: '#0D1B2A' }}>
                      {order.total?.toLocaleString()} CVE
                    </td>
                    <td className="px-6 py-3.5">
                      <OrderStatusBadge status={order.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function OrderStatusBadge({ status }) {
  const map = {
    pending:   'badge-warning',
    paid:      'badge-primary',
    shipped:   'badge-violet',
    delivered: 'badge-success',
    cancelled: 'badge-danger',
  };
  return (
    <span className={`badge ${map[status] || 'badge-gray'}`}>
      {status}
    </span>
  );
}
