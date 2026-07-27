import type { ReactNode } from "react";

import styles from "./AppShell.module.css";

type AppShellProps = {
  children: ReactNode;
};

export const AppShell = ({ children }: AppShellProps) => {
  return (
    <div className={styles.root}>
      <div className={styles.rootBlob} />
      <div className={styles.content}>{children}</div>
    </div>
  );
};
