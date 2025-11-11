/**
 * FormInput Component
 * Reusable form input field with validation
 */

import React from 'react';

export default function FormInput({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  ...props
}) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-danger ml-1">*</span>}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`input-field ${error ? 'border-danger' : ''}`}
        {...props}
      />
      {error && <p className="text-error mt-1">{error}</p>}
    </div>
  );
}
