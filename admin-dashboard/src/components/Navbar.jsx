import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMenu, FiSearch, FiBell, FiLogOut, FiSettings, FiChevronDown } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onMenuToggle, user }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <div className="navbar flex items-center justify-between px-6 py-3 z-20 relative">
      {/* Left: Toggle + Search */}
      <div className="flex items-center gap-4 flex-1">
        <button
          id="sidebar-toggle"
          onClick={onMenuToggle}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
          style={{
            background: '#F2F4F8',
            color: '#1A3FB8',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#E8EEF9';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#F2F4F8';
          }}
        >
          <FiMenu style={{ width: 18, height: 18 }} />
        </button>

        {/* Search */}
        <div className="search-box hidden md:flex items-center gap-2 px-4 py-2 w-72">
          <FiSearch style={{ width: 15, height: 15, color: '#9CA3AF', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent outline-none text-sm w-full"
            style={{ color: '#0D1B2A' }}
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Bell */}
        <button
          className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all"
          style={{ background: '#F2F4F8', color: '#6B7280' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#E8EEF9'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#F2F4F8'; }}
        >
          <FiBell style={{ width: 17, height: 17 }} />
          <span
            className="absolute -top-0.5 -right-0.5 text-white text-[9px] font-bold rounded-full flex items-center justify-center"
            style={{ width: 16, height: 16, background: '#EF4444' }}
          >
            3
          </span>
        </button>

        {/* Divider */}
        <div className="w-px h-6" style={{ background: '#E2E6EF' }} />

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-all"
            style={{ background: showUserMenu ? '#E8EEF9' : 'transparent' }}
            onMouseEnter={(e) => { if (!showUserMenu) e.currentTarget.style.background = '#F2F4F8'; }}
            onMouseLeave={(e) => { if (!showUserMenu) e.currentTarget.style.background = 'transparent'; }}
          >
            {/* Avatar */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-xs text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #1A3FB8, #0D2F8F)' }}
            >
              {initials}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-semibold leading-none" style={{ color: '#0D1B2A' }}>
                {user?.name}
              </p>
              <p className="text-xs mt-0.5 capitalize" style={{ color: '#9CA3AF' }}>
                {user?.role}
              </p>
            </div>
            <FiChevronDown
              style={{
                width: 14,
                height: 14,
                color: '#9CA3AF',
                transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
              }}
            />
          </button>

          {showUserMenu && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowUserMenu(false)}
              />
              <div
                className="absolute right-0 mt-2 w-48 rounded-2xl z-20 overflow-hidden"
                style={{
                  background: '#ffffff',
                  border: '1px solid #E2E6EF',
                  boxShadow: '0 16px 40px -8px rgba(13,27,42,0.18)',
                }}
              >
                <div className="px-4 py-3 border-b" style={{ borderColor: '#F2F4F8' }}>
                  <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>Signed in as</p>
                  <p className="text-sm font-semibold mt-0.5 truncate" style={{ color: '#0D1B2A' }}>
                    {user?.email}
                  </p>
                </div>
                <div className="py-1">
                  <button
                    className="w-full text-left px-4 py-2.5 flex items-center gap-2.5 text-sm transition-colors"
                    style={{ color: '#6B7280' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#F2F4F8'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <FiSettings style={{ width: 15, height: 15 }} />
                    Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 flex items-center gap-2.5 text-sm transition-colors border-t"
                    style={{ color: '#EF4444', borderColor: '#F2F4F8' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#FEF2F2'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <FiLogOut style={{ width: 15, height: 15 }} />
                    Logout
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
