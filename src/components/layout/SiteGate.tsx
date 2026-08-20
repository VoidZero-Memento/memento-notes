import { lazy, Suspense } from "react";

import { useSiteGate } from "@/lib/gate/use-site-gate";
import { useSidebarBg } from "@/lib/prefs/useSidebarBg";
import { GalleryGateField } from "@/components/gallery/GalleryGateField";
import { GateTitle } from "@/components/layout/GateTitle";

import styles from "./SiteGate.module.css";

import type { ReactNode } from "react";

const MobileBgCarousel = lazy(() =>
  import("@/components/theme/MobileBgCarousel").then((m) => ({ default: m.MobileBgCarousel })),
);

type SiteGateProps = {
  children: ReactNode;
};

export const SiteGate = ({ children }: SiteGateProps) => {
  const { unlocked, unlock } = useSiteGate();
  const { enabled: bgEnabled } = useSidebarBg();

  if (!unlocked) {
    return (
      <div className={[styles.root, bgEnabled ? styles.rootBg : ""].filter(Boolean).join(" ")}>
        {bgEnabled ? (
          <Suspense fallback={null}>
            <MobileBgCarousel looping />
          </Suspense>
        ) : null}
        <div className={styles.panel}>
          <GateTitle />
          <GalleryGateField variant="page" autoFocus label="密钥" unlock={unlock} />
        </div>
      </div>
    );
  }
  return children;
};
