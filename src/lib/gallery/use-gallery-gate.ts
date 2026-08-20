import { GALLERY_BG_GATE_SESSION_KEY, GALLERY_GATE_SESSION_KEY } from "@/lib/gallery/constants";
import { expectedGalleryDigest } from "@/lib/gallery/gate-key";
import { createSessionGate } from "@/lib/gate/create-session-gate";

export const useGalleryGate = createSessionGate(GALLERY_GATE_SESSION_KEY, expectedGalleryDigest);

export const useGalleryBgGate = createSessionGate(GALLERY_BG_GATE_SESSION_KEY, expectedGalleryDigest);
