import { useEffect, useState } from "react";

import { HALL_DESKTOP_MQ } from "@/lib/gallery/constants";

const readDesktop = () => typeof window !== "undefined" && window.matchMedia(HALL_DESKTOP_MQ).matches;

export const useHallDesktop = () => {
  const [desktop, setDesktop] = useState(readDesktop);

  useEffect(() => {
    const mq = window.matchMedia(HALL_DESKTOP_MQ);
    const sync = () => setDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return desktop;
};
