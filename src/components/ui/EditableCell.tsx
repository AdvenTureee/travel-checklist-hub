import React, { useState, useRef, useEffect } from 'react';

interface EditableCellProps {
  value: string;
  onSave: (newValue: string) => void;
  placeholder?: string;
  className?: string;
  inputType?: 'text' | 'select';
  options?: { value: string; label: string }[];
  displayValue?: string;
}

const EditableCell: React.FC<EditableCellProps> = ({
  value,
  onSave,
  placeholder = '',
  className = '',
  inputType = 'text',
  options = [],
  displayValue,
}) => {
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  const handleSave = () => {
    setEditing(false);
    if (inputValue !== value) {
      onSave(inputValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditing(false);
      setInputValue(value);
    }
  };

  if (editing) {
    if (inputType === 'select') {
      return (
        <select
          ref={inputRef as React.RefObject<HTMLSelectElement>}
          className={`border rounded px-2 py-1 text-sm ${className}`}
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown as any}
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      );
    }
    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        className={`border rounded px-2 py-1 text-sm w-full ${className}`}
        value={inputValue}
        placeholder={placeholder}
        onChange={e => setInputValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
      />
    );
  }

  return (
    <span
      className={`cursor-pointer min-h-[24px] block ${className}`}
      onClick={() => setEditing(true)}
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') setEditing(true);
      }}
      role="button"
      aria-label="Editar"
    >
      {displayValue !== undefined ? (displayValue || <span className="text-travel-dark/40 italic">{placeholder}</span>) : (value || <span className="text-travel-dark/40 italic">{placeholder}</span>)}
    </span>
  );
};

export default EditableCell;
