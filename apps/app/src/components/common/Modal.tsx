import React, { useEffect } from 'react';
import { Icon } from './Icon';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, size = 'md', children, footer }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClass = size === 'lg' ? 'modal-lg' : size === 'md' ? 'modal-md' : '';

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`modal-card ${sizeClass}`}>
        <div className="modal-card-header">
          <h3 className="modal-title">{title}</h3>
          <button
            type="button"
            className="btn-icon-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-actions">{footer}</div>}
      </div>
    </div>
  );
}

