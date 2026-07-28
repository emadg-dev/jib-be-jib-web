import React from 'react';

export const Card = ({ children, className = '' }: any) => (
  <section className={`glass-panel !border-white/70 !bg-white/65 overflow-hidden rounded-2xl ${className}`}>{children}</section>
);
export const CardHeader = ({ children, className = '' }: any) => (
  <div className={`flex flex-col space-y-1.5 p-5 sm:p-6 ${className}`}>{children}</div>
);
export const CardTitle = ({ children, className = '' }: any) => <h3 className={`font-semibold leading-none tracking-tight text-slate-900 ${className}`}>{children}</h3>;
export const CardContent = ({ children, className = '' }: any) => <div className={`p-5 pt-0 sm:p-6 sm:pt-0 ${className}`}>{children}</div>;

export const Button = ({ children, variant = 'primary', className = '', ...props }: any) => {
  const base = 'inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200 disabled:pointer-events-none disabled:opacity-50 active:scale-[.98]';
  const variants = {
    primary: 'bg-indigo-600 text-white shadow-[0_8px_18px_rgba(79,70,229,.24)] hover:bg-indigo-700',
    destructive: 'bg-rose-500 text-white shadow-[0_8px_18px_rgba(244,63,94,.2)] hover:bg-rose-600',
    outline: 'border border-white/80 bg-white/65 text-slate-700 shadow-sm hover:bg-white',
  };
  return <button className={`${base} ${variants[variant as keyof typeof variants]} ${className}`} {...props}>{children}</button>;
};

export const Input = React.forwardRef<HTMLInputElement, any>(({ className = '', ...props }, ref) => (
  <input ref={ref} className={`flex h-11 w-full rounded-xl border border-white/80 bg-white/65 px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props} />
));

export const Table = ({ children }: any) => <div className="-mx-5 overflow-x-auto sm:mx-0"><table className="w-full min-w-[620px] caption-bottom text-sm">{children}</table></div>;
export const Thead = ({ children }: any) => <thead className="border-y border-white/60 bg-white/35">{children}</thead>;
export const Tbody = ({ children }: any) => <tbody>{children}</tbody>;
export const Tr = ({ children, className = '' }: any) => <tr className={`border-b border-white/60 transition-colors last:border-0 hover:bg-white/40 ${className}`}>{children}</tr>;
export const Th = ({ children, className = '' }: any) => <th className={`h-11 px-4 text-left align-middle text-xs font-semibold uppercase tracking-wide text-slate-500 ${className}`}>{children}</th>;
export const Td = ({ children, className = '' }: any) => <td className={`p-4 align-middle text-slate-600 ${className}`}>{children}</td>;
