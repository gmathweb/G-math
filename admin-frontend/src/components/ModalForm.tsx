import { useForm } from 'react-hook-form';
import { useState, useEffect, useRef } from 'react';
import Modal from './Modal';

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'select' | 'color' | 'hidden';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  defaultValue?: string;
  dependsOn?: string;
  dir?: 'rtl' | 'ltr';
}

export interface ModalFormProps {
  open: boolean;
  onClose: () => void;
  title: string;
  fields: FormField[];
  onSubmit: (data: Record<string, string>) => Promise<void> | void;
  submitLabel?: string;
  onFieldChange?: (name: string, value: string) => void;
}

export default function ModalForm({
  open,
  onClose,
  title,
  fields,
  onSubmit,
  submitLabel = 'שמור',
  onFieldChange,
}: ModalFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const activeDefaults = useRef<string | null>(null);

  const defaults = Object.fromEntries(
    fields.map((f) => [f.name, f.defaultValue ?? '']),
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<Record<string, string>>({ defaultValues: defaults });

  useEffect(() => {
    if (!open) {
      activeDefaults.current = null;
      return;
    }
    const entries = fields.map((f) => [f.name, f.defaultValue ?? '']);
    const key = JSON.stringify(entries);
    if (activeDefaults.current === key) return;
    activeDefaults.current = key;
    reset(Object.fromEntries(entries));
  }, [open, fields, reset]);

  const onFormSubmit = async (data: Record<string, string>) => {
    try {
      setSubmitting(true);
      await onSubmit(data);
      onClose();
    } catch {
      // Stay open on error — let caller handle toast
    } finally {
      setSubmitting(false);
    }
  };

  const footer = (
    <>
      <button
        type="button"
        onClick={onClose}
        disabled={submitting}
        className="px-4 py-2 text-sm text-[var(--ts)] hover:text-[var(--tp)] transition-colors"
      >
        ביטול
      </button>
      <button
        type="submit"
        form="modal-form"
        disabled={submitting}
        className="px-5 py-2 text-sm font-semibold text-white bg-[var(--g-green)] hover:bg-[var(--g-green)]/90 transition-colors disabled:opacity-50 rounded"
      >
        {submitting ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            שומר…
          </span>
        ) : (
          submitLabel
        )}
      </button>
    </>
  );

  return (
    <Modal open={open} onClose={onClose} title={title} footer={footer}>
      <form
        id="modal-form"
        onSubmit={handleSubmit(onFormSubmit)}
        className="flex flex-col gap-4"
      >
        {fields
          .filter((f) => f.type !== 'hidden')
          .map((field) => (
            <div key={field.name} className="flex flex-col gap-1">
              <label
                htmlFor={`mf-${field.name}`}
                className="text-sm font-medium text-[var(--tp)]"
              >
                {field.label}
                {field.required && <span className="text-red-500 ms-0.5">*</span>}
              </label>

              {field.type === 'select' ? (
                <select
                  id={`mf-${field.name}`}
                  {...register(field.name, {
                    required: field.required ? 'שדה חובה' : false,
                    onChange: (e) => {
                      for (const dependent of fields.filter(f => f.dependsOn === field.name)) {
                        setValue(dependent.name, '');
                      }
                      onFieldChange?.(field.name, e.target.value);
                    },
                  })}
                  aria-invalid={!!errors[field.name]}
                  aria-describedby={errors[field.name] ? `mf-${field.name}-error` : undefined}
                  className="w-full border border-[var(--bd)] rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-[var(--g-green)]"
                >
                  <option value="">{field.placeholder ?? 'בחר...'}</option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : field.type === 'textarea' ? (
                <textarea
                  id={`mf-${field.name}`}
                  dir={field.dir}
                  rows={3}
                  placeholder={field.placeholder}
                  {...register(field.name, {
                    required: field.required ? 'שדה חובה' : false,
                  })}
                  aria-invalid={!!errors[field.name]}
                  aria-describedby={errors[field.name] ? `mf-${field.name}-error` : undefined}
                  className="w-full border border-[var(--bd)] rounded px-3 py-2 text-sm resize-y focus:outline-none focus:border-[var(--g-green)]"
                />
              ) : field.type === 'color' ? (
                <div className="flex items-center gap-2">
                  <input
                    id={`mf-${field.name}`}
                    type="color"
                    {...register(field.name, {
                      required: field.required ? 'שדה חובה' : false,
                    })}
                    aria-invalid={!!errors[field.name]}
                    aria-describedby={errors[field.name] ? `mf-${field.name}-error` : undefined}
                    className="h-9 w-12 cursor-pointer border border-[var(--bd)] rounded"
                  />
                  <span className="text-xs text-[var(--ts)]">
                    {field.placeholder ?? 'בחר צבע'}
                  </span>
                </div>
              ) : (
                <input
                  id={`mf-${field.name}`}
                  type={field.type === 'number' ? 'number' : 'text'}
                  dir={field.dir}
                  placeholder={field.placeholder}
                  {...register(field.name, {
                    required: field.required ? 'שדה חובה' : false,
                  })}
                  aria-invalid={!!errors[field.name]}
                  aria-describedby={errors[field.name] ? `mf-${field.name}-error` : undefined}
                  className="w-full border border-[var(--bd)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--g-green)]"
                />
              )}

              {errors[field.name] && (
                <span id={`mf-${field.name}-error`} role="alert" className="text-xs text-red-500">
                  {errors[field.name]?.message as string}
                </span>
              )}
            </div>
          ))}

        {/* Render hidden fields */}
        {fields
          .filter((f) => f.type === 'hidden')
          .map((field) => (
            <input
              key={field.name}
              type="hidden"
              {...register(field.name)}
            />
          ))}
      </form>
    </Modal>
  );
}
