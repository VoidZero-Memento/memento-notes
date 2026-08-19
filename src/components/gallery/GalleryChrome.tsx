import fx from "./GalleryFx.module.css";

export const GalleryChrome = () => (
  <div className={fx.chrome} aria-hidden>
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
