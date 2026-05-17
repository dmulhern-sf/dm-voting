#!/usr/bin/env python3
"""Remove white/near-white background from claude-robot.png."""

import struct, zlib, sys
from pathlib import Path

SRC = Path(__file__).parent / "claude-robot.png"
DST = Path(__file__).parent / "claude-robot-transparent.png"

# ── PNG read helpers ──────────────────────────────────────────────────────────

def read_chunks(data):
    pos = 8  # skip PNG signature
    chunks = []
    while pos < len(data):
        length = struct.unpack(">I", data[pos:pos+4])[0]
        ctype  = data[pos+4:pos+8].decode("ascii")
        cdata  = data[pos+8:pos+8+length]
        chunks.append((ctype, cdata))
        pos += 12 + length
    return chunks

def parse_ihdr(cdata):
    w, h = struct.unpack(">II", cdata[:8])
    bit_depth, color_type = cdata[8], cdata[9]
    return w, h, bit_depth, color_type

# PNG filter reconstruction (left-to-right, Paeth per spec)
def paeth(a, b, c):
    p = a + b - c
    pa, pb, pc = abs(p-a), abs(p-b), abs(p-c)
    if pa <= pb and pa <= pc: return a
    if pb <= pc: return b
    return c

def defilter(raw, w, bpp):
    stride = w * bpp
    out = bytearray()
    prev = bytearray(stride)
    for y in range(len(raw) // (stride + 1)):
        row_start = y * (stride + 1)
        f = raw[row_start]
        row = bytearray(raw[row_start+1:row_start+1+stride])
        if f == 0: pass
        elif f == 1:
            for x in range(bpp, stride):
                row[x] = (row[x] + row[x-bpp]) & 0xFF
        elif f == 2:
            for x in range(stride):
                row[x] = (row[x] + prev[x]) & 0xFF
        elif f == 3:
            for x in range(stride):
                a = row[x-bpp] if x >= bpp else 0
                row[x] = (row[x] + (a + prev[x]) // 2) & 0xFF
        elif f == 4:
            for x in range(stride):
                a = row[x-bpp] if x >= bpp else 0
                b = prev[x]
                c = prev[x-bpp] if x >= bpp else 0
                row[x] = (row[x] + paeth(a, b, c)) & 0xFF
        else:
            raise ValueError(f"Unknown filter {f}")
        out += row
        prev = row
    return out

def refilter(pixels, w, bpp):
    """Re-filter with filter type 0 (None) — simple, no loss."""
    stride = w * bpp
    out = bytearray()
    for y in range(len(pixels) // stride):
        out += b'\x00'
        out += pixels[y*stride:(y+1)*stride]
    return bytes(out)

def write_png(w, h, rgba_pixels, dst):
    def chunk(ctype, data):
        c = ctype.encode() + data
        return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xFFFFFFFF)

    sig   = b'\x89PNG\r\n\x1a\n'
    ihdr  = chunk("IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0))
    raw   = refilter(rgba_pixels, w, 4)
    idat  = chunk("IDAT", zlib.compress(raw, 9))
    iend  = chunk("IEND", b"")
    dst.write_bytes(sig + ihdr + idat + iend)

# ── Main ──────────────────────────────────────────────────────────────────────

data   = SRC.read_bytes()
assert data[:8] == b'\x89PNG\r\n\x1a\n', "Not a PNG"

chunks = read_chunks(data)
by_type = {c: d for c, d in chunks}

w, h, bit_depth, color_type = parse_ihdr(by_type["IHDR"])
assert bit_depth == 8, f"Only 8-bit supported, got {bit_depth}"

# Collect and decompress IDAT
idat_data = b"".join(d for c, d in chunks if c == "IDAT")
raw = bytearray(zlib.decompress(idat_data))

# color_type: 2=RGB, 6=RGBA
if color_type == 6:
    bpp, has_alpha = 4, True
elif color_type == 2:
    bpp, has_alpha = 3, False
else:
    sys.exit(f"Unsupported color type {color_type}")

pixels = defilter(raw, w, bpp)

# Build RGBA output
rgba = bytearray(w * h * 4)
for i in range(w * h):
    src_off = i * bpp
    dst_off = i * 4
    r, g, b = pixels[src_off], pixels[src_off+1], pixels[src_off+2]
    a = pixels[src_off+3] if has_alpha else 255
    if r > 230 and g > 230 and b > 230:
        a = 0
    rgba[dst_off:dst_off+4] = (r, g, b, a)

write_png(w, h, bytes(rgba), DST)
print(f"Saved: {DST}  ({w}x{h}, {color_type=}, {bpp=})")
