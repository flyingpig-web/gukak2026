#!/usr/bin/env python3
"""img/ 폴더를 스캔해 js/preload-manifest.js 를 재생성한다.
이미지 추가/삭제/이동 후 프로젝트 루트(gukak-AR5)에서 실행:
    python3 scripts/gen-preload-manifest.py
매니페스트는 화면 흐름 순서로 정리되며, js/common.js 의
AR.prefetchFlow() 가 유휴 시간에 다음 화면 이미지를 미리 받는 데 쓴다.
"""
import os, json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = "img"
EXT = (".png", ".jpg", ".jpeg", ".webp", ".gif")

# 화면 → 이미지 폴더 (허브 흐름 순서)
FLOW = [
    ("index.html", "01_title"),
    ("main.html", "02_main"),
    ("exp1.html", "03_exp1"),
]
COMMON = "00_common"


def imgs(folder):
    d = os.path.join(ROOT, IMG, folder)
    if not os.path.isdir(d):
        return []
    return [f"{IMG}/{folder}/{f}" for f in sorted(os.listdir(d)) if f.lower().endswith(EXT)]


def main():
    manifest = {
        "common": imgs(COMMON),
        "flow": [{"page": p, "images": imgs(f)} for p, f in FLOW],
    }
    js = (
        "/* 자동 생성: img/ 폴더 스캔 결과. 이미지 추가/삭제 시\n"
        "   `python3 scripts/gen-preload-manifest.py` 로 재생성.\n"
        "   화면 흐름 순서의 전체 이미지 매니페스트(전역 프리페치용). */\n"
        "window.AR_MANIFEST = " + json.dumps(manifest, indent=2, ensure_ascii=False) + ";\n"
    )
    out = os.path.join(ROOT, "js", "preload-manifest.js")
    with open(out, "w", encoding="utf-8") as f:
        f.write(js)
    total = len(manifest["common"]) + sum(len(x["images"]) for x in manifest["flow"])
    print(f"wrote {out} ({total} images)")


if __name__ == "__main__":
    main()
