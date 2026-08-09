import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogIcon,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogClose,
} from './ui/alert-dialog';

type ConfirmFn = (title: string, description?: string) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn>(() => Promise.resolve(false));

export function useConfirm() {
  return useContext(ConfirmContext);
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{
    open: boolean;
    title: string;
    description: string;
    resolve: (v: boolean) => void;
  }>({ open: false, title: '', description: '', resolve: () => {} });

  const confirm = useCallback((title: string, description = '') => {
    return new Promise<boolean>((resolve) => {
      setState({ open: true, title, description, resolve });
    });
  }, []);

  const handleClose = (value: boolean) => {
    state.resolve(value);
    setState((s) => ({ ...s, open: false }));
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog open={state.open} onOpenChange={(open) => { if (!open) handleClose(false); }}>
        <AlertDialogContent variant="warning">
          <AlertDialogHeader>
            <AlertDialogIcon />
            <AlertDialogTitle>{state.title}</AlertDialogTitle>
            {state.description && (
              <AlertDialogDescription>{state.description}</AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose asChild>
              <button
                onClick={() => handleClose(false)}
                className="inline-flex min-h-10 items-center justify-center whitespace-nowrap rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
            </AlertDialogClose>
            <AlertDialogAction asChild>
              <button onClick={() => handleClose(true)}>
                Confirm
              </button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
}
