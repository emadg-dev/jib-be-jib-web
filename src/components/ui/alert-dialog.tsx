import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';

const AlertDialogContext = React.createContext<{
  variant?: 'warning' | 'info' | 'success' | 'error';
}>({});

const AlertDialog = DialogPrimitive.Root;
const AlertDialogTrigger = DialogPrimitive.Trigger;
const AlertDialogPortal = DialogPrimitive.Portal;
const AlertDialogClose = DialogPrimitive.Close;

const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className = '', ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={`
      fixed inset-0 z-50
      bg-black/50 backdrop-blur-sm
      data-[state=open]:animate-in data-[state=open]:fade-in-0
      data-[state=closed]:animate-out data-[state=closed]:fade-out-0
      ${className}
    `}
    {...props}
  />
));
AlertDialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const variantIcons = {
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle,
  error: XCircle,
};

const variantStyles = {
  warning: 'text-amber-500',
  info: 'text-indigo-500',
  success: 'text-emerald-500',
  error: 'text-rose-500',
};

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    variant?: 'warning' | 'info' | 'success' | 'error';
  }
>(({ className = '', children, variant = 'warning', ...props }, ref) => (
  <AlertDialogContext.Provider value={{ variant }}>
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={`
          fixed left-[50%] top-[50%] z-50
          w-full max-w-md
          translate-x-[-50%] translate-y-[-50%]
          rounded-2xl
          border border-slate-200/70
          bg-white p-6 shadow-xl
          dark:border-slate-700/60 dark:bg-slate-900
          ${className}
        `}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute end-4 top-4 rounded-lg p-1 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200">
          <X size={18} />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </AlertDialogPortal>
  </AlertDialogContext.Provider>
));
AlertDialogContent.displayName = DialogPrimitive.Content.displayName;

const AlertDialogHeader = ({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`flex flex-col items-center text-center ${className}`}
    {...props}
  />
);
AlertDialogHeader.displayName = 'AlertDialogHeader';

const AlertDialogIcon = ({ className = '' }: { className?: string }) => {
  const { variant = 'warning' } = React.useContext(AlertDialogContext);
  const Icon = variantIcons[variant];
  return (
    <div
      className={`
        mb-4 grid h-12 w-12 place-items-center rounded-full
        ${variant === 'warning' ? 'bg-amber-100 dark:bg-amber-900/30' : ''}
        ${variant === 'info' ? 'bg-indigo-100 dark:bg-indigo-900/30' : ''}
        ${variant === 'success' ? 'bg-emerald-100 dark:bg-emerald-900/30' : ''}
        ${variant === 'error' ? 'bg-rose-100 dark:bg-rose-900/30' : ''}
        ${className}
      `}
    >
      <Icon size={24} className={variantStyles[variant]} />
    </div>
  );
};
AlertDialogIcon.displayName = 'AlertDialogIcon';

const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className = '', ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={`text-lg font-semibold text-slate-900 dark:text-slate-100 ${className}`}
    {...props}
  />
));
AlertDialogTitle.displayName = DialogPrimitive.Title.displayName;

const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className = '', ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={`mt-2 text-sm text-slate-500 dark:text-slate-400 ${className}`}
    {...props}
  />
));
AlertDialogDescription.displayName = DialogPrimitive.Description.displayName;

const AlertDialogFooter = ({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`mt-6 flex justify-center gap-2 ${className}`}
    {...props}
  />
);
AlertDialogFooter.displayName = 'AlertDialogFooter';

const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Close>
>(({ className = '', ...props }, ref) => (
  <DialogPrimitive.Close
    ref={ref}
    className={`
      inline-flex min-h-10 items-center justify-center
      whitespace-nowrap rounded-xl px-5 py-2.5
      bg-indigo-600 text-sm font-semibold text-white
      shadow-lg transition duration-200
      hover:bg-indigo-700 active:scale-[.98]
      focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300
      disabled:pointer-events-none disabled:opacity-50
      ${className}
    `}
    {...props}
  />
));
AlertDialogAction.displayName = 'AlertDialogAction';

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogIcon,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogClose,
};
