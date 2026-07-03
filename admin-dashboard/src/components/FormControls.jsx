// Small uncontrolled-friendly form primitives, designed to be spread with
// react-hook-form's register(). Kept dependency-free (no Tailwind plugins).

export const Field = ({ label, error, hint, children, required }) => (
  <div className="mb-4">
    {label && (
      <label className="block text-sm font-semibold mb-1.5" style={{ color: '#0D1B2A' }}>
        {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
      </label>
    )}
    {children}
    {hint && !error && (
      <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
        {hint}
      </p>
    )}
    {error && (
      <p className="text-xs mt-1" style={{ color: '#EF4444' }}>
        {error}
      </p>
    )}
  </div>
);

export const Input = ({ className = '', ...props }) => (
  <input className={`input ${className}`} {...props} />
);

export const Textarea = ({ className = '', rows = 3, ...props }) => (
  <textarea
    rows={rows}
    className={`input resize-none ${className}`}
    style={{ lineHeight: 1.6 }}
    {...props}
  />
);

export const Select = ({ className = '', children, ...props }) => (
  <select className={`input ${className}`} {...props}>
    {children}
  </select>
);

export const Checkbox = ({ label, ...props }) => (
  <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none" style={{ color: '#0D1B2A' }}>
    <input
      type="checkbox"
      className="w-4 h-4 rounded"
      style={{ accentColor: '#1A3FB8' }}
      {...props}
    />
    {label}
  </label>
);

export const Button = ({ variant = 'primary', className = '', children, ...props }) => {
  const styles = {
    primary:   'btn-primary px-4 py-2.5 text-sm',
    secondary: 'btn-secondary px-4 py-2.5 text-sm',
    danger:    'btn-danger px-4 py-2.5 text-sm',
    ghost: '',
  };
  const ghostStyle = variant === 'ghost'
    ? {
        padding: '0.625rem 1rem',
        borderRadius: 10,
        fontSize: '0.875rem',
        fontWeight: 500,
        color: '#0D1B2A',
        background: 'transparent',
        transition: 'background 0.18s',
      }
    : {};

  return (
    <button
      className={`${styles[variant]} disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={ghostStyle}
      onMouseEnter={(e) => {
        if (variant === 'ghost') e.currentTarget.style.background = '#F2F4F8';
      }}
      onMouseLeave={(e) => {
        if (variant === 'ghost') e.currentTarget.style.background = 'transparent';
      }}
      {...props}
    >
      {children}
    </button>
  );
};

export const Badge = ({ color = 'gray', children }) => {
  const map = {
    gray:    'badge-gray',
    primary: 'badge-primary',
    success: 'badge-success',
    warning: 'badge-warning',
    danger:  'badge-danger',
    info:    'badge-primary',
    violet:  'badge-violet',
  };
  return <span className={`badge ${map[color] || 'badge-gray'}`}>{children}</span>;
};
