#!/usr/bin/env bash
# Regenerate PWA icons in public/icons/ from the SVG sources.
# Requirements: rsvg-convert (librsvg), ImageMagick (for favicon.ico).
set -euo pipefail
cd "$(dirname "$0")/.."

OUT=public/icons
mkdir -p "$OUT"

rsvg-convert -w 512 -h 512 scripts/pwa-icon.svg -o "$OUT/icon-512.png"
rsvg-convert -w 192 -h 192 scripts/pwa-icon.svg -o "$OUT/icon-192.png"
rsvg-convert -w 512 -h 512 scripts/pwa-icon-maskable.svg -o "$OUT/icon-maskable-512.png"
rsvg-convert -w 180 -h 180 scripts/pwa-icon.svg -o "$OUT/apple-touch-icon.png"
rsvg-convert -w 32 -h 32 scripts/pwa-icon.svg -o "$OUT/favicon-32.png"

magick "$OUT/favicon-32.png" public/favicon.ico

echo "PWA icons written to $OUT"
