import type { TextareaHTMLAttributes } from 'react';

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="mxl-ds-textarea" {...props} />;
}
