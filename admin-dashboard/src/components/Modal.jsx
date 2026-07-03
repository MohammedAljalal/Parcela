import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
};

export default function Modal({ isOpen, onClose, title, children, size = 'md', footer }) {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0"
            style={{ background: 'rgba(8,30,92,0.45)', backdropFilter: 'blur(3px)' }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`relative w-full ${SIZES[size]} max-h-[90vh] flex flex-col`}
            style={{
              background: '#ffffff',
              borderRadius: 20,
              boxShadow: '0 24px 64px -12px rgba(8,30,92,0.3)',
              border: '1px solid #E2E6EF',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
              style={{ borderColor: '#F2F4F8' }}
            >
              <h2 className="font-display font-bold text-base" style={{ color: '#0D1B2A' }}>
                {title}
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                style={{ color: '#9CA3AF' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#F2F4F8';
                  e.currentTarget.style.color = '#0D1B2A';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#9CA3AF';
                }}
              >
                <FiX style={{ width: 16, height: 16 }} />
              </button>
            </div>

            {/* Body */}
            <div
              className="px-6 py-5 overflow-y-auto flex-1"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#C9D9F2 transparent',
              }}
            >
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div
                className="px-6 py-4 border-t flex justify-end gap-3 flex-shrink-0"
                style={{ borderColor: '#F2F4F8' }}
              >
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
