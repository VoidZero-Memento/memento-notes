import { ToastHost } from "@/components/common/ToastHost";
import { AppBgProvider } from "@/components/theme/AppBgProvider";

import styles from "./AppShell.module.css";

import type { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
};

export const AppShell = ({ children }: AppShellProps) => {
  return (
    <div className={styles.root}>
      <div className={styles.rootBlob} />
      <AppBgProvider>
        <div className={styles.content}>{children}</div>
      </AppBgProvider>
      <ToastHost />
    </div>
  );
};
