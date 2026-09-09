import { useSiteGate } from "@/lib/gate/use-site-gate";
import { useSidebarBg } from "@/lib/prefs/useSidebarBg";
import { GalleryGateField } from "@/components/gallery/GalleryGateField";
import { GateTitle } from "@/components/layout/GateTitle";
import { useAppBg } from "@/components/theme/AppBgProvider";
import { BgTransitionOverlay } from "@/components/theme/BgTransitionOverlay";

import styles from "./SiteGate.module.css";

import type { ReactNode } from "react";

type SiteGateProps = {
  children: ReactNode;
};

export const SiteGate = ({ children }: SiteGateProps) => {
  const { unlocked, unlock } = useSiteGate();
  const { enabled: bgEnabled } = useSidebarBg();
  const { ready } = useAppBg();

  if (!unlocked) {
    return (
      <div className={styles.root}>
        {bgEnabled ? <BgTransitionOverlay open={!ready} /> : null}
        <div className={styles.panel}>
          <GateTitle />
          <GalleryGateField variant="page" autoFocus label="密钥" unlock={unlock} />
        </div>
      </div>
    );
  }
  return children;
};
