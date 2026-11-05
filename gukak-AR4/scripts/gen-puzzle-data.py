# -*- coding: utf-8 -*-
"""탈 조각의 정답 위치를 *_align.png 의 알파 bbox 에서 뽑아 js/puzzle-data.js 로 쓴다.
   align 은 완성 탈(full)과 같은 캔버스라 bbox 를 캔버스 비율(0~1)로 내면
   화면에 배치한 full 사각형 위에 그대로 얹힌다. 조각(여백 잘라낸 버전)의 크기도
   align bbox 와 같으므로 드래그용 조각의 표시 크기도 여기서 나온다."""
import os, json, struct, zlib, sys

IMG = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "img", "03_exp1")

MASKS = {
    "yangban": ["piece1_hat", "piece2_face", "piece3_beard", "piece4_string_left", "piece5_string_right"],
    "somae":   ["piece1_hair", "piece2_face", "piece3_eyes", "piece4_nose_mouth", "piece5_dots"],
    "sisi":    ["piece1_hair", "piece2_face", "piece3_eyes", "piece4_nose_mouth", "piece5_pattern"],
}

def read_png_alpha(path):
    """순수 파이썬 PNG(RGBA, 8bit) 디코더 — 알파 채널만 돌려준다."""
    d = open(path, "rb").read()
    assert d[:8] == b"\x89PNG\r\n\x1a\n", path
    pos, idat, w, h, bitd, ctype = 8, b"", 0, 0, 0, 0
    while pos < len(d):
        ln = struct.unpack(">I", d[pos:pos+4])[0]
        typ = d[pos+4:pos+8]
        data = d[pos+8:pos+8+ln]
        if typ == b"IHDR":
            w, h, bitd, ctype = struct.unpack(">IIBB", data[:10])
        elif typ == b"IDAT":
            idat += data
        elif typ == b"IEND":
            break
        pos += 12 + ln
    if ctype != 6 or bitd != 8:
        raise SystemExit("RGBA8 아님: %s (ctype=%d bit=%d)" % (path, ctype, bitd))
    raw = zlib.decompress(idat)
    bpp, stride = 4, w * 4
    out = bytearray(h * stride)
    prev = bytearray(stride)
    p = 0
    for y in range(h):
        ft = raw[p]; p += 1
        line = bytearray(raw[p:p+stride]); p += stride
        if ft == 1:
            for i in range(bpp, stride): line[i] = (line[i] + line[i-bpp]) & 255
        elif ft == 2:
            for i in range(stride): line[i] = (line[i] + prev[i]) & 255
        elif ft == 3:
            for i in range(stride):
                a = line[i-bpp] if i >= bpp else 0
                line[i] = (line[i] + ((a + prev[i]) >> 1)) & 255
        elif ft == 4:
            for i in range(stride):
                a = line[i-bpp] if i >= bpp else 0
                b = prev[i]
                c = prev[i-bpp] if i >= bpp else 0
                pa, pb, pc = abs(b-c), abs(a-c), abs(a+b-2*c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[i] = (line[i] + pr) & 255
        out[y*stride:(y+1)*stride] = line
        prev = line
    return w, h, bytes(out)

def alpha_bbox(w, h, rgba, thr=8):
    x0, y0, x1, y1 = w, h, -1, -1
    for y in range(h):
        row = rgba[y*w*4:(y+1)*w*4]
        al = row[3::4]
        xs = [i for i, v in enumerate(al) if v > thr]
        if not xs: continue
        if y < y0: y0 = y
        y1 = y
        if xs[0] < x0: x0 = xs[0]
        if xs[-1] > x1: x1 = xs[-1]
    return x0, y0, x1 - x0 + 1, y1 - y0 + 1

out = {}
for mask, pieces in MASKS.items():
    folder = os.path.join(IMG, "puzzle_" + mask)
    fw, fh, _ = read_png_alpha(os.path.join(folder, "%s_full.png" % mask))
    items = []
    for i, name in enumerate(pieces, 1):
        ap = os.path.join(folder, "%s_%s_align.png" % (mask, name))
        w, h, rgba = read_png_alpha(ap)
        if (w, h) != (fw, fh):
            print("  ! 캔버스 불일치 %s %dx%d (full %dx%d)" % (ap, w, h, fw, fh))
        x, y, bw, bh = alpha_bbox(w, h, rgba)
        # 드래그용 조각(여백 잘라낸 버전)도 알파 bbox 를 재서, 그 bbox 가 정답 bbox 와
        # 겹치도록 "조각 이미지 전체를 그릴 사각형(fit)" 을 미리 계산해 둔다.
        pw, ph, prgba = read_png_alpha(os.path.join(folder, "%s_%s.png" % (mask, name)))
        px, py, pbw, pbh = alpha_bbox(pw, ph, prgba)
        sc = bw / pbw
        if abs(sc - bh / pbh) > 0.02:
            print("  ! 조각/정답 비율 불일치 %s_%s (%.3f vs %.3f)" % (mask, name, sc, bh / pbh))
        items.append(dict(
            id=name, n=i,
            x=round(x / fw, 5), y=round(y / fh, 5), w=round(bw / fw, 5), h=round(bh / fh, 5),
            fit=dict(x=round((x - px * sc) / fw, 5), y=round((y - py * sc) / fh, 5),
                     w=round(pw * sc / fw, 5), h=round(ph * sc / fh, 5)),
            px=[x, y, bw, bh], piece=[pw, ph, px, py, pbw, pbh]))
        print("  %-10s %-18s 정답=(%4d,%4d) %4dx%-4d  조각=%4dx%-4d(bbox %4dx%-4d) 배율=%.3f"
              % (mask, name, x, y, bw, bh, pw, ph, pbw, pbh, sc))
    out[mask] = dict(canvas=[fw, fh], pieces=items)

dst = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "js", "puzzle-data.js")
with open(dst, "w", encoding="utf-8") as f:
    f.write("/* 자동 생성 — scripts/gen-puzzle-data.py (수정하지 말 것)\n")
    f.write("   탈 조각의 정답 위치. x,y,w,h 는 완성 탈(full) 캔버스 기준 비율(0~1).\n")
    f.write("   조각은 n(1→5) 순서로 뒤에서 앞으로 쌓인다. */\n")
    f.write("window.PUZZLE_DATA = " + json.dumps(out, ensure_ascii=False, indent=1) + ";\n")
print("→ js/puzzle-data.js")
