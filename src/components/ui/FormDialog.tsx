import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

const FormDialogRoot = DialogPrimitive.Root;
const FormDialogTrigger = DialogPrimitive.Trigger;
const FormDialogPortal = DialogPrimitive.Portal;
const FormDialogClose = DialogPrimitive.Close;

const FormDialogOverlay = React.forwardRef<
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
FormDialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const FormDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className = '', children, ...props }, ref) => (
  <FormDialogPortal>
    <FormDialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={`
        fixed left-[50%] top-[50%] z-50
        w-full max-w-lg
        translate-x-[-50%] translate-y-[-50%]
        rounded-2xl
        border border-slate-200/70
        bg-white shadow-xl
        dark:border-slate-700/60 dark:bg-slate-900
        max-h-[85vh] flex flex-col
        ${className}
      `}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute end-3 top-3 rounded-lg p-1 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200">
        <X size={18} />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </FormDialogPortal>
));
FormDialogContent.displayName = DialogPrimitive.Content.displayName;

const FormDialogHeader = ({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`px-5 pt-5 pb-0 ${className}`}
    {...props}
  />
);
FormDialogHeader.displayName = 'FormDialogHeader';

const FormDialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className = '', ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={`text-lg font-semibold text-foreground ${className}`}
    {...props}
  />
));
FormDialogTitle.displayName = DialogPrimitive.Title.displayName;

const FormDialogBody = ({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`flex-1 overflow-y-auto px-5 py-4 ${className}`}
    {...props}
  />
);
FormDialogBody.displayName = 'FormDialogBody';

const FormDialogFooter = ({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`flex justify-end gap-2 border-t border-border px-5 py-3 ${className}`}
    {...props}
  />
);
FormDialogFooter.displayName = 'FormDialogFooter';

export {
  FormDialogRoot,
  FormDialogTrigger,
  FormDialogContent,
  FormDialogHeader,
  FormDialogTitle,
  FormDialogBody,
  FormDialogFooter,
  FormDialogClose,
};
