import { useEffect, useState } from "react";

const readMatches = (query: string): boolean =>
  typeof window !== "undefined" ? window.matchMedia(query).matches : false;

/** 订阅 matchMedia；首帧同步读取，避免手机先误挂 PC 背景 */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(() => readMatches(query));

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
};
