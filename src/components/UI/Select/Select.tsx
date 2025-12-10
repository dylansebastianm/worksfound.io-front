import React from 'react';
import styles from './Select.module.css';

interface SelectProps {
  id?: string;
  name?: string;
  value: string | string[];
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  label?: string;
  options: { value: string; label: string }[];
  required?: boolean;
  disabled?: boolean;
  multiple?: boolean;
  className?: string;
}

export default function Select({
  id,
  name,
  value,
  onChange,
  label,
  options,
  required = false,
  disabled = false,
  multiple = false,
  className = '',
}: SelectProps) {
  const selectId = id || name;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (multiple) {
      const selectedValues = Array.from(e.target.selectedOptions, option => option.value);
      // Crear un evento sintético con el array de valores
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: selectedValues,
          selectedOptions: e.target.selectedOptions,
        },
      } as any;
      onChange(syntheticEvent);
    } else {
      onChange(e);
    }
  };

  return (
    <div className={`${styles.selectGroup} ${className}`}>
      {label && (
        <label htmlFor={selectId} className={styles.label}>
          {label}
        </label>
      )}
      <select
        id={selectId}
        name={name}
        value={multiple ? (Array.isArray(value) ? value : []) : value}
        onChange={handleChange}
        required={required}
        disabled={disabled}
        multiple={multiple}
        className={styles.select}
      >
        {!required && !multiple && (
          <option value="">Selecciona una opción</option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

