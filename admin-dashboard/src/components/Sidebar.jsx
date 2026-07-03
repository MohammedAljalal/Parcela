import { Link, useLocation } from 'react-router-dom';
import {
  FiHome,
  FiUsers,
  FiShoppingCart,
  FiFolder,
  FiMap,
  FiPackage,
  FiPercent,
  FiStar,
  FiImage,
  FiLock,
  FiChevronRight,
} from 'react-icons/fi';

const menuItems = [
  { label: 'Dashboard',   href: '/',          icon: FiHome },
  { label: 'Users',       href: '/users',      icon: FiUsers },
  { label: 'Products',    href: '/products',   icon: FiShoppingCart },
  { label: 'Categories',  href: '/categories', icon: FiFolder },
  { label: 'Islands',     href: '/islands',    icon: FiMap },
  { label: 'Orders',      href: '/orders',     icon: FiPackage },
  { label: 'Coupons',     href: '/coupons',    icon: FiPercent },
  { label: 'Reviews',     href: '/reviews',    icon: FiStar },
  { label: 'Banners',     href: '/banners',    icon: FiImage },
  { label: 'Security',    href: '/security',   icon: FiLock },
];

export default function Sidebar({ isOpen }) {
  const location = useLocation();

  return (
    <div
      className={`sidebar flex flex-col transition-all duration-300 ${
        isOpen ? 'w-64' : 'w-[72px]'
      }`}
      style={{ minHeight: '100vh' }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-5 py-5 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <div className="sidebar-logo-ring w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-white" style={{ padding: '4px' }}>
          <img src="/logo.svg" alt="Parcela Logo" className="w-full h-full object-contain" />
        </div>
        {isOpen && (
          <div>
            <h1 className="font-display font-bold text-white text-lg leading-none">
              Parcela
            </h1>
            <p className="text-xs mt-0.5" style={{ color: '#8BAAD6' }}>
              Admin Panel
            </p>
          </div>
        )}
      </div>

      {/* Menu label */}
      {isOpen && (
        <p
          className="px-5 pt-5 pb-2 text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: '#5573D4' }}
        >
          Navigation
        </p>
      )}

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              to={item.href}
              title={!isOpen ? item.label : undefined}
              className={`sidebar-link flex items-center gap-3 px-3 py-2.5 ${
                isActive ? 'active' : ''
              } ${!isOpen ? 'justify-center' : ''}`}
            >
              <Icon
                className="flex-shrink-0"
                style={{
                  width: 18,
                  height: 18,
                  color: isActive ? '#ffffff' : '#8BAAD6',
                }}
              />
              {isOpen && (
                <>
                  <span
                    className="flex-1 text-sm font-medium"
                    style={{ color: isActive ? '#ffffff' : '#A8C4F0' }}
                  >
                    {item.label}
                  </span>
                  {isActive && (
                    <FiChevronRight style={{ width: 14, height: 14, color: '#C9D9F2' }} />
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        className="px-4 py-4 border-t"
        style={{ borderColor: 'rgba(255,255,255,0.08)' }}
      >
        {isOpen ? (
          <p className="text-[11px] text-center" style={{ color: '#5573D4' }}>
            © 2026 Parcela
          </p>
        ) : (
          <div className="w-8 h-0.5 mx-auto rounded" style={{ background: 'rgba(255,255,255,0.12)' }} />
        )}
      </div>
    </div>
  );
}
