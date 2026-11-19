# -*- coding: utf-8 -*-
"""활동1 색칠 히트영역 마스크를 만든다 → js/hit-mask.js

   `img/03_exp1/dancer/part/dancer_part_<key>.png` 는 라인아트 전체 위에 그 복식 요소
   하나만 색칠된 1920×1080 그림이다. 라인아트(`dancer_step0_line.png`)와 픽셀을 비교해
   "달라진 곳" = 그 요소의 영역을 뽑고, CELL px 격자로 줄여 비트맵(base64)으로 내보낸다.
   런타임(js/exp1.js)은 터치 좌표를 디자인 1920×1080 좌표로 바꿔 이 비트에서 조회한다.

   PNG 가 Adam7 인터레이스라 파이썬 기본 모듈로는 못 읽는다 → ffmpeg 로 임시 변환해서 읽는다.
   사용: python3 scripts/gen-hit-mask.py   (소스가 다시 납품되면 다시 돌린다)
"""
import os, sys, zlib, struct, base64, subprocess, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, ".."))
DANCER = os.path.join(ROOT, "img", "03_exp1", "dancer")
OUT = os.path.join(ROOT, "js", "hit-mask.js")

KEYS = ["hwangcho", "chorok", "hwagwan", "hongdan", "osaek", "hongcho", "hwamun"]
CELL = 6          # 격자 한 칸(디자인 px) — 1920/6 = 320, 1080/6 = 180
DIFF = 40         # RGBA 채널 차이 합이 이 값을 넘으면 "색이 칠해진 픽셀"
MIN_HITS = 4      # 한 칸 안에 색칠 픽셀이 이만큼 있으면 그 칸을 1 로 둔다


def flatten(src, tmpdir):
    """인터레이스 PNG → 평범한 RGBA PNG"""
    dst = os.path.join(tmpdir, os.path.basename(src))
    subprocess.run(["ffmpeg", "-nostdin", "-loglevel", "error", "-y", "-i", src,
                    "-pix_fmt", "rgba", dst], check=True)
    return dst


def read_rgba(path):
    d = open(path, "rb").read()
    assert d[:8] == b"\x89PNG\r\n\x1a\n", path
    pos, idat, w, h, bitd, ctype, interlace = 8, b"", 0, 0, 0, 0, 0
    while pos < len(d):
        ln = struct.unpack(">I", d[pos:pos + 4])[0]
        typ = d[pos + 4:pos + 8]
        data = d[pos + 8:pos + 8 + ln]
        if typ == b"IHDR":
            w, h, bitd, ctype, _, _, interlace = struct.unpack(">IIBBBBB", data)
        elif typ == b"IDAT":
            idat += data
        elif typ == b"IEND":
            break
        pos += 12 + ln
    assert interlace == 0 and bitd == 8 and ctype == 6, path
    raw = zlib.decompress(idat)
    ch, stride = 4, w * 4
    out = bytearray(h * stride)
    prev = bytearray(stride)
    p = 0
    for y in range(h):
        f = raw[p]; p += 1
        line = bytearray(raw[p:p + stride]); p += stride
        if f == 1:
            for i in range(ch, stride): line[i] = (line[i] + line[i - ch]) & 255
        elif f == 2:
            for i in range(stride): line[i] = (line[i] + prev[i]) & 255
        elif f == 3:
            for i in range(stride):
                a = line[i - ch] if i >= ch else 0
                line[i] = (line[i] + ((a + prev[i]) >> 1)) & 255
        elif f == 4:
            for i in range(stride):
                a = line[i - ch] if i >= ch else 0
                b = prev[i]; c = prev[i - ch] if i >= ch else 0
                pp = a + b - c
                pa, pb, pc = abs(pp - a), abs(pp - b), abs(pp - c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[i] = (line[i] + pr) & 255
        out[y * stride:(y + 1) * stride] = line
        prev = line
    return w, h, bytes(out)


def main():
    tmp = tempfile.mkdtemp(prefix="gukak-mask-")
    base_path = os.path.join(DANCER, "dancer_step0_line.png")
    bw, bh, base = read_rgba(flatten(base_path, tmp))
    cols, rows = bw // CELL, bh // CELL
    masks, boxes = {}, {}

    for key in KEYS:
        src = os.path.join(DANCER, "part", "dancer_part_%s.png" % key)
        w, h, px = read_rgba(flatten(src, tmp))
        assert (w, h) == (bw, bh), src
        counts = [0] * (cols * rows)
        x0, y0, x1, y1 = w, h, -1, -1
        for y in range(h):
            row = y * w * 4
            cy = y // CELL
            if cy >= rows: break
            for x in range(w):
                i = row + x * 4
                d = (abs(px[i] - base[i]) + abs(px[i + 1] - base[i + 1]) +
                     abs(px[i + 2] - base[i + 2]) + abs(px[i + 3] - base[i + 3]))
                if d <= DIFF: continue
                cx = x // CELL
                if cx >= cols: continue
                counts[cy * cols + cx] += 1
                if x < x0: x0 = x
                if x > x1: x1 = x
                if y < y0: y0 = y
                if y > y1: y1 = y
        bits = bytearray((cols * rows + 7) // 8)
        on = 0
        for i, c in enumerate(counts):
            if c >= MIN_HITS:
                bits[i >> 3] |= 1 << (i & 7)
                on += 1
        masks[key] = base64.b64encode(bytes(bits)).decode("ascii")
        boxes[key] = (x0, y0, x1 - x0 + 1, y1 - y0 + 1)
        print("%-9s cells %5d / %d   bbox (%4d,%4d) %4dx%-4d" %
              (key, on, cols * rows, x0, y0, x1 - x0 + 1, y1 - y0 + 1))

    with open(OUT, "w", encoding="utf-8") as f:
        f.write("/* 자동 생성 — scripts/gen-hit-mask.py (수정하지 말 것)\n")
        f.write("   활동1 복식 요소의 터치 영역. %dpx 격자 비트맵(base64, 1 = 그 요소).\n" % CELL)
        f.write("   box 는 디자인 1920x1080 좌표의 요소 bbox [x, y, w, h] — 힌트 말풍선 위치 등에 쓴다. */\n")
        f.write("window.AR3_HIT = {\n")
        f.write("  cell: %d, cols: %d, rows: %d,\n" % (CELL, cols, rows))
        f.write("  box: {\n")
        for k in KEYS:
            f.write("    %s: [%d, %d, %d, %d],\n" % ((k,) + boxes[k]))
        f.write("  },\n  mask: {\n")
        for k in KEYS:
            f.write('    %s: "%s",\n' % (k, masks[k]))
        f.write("  },\n};\n")
    print("→", OUT)


if __name__ == "__main__":
    main()
