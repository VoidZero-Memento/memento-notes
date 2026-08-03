import { useSidebarBg } from "@/lib/prefs/useSidebarBg";

import styles from "./NotesShell.module.css";

import type { ReactNode } from "react";

type NotesShellRootProps = {
  children: ReactNode;
  className?: string;
};

/** 笔记壳层根节点：复用背景图开关偏好，供工作区与加载/失败页共用 */
export const NotesShellRoot = ({ children, className }: NotesShellRootProps) => {
  const { enabled } = useSidebarBg();

  return (
    <div
      className={[styles.root, enabled ? styles.rootBgEnabled : "", className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
};
