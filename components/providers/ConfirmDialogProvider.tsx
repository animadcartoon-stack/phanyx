"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

type ConfirmOptions = {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "danger" | "primary";
};

type ConfirmState = ConfirmOptions & {
  open: boolean;
  resolve: (value: boolean) => void;
};

type ConfirmDialogContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | undefined>(
  undefined
);

export function ConfirmDialogProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [dialog, setDialog] = useState<ConfirmState | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setDialog({
        ...options,
        open: true,
        resolve,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (!dialog) return;
    dialog.resolve(true);
    setDialog(null);
  }, [dialog]);

  const handleCancel = useCallback(() => {
    if (!dialog) return;
    dialog.resolve(false);
    setDialog(null);
  }, [dialog]);

  const value = useMemo(
    () => ({
      confirm,
    }),
    [confirm]
  );

  return (
    <ConfirmDialogContext.Provider value={value}>
      {children}

      {dialog && (
        <ConfirmDialog
          open={dialog.open}
          title={dialog.title}
          message={dialog.message}
          confirmText={dialog.confirmText}
          cancelText={dialog.cancelText}
          confirmVariant={dialog.confirmVariant}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirmDialog() {
  const context = useContext(ConfirmDialogContext);

  if (!context) {
    throw new Error(
      "useConfirmDialog deve ser usado dentro de <ConfirmDialogProvider>"
    );
  }

  return context;
}