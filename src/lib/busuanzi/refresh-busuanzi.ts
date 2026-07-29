const SCRIPT_ID = "busuanzi-pure-mini";
const SCRIPT_SRC = "https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js";

/** 重新拉取不蒜子计数（带 cache-bust，供 SPA 路由变化后按当前 URL 重计） */
export const refreshBusuanzi = () => {
  const prev = document.getElementById(SCRIPT_ID);
  prev?.remove();

  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.async = true;
  script.src = `${SCRIPT_SRC}?t=${Date.now()}`;
  document.body.appendChild(script);
};
