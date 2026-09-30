interface ValidationMessageProps {
  readonly id: string;
  readonly children: string;
}

export function ValidationMessage({ id, children }: ValidationMessageProps) {
  return (
    <p className={styles.validation} id={id}>
      {children}
    </p>
  );
}
import styles from "../../styles/workbench.module.css";
