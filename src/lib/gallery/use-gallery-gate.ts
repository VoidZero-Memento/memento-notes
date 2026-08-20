import { GALLERY_BG_GATE_SESSION_KEY, GALLERY_GATE_SESSION_KEY, STAGE_GATE_SESSION_KEY } from "@/lib/gallery/constants";
import { expectedGalleryDigest, expectedStageDigest } from "@/lib/gallery/gate-key";
import { createSessionGate } from "@/lib/gate/create-session-gate";

export const useStageGate = createSessionGate(STAGE_GATE_SESSION_KEY, expectedStageDigest);

export const useGalleryGate = createSessionGate(GALLERY_GATE_SESSION_KEY, expectedGalleryDigest);

export const useGalleryBgGate = createSessionGate(GALLERY_BG_GATE_SESSION_KEY, expectedStageDigest);
