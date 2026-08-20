import { expectedSiteDigest } from "@/lib/gallery/gate-key";
import { SITE_GATE_SESSION_KEY } from "@/lib/gate/constants";
import { createSessionGate } from "@/lib/gate/create-session-gate";

export const useSiteGate = createSessionGate(SITE_GATE_SESSION_KEY, expectedSiteDigest);
