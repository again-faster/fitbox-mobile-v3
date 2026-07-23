#!/bin/bash
set -euo pipefail

PROJECT_FILE="ios/fitbox.xcodeproj/project.pbxproj"
RUN_NUMBER="${GITHUB_RUN_NUMBER:?GITHUB_RUN_NUMBER is required}"
RUN_ATTEMPT="${GITHUB_RUN_ATTEMPT:-1}"
BUILD_NUMBER=$((RUN_NUMBER * 100 + RUN_ATTEMPT))

echo "Setting CURRENT_PROJECT_VERSION to ${BUILD_NUMBER}"
sed -i '' -E \
  "s/CURRENT_PROJECT_VERSION = [0-9]+;/CURRENT_PROJECT_VERSION = ${BUILD_NUMBER};/g" \
  "$PROJECT_FILE"

if ! grep -q "CURRENT_PROJECT_VERSION = ${BUILD_NUMBER};" "$PROJECT_FILE"; then
  echo "Failed to update CURRENT_PROJECT_VERSION" >&2
  exit 1
fi

if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  echo "build_number=${BUILD_NUMBER}" >> "$GITHUB_OUTPUT"
fi

echo "Build number ${BUILD_NUMBER} will be used for this archive only."
