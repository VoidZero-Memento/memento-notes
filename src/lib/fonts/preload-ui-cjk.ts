import { OSS_FOLDER_LABELS } from "@/lib/bg-photos/oss-folder";
import { THEME_LABELS } from "@/lib/theme/theme";

const OVERLAY_COPY = ["氛围模式", "背景铺开中"] as const;

const APPEARANCE_COPY = [
  "边框流光",
  "显示背景",
  "循环播放",
  "展台画廊",
  "图集",
  "开",
  "关",
  "已切换至",
  "已开启循环播放",
  "已固定当前背景",
  "已开启边框流光",
  "已关闭边框流光",
  "已显示展台画廊",
  "已隐藏展台画廊",
  "已开启背景图",
  "已关闭背景图",
] as const;

const UI_CJK_SAMPLE = [
  ...new Set(
    [...Object.values(THEME_LABELS), ...Object.values(OSS_FOLDER_LABELS), ...OVERLAY_COPY, ...APPEARANCE_COPY].join(""),
  ),
].join("");

const LXGW_FACE = '16px "LXGWWenKai"';

/** 按 unicode-range 预拉 UI 固定文案对应分包，避免点开菜单时逐字 swap */
export const preloadUiCjkFonts = () => {
  if (typeof document === "undefined" || !document.fonts?.load) return;
  void document.fonts.load(LXGW_FACE, UI_CJK_SAMPLE).catch(() => undefined);
};
