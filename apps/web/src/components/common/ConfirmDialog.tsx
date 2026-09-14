import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  itemName: string;
  actionName?: string;
  message?: string;
  isLoading?: boolean;
  isDestructive?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  actionName = 'Delete',
  message,
  isLoading = false,
  isDestructive = true,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-red-50 text-red-600 shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="text-sm text-slate-600">
            {message ? (
              <p>{message}</p>
            ) : (
              <p>
                Are you sure you want to {actionName.toLowerCase()}{' '}
                <span className="font-semibold text-slate-900">&quot;{itemName}&quot;</span>?
                This action cannot be undone.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant={isDestructive ? 'danger' : 'primary'}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {actionName} &quot;{itemName}&quot;
          </Button>
        </div>
      </div>
    </Modal>
  );
};
