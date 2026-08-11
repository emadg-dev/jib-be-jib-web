import React from 'react';
import { ChevronDown } from 'lucide-react';

export const Card = ({ children, className = '' }: any) => (
  <section
    className={`
      glass-panel
      overflow-hidden
      rounded-2xl
      shadow-sm
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
      text-foreground
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
    focus-visible:ring-ring/40

    disabled:pointer-events-none
    disabled:opacity-50

    active:scale-[.98]
    `;

  const variants = {
    primary:
      `
      bg-primary
      text-primary-foreground
      hover:bg-primary/90
      shadow-lg
      `,

    destructive:
      `
      bg-destructive
      text-destructive-foreground
      hover:bg-destructive/90
      shadow-lg
      `,

    secondary:
      `
      bg-secondary
      text-secondary-foreground
      hover:bg-secondary/80
      `,

    outline:
      `
      border
      border-input
      bg-background
      text-foreground

      hover:bg-accent/50
      hover:text-accent-foreground
      `,

    ghost:
      `
      text-foreground
      hover:bg-accent/50
      hover:text-accent-foreground
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
        border-input

        bg-background
        px-3.5
        py-2

        text-base
        text-foreground

        placeholder:text-muted-foreground/70

        shadow-sm
        outline-none
        transition

        hover:border-ring/40

        focus:border-ring
        focus:ring-4
        focus:ring-ring/20

        disabled:cursor-not-allowed
        disabled:opacity-50

        ${className}
      `}
      {...props}
    />
  )
);

Input.displayName = 'Input';

export const Textarea = React.forwardRef<HTMLTextAreaElement, any>(
  ({ className = '', ...props }, ref) => (
    <textarea
      ref={ref}
      className={`
        flex
        min-h-[80px]
        w-full
        rounded-xl

        border
        border-input

        bg-background
        px-3.5
        py-2

        text-base
        text-foreground

        placeholder:text-muted-foreground/70

        shadow-sm
        outline-none
        transition

        hover:border-ring/40

        focus:border-ring
        focus:ring-4
        focus:ring-ring/20

        disabled:cursor-not-allowed
        disabled:opacity-50

        resize-y

        ${className}
      `}
      {...props}
    />
  )
);

Textarea.displayName = 'Textarea';

export const Label = React.forwardRef<HTMLLabelElement, any>(
  ({ className = '', children, ...props }, ref) => (
    <label
      ref={ref}
      className={`
        mb-1.5
        block
        text-sm
        font-semibold
        text-foreground

        ${className}
      `}
      {...props}
    >
      {children}
    </label>
  )
);

Label.displayName = 'Label';

export const Select = React.forwardRef<HTMLSelectElement, any>(
  ({ className = '', children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={`
          h-11
          w-full
          appearance-none
          rounded-xl

          border
          border-input

          bg-background
          pe-10
          ps-3.5

          text-base
          text-foreground

          shadow-sm
          outline-none
          transition

          hover:border-ring/40

          focus:border-ring
          focus:ring-4
          focus:ring-ring/20

          disabled:cursor-not-allowed
          disabled:opacity-50

          ${className}
        `}
        {...props}
      >
        {children}
      </select>

      <ChevronDown
        size={18}
        className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  )
);

Select.displayName = 'Select';

export const Checkbox = React.forwardRef<HTMLInputElement, any>(
  ({ className = '', children, ...props }, ref) => (
    <label
      className={`
        group
        inline-flex
        cursor-pointer
        select-none
        items-center
        gap-2.5

        ${className}
      `}
    >
      <span className="relative inline-flex h-5 w-5 shrink-0">
        <input
          ref={ref}
          type="checkbox"
          className={`
            peer
            h-5
            w-5
            appearance-none
            rounded-md

            border-2
            border-slate-300

            bg-background
            transition-colors
            duration-200

            hover:border-primary/60

            checked:border-primary
            checked:bg-primary

            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-ring/40
            focus-visible:ring-offset-2
            focus-visible:ring-offset-background

            disabled:cursor-not-allowed
            disabled:opacity-50

            dark:border-slate-600
          `}
          {...props}
        />

        <svg
          className="pointer-events-none absolute inset-0 h-5 w-5 p-0.5 text-primary-foreground opacity-0 transition-opacity duration-200 peer-checked:opacity-100"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>

      {children && (
        <span className="text-sm font-medium text-foreground">
          {children}
        </span>
      )}
    </label>
  )
);

Checkbox.displayName = 'Checkbox';

export const Table = ({ children, className = '' }: any) => (
  <div className="-mx-5 overflow-x-auto sm:mx-0">
    <table className={`w-full table-auto caption-bottom text-sm ${className}`}>
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
      px-3
      text-center
      align-middle
      whitespace-nowrap

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
      px-3
      py-2
      align-middle
      text-center
      whitespace-nowrap

      text-slate-700
      dark:text-slate-200

      ${className}
    `}
  >
    {children}
  </td>
);