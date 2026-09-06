#!/usr/bin/env bash
# VRT を CI とまったく同じ Chromium・同じフォント環境で走らせるラッパー。
#
# 基準画像はレンダリング環境に強く依存するので、撮る場所と検証する場所を必ず揃える。
# CI（.github/workflows/ci.yml の vrt ジョブ）もこの同じイメージを使う。
#
#   ./scripts/vrt-docker.sh            # 検証
#   ./scripts/vrt-docker.sh --update   # 基準画像の撮り直し
#
# イメージのタグは package.json の @playwright/test のバージョンと必ず一致させること。
set -euo pipefail

IMAGE="mcr.microsoft.com/playwright:v1.58.2-noble"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"

MODE="vrt"
if [[ "${1:-}" == "--update" ]]; then
  MODE="vrt:update"
fi

docker run --rm -it \
  -v "${REPO_ROOT}:/work" \
  -w /work \
  "${IMAGE}" \
  bash -lc "
    corepack enable &&
    pnpm install --frozen-lockfile &&
    pnpm --filter @taku-biyori/shared build &&
    pnpm --filter @taku-biyori/frontend ${MODE}
  "
