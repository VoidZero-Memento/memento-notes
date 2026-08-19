import fx from "./GalleryFx.module.css";

type GalleryChromeProps = {
  busy: boolean;
};

export const GalleryChrome = ({ busy }: GalleryChromeProps) => (
  <div className={`${fx.chrome}${busy ? ` ${fx.chromeSwap}` : ""}`} aria-hidden>
    <span className={fx.aura} />
    <span className={fx.track} />
    <span className={fx.planet} />
    <span className={`${fx.planet} ${fx.planetSlow}`} />
    <span className={`${fx.corner} ${fx.cornerTl}`} />
    <span className={`${fx.corner} ${fx.cornerTr}`} />
    <span className={`${fx.corner} ${fx.cornerBl}`} />
    <span className={`${fx.corner} ${fx.cornerBr}`} />
  </div>
);
