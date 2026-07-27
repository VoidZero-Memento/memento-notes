import { useEffect, useId, useState } from "react";

import styles from "./MermaidBlock.module.css";

type MermaidBlockProps = {
  chart: string;
};

export const MermaidBlock = ({ chart }: MermaidBlockProps) => {
  const reactId = useId().replace(/:/g, "");
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const renderChart = async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          securityLevel: "loose",
          fontFamily: "inherit",
        });

        const { svg: rendered } = await mermaid.render(`mermaid-${reactId}`, chart);
        if (!cancelled) {
          setSvg(rendered);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setSvg(null);
          setError(err instanceof Error ? err.message : "Mermaid 渲染失败");
        }
      }
    };

    void renderChart();
    return () => {
      cancelled = true;
    };
  }, [chart, reactId]);

  return (
    <div className={styles.wrap}>
      {error ? <p className={styles.error}>{error}</p> : null}
      {!error && !svg ? <p className={styles.status}>图表渲染中…</p> : null}
      {svg ? <div className={styles.chart} dangerouslySetInnerHTML={{ __html: svg }} /> : null}
    </div>
  );
};
