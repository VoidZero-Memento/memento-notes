from pathlib import Path

from fontTools.ttLib import TTFont

fonts_dir = Path(__file__).resolve().parents[1] / "public" / "fonts"
names = ["LXGWWenKai-Regular.ttf", "LXGWWenKaiMono-Regular.ttf"]

for name in names:
    src = fonts_dir / name
    dst = fonts_dir / f"{src.stem}.woff2"
    print(f"converting {src.name} ({src.stat().st_size / 1024 / 1024:.2f} MB) ...")
    font = TTFont(str(src))
    font.flavor = "woff2"
    font.save(str(dst))
    print(f"  -> {dst.name} ({dst.stat().st_size / 1024 / 1024:.2f} MB)")
