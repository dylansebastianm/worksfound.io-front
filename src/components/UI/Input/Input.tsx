import React from 'react';
import styles from './Input.module.css';

interface InputProps {
  type?: 'text' | 'password' | 'email' | 'number' | 'tel';
  id?: string;
  name?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  className?: string;
}

export default function Input({
  type = 'text',
  id,
  name,
  value,
  onChange,
  label,
  placeholder,
  required = false,
  disabled = false,
  autoComplete,
  className = '',
}: InputProps) {
  const inputId = id || name;

  return (
    <div className={`${styles.inputGroup} ${className}`}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}
      <input
        type={type}
        id={inputId}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        className={styles.input}
      />
    </div>
  );
}

