import React from 'react';

export const Card = ({ children, className = '' }: any) => (
  <div className={`bg-card text-card-foreground rounded-xl border shadow-sm ${className}`}>{children}</div>
);
export const CardHeader = ({ children, className = '' }: any) => (
  <div className={`p-6 flex flex-col space-y-1.5 ${className}`}>{children}</div>
);
export const CardTitle = ({ children }: any) => <h3 className="font-semibold leading-none tracking-tight">{children}</h3>;
export const CardContent = ({ children, className = '' }: any) => <div className={`p-6 pt-0 ${className}`}>{children}</div>;

export const Button = ({ children, variant = 'primary', className = '', ...props }: any) => {
  const base = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2";
  const variants = {
    primary: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
    destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
    outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground"
  };
  return <button className={`${base} ${variants[variant as keyof typeof variants]} ${className}`} {...props}>{children}</button>;
};

export const Input = React.forwardRef<HTMLInputElement, any>(({ className = '', ...props }, ref) => (
  <input ref={ref} className={`flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props} />
));

export const Table = ({ children }: any) => <div className="w-full overflow-auto"><table className="w-full caption-bottom text-sm">{children}</table></div>;
export const Thead = ({ children }: any) => <thead className="[&_tr]:border-b">{children}</thead>;
export const Tbody = ({ children }: any) => <tbody className="[&_tr:last-child]:border-0">{children}</tbody>;
export const Tr = ({ children }: any) => <tr className="border-b transition-colors hover:bg-muted/50">{children}</tr>;
export const Th = ({ children }: any) => <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">{children}</th>;
export const Td = ({ children }: any) => <td className="p-4 align-middle">{children}</td>;