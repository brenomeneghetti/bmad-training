interface ValidationMessageProps {
  readonly id: string;
  readonly children: string;
}

export function ValidationMessage({ id, children }: ValidationMessageProps) {
  return (
    <p className="validation" id={id}>
      {children}
    </p>
  );
}
