import type { TextareaHTMLAttributes } from "react";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
};

export function TextArea({ label, error, id, className = "", ...rest }: Props) {
  const fieldId = id ?? rest.name;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={fieldId} className="text-muted text-sm font-medium">
        {label}
      </label>
      <textarea
        id={fieldId}
        className={`border-line text-ink placeholder:text-muted min-h-[120px] rounded-xl border-2 bg-surface px-3 py-3 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${className}`}
        {...rest}
      />
      {error ? (
        <p className="text-danger text-sm" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
