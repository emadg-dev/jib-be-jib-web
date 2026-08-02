import React from 'react';

export const Card = ({ children, className = '' }: any) => (
  <section
    className={`
      glass-panel
      overflow-hidden
      rounded-2xl
      border
      border-slate-200/70
      bg-white/70
      shadow-sm
      backdrop-blur-xl

      dark:border-slate-700/60
      dark:bg-slate-900/70

      ${className}
    `}
  >
    {children}
  </section>
);

export const CardHeader = ({ children, className = '' }: any) => (
  <div className={`flex flex-col space-y-1.5 p-5 sm:p-6 ${className}`}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '' }: any) => (
  <h3
    className={`
      font-semibold
      leading-none
      tracking-tight
      text-slate-900
      dark:text-slate-100
      ${className}
    `}
  >
    {children}
  </h3>
);

export const CardContent = ({ children, className = '' }: any) => (
  <div className={`p-5 pt-0 sm:p-6 sm:pt-0 ${className}`}>
    {children}
  </div>
);

export const Button = ({
  children,
  variant = 'primary',
  className = '',
  loading = false,
  ...props
}: any) => {

  const base =
    `
    inline-flex
    min-h-11
    items-center
    justify-center
    whitespace-nowrap
    rounded-xl
    px-4
    py-2.5
    text-sm
    font-semibold
    transition
    duration-200

    focus-visible:outline-none
    focus-visible:ring-4
    focus-visible:ring-indigo-300

    disabled:pointer-events-none
    disabled:opacity-50

    active:scale-[.98]
    `;

  const variants = {
    primary:
      `
      bg-indigo-600
      text-white
      hover:bg-indigo-700
      shadow-lg
      `,

    destructive:
      `
      bg-rose-500
      text-white
      hover:bg-rose-600
      shadow-lg
      `,

    outline:
      `
      border
      border-slate-300
      bg-white/70
      text-slate-700

      hover:bg-slate-100

      dark:border-slate-700
      dark:bg-slate-800
      dark:text-slate-100
      dark:hover:bg-slate-700
      `,
  };

  return (
    <button
      aria-busy={loading}
      disabled={props.disabled || loading}
      className={`${base} ${variants[variant as keyof typeof variants]} ${className}`}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg>
      )}

      {children}
    </button>
  );
};

export const Input = React.forwardRef<HTMLInputElement, any>(
  ({ className = '', ...props }, ref) => (
    <input
      ref={ref}
      className={`
        flex
        h-11
        w-full
        rounded-xl

        border
        border-slate-300

        bg-white/70
        px-3
        py-2

        text-sm
        text-slate-900

        placeholder:text-slate-400

        shadow-sm
        outline-none
        transition

        focus:border-indigo-500
        focus:ring-4
        focus:ring-indigo-200

        disabled:cursor-not-allowed
        disabled:opacity-50

        dark:border-slate-700
        dark:bg-slate-800
        dark:text-slate-100
        dark:placeholder:text-slate-500
        dark:focus:border-indigo-400
        dark:focus:ring-indigo-900/40

        ${className}
      `}
      {...props}
    />
  )
);

Input.displayName = 'Input';

export const Table = ({ children }: any) => (
  <div className="-mx-5 overflow-x-auto sm:mx-0">
    <table className="w-full min-w-[620px] caption-bottom text-sm">
      {children}
    </table>
  </div>
);

export const Thead = ({ children }: any) => (
  <thead
    className="
      border-y
      border-slate-200
      bg-slate-50

      dark:border-slate-700
      dark:bg-slate-800/60
    "
  >
    {children}
  </thead>
);

export const Tbody = ({ children }: any) => (
  <tbody>{children}</tbody>
);

export const Tr = ({ children, className = '' }: any) => (
  <tr
    className={`
      border-b
      border-slate-200

      transition-colors

      hover:bg-slate-50

      last:border-0

      dark:border-slate-700
      dark:hover:bg-slate-800/40

      ${className}
    `}
  >
    {children}
  </tr>
);

export const Th = ({ children, className = '' }: any) => (
  <th
    className={`
      h-11
      px-4
      text-left
      align-middle

      text-xs
      font-semibold
      uppercase
      tracking-wide

      text-slate-500
      dark:text-slate-300

      ${className}
    `}
  >
    {children}
  </th>
);

export const Td = ({ children, className = '' }: any) => (
  <td
    className={`
      p-4
      align-middle

      text-slate-700
      dark:text-slate-200

      ${className}
    `}
  >
    {children}
  </td>
);