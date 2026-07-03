import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user } = useAuth();

  // Detect mobile screen and auto-collapse sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
        setIsMobileOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMenuToggle = () => {
    if (window.innerWidth < 768) {
      setIsMobileOpen((prev) => !prev);
    } else {
      setIsSidebarOpen((prev) => !prev);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F2F4F8' }}>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-30 md:hidden"
          style={{ background: 'rgba(13,27,42,0.45)' }}
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar – desktop: always visible (collapsed or expanded) */}
      {/* Sidebar – mobile: slide-in drawer */}
      <div
        className={`
          fixed md:relative z-40 md:z-auto h-full
          transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsMobileOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Navbar */}
        <Navbar onMenuToggle={handleMenuToggle} user={user} />

        {/* Page content */}
        <main className="flex-1 overflow-auto" style={{ background: '#F2F4F8' }}>
          <div className="p-4 md:p-6 max-w-[1600px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
