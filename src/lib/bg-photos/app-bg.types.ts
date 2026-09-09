export type AppBgContextValue = {
  ready: boolean;
  immersive: boolean;
  advance: () => void;
  setImmersive: (next: boolean) => void;
};
