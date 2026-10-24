import React, { useState, useEffect } from 'react';

export interface DraftNumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number;
  onCommit: (num: number) => void;
  min?: number;
  max?: number;
  fallback?: number;
}

export function DraftNumberInput({
  value,
  onCommit,
  min = 0,
  max = 9999,
  fallback = 0,
  className = '',
  ...rest
}: DraftNumberInputProps) {
  const [draft, setDraft] = useState<string>(String(value ?? ''));

  useEffect(() => {
    setDraft(String(value ?? ''));
  }, [value]);

  const commit = (raw: string) => {
    const parsed = parseFloat(raw);
    const num = isNaN(parsed) ? fallback : Math.min(max, Math.max(min, parsed));
    setDraft(String(num));
    onCommit(num);
  };

  return (
    <input
      type="number"
      className={className}
      min={min}
      max={max}
      value={draft}
      onChange={e => {
        setDraft(e.target.value);
        const parsed = parseFloat(e.target.value);
        if (!isNaN(parsed)) {
          onCommit(Math.min(max, Math.max(min, parsed)));
        }
      }}
      onBlur={e => commit(e.target.value)}
      {...rest}
    />
  );
}

