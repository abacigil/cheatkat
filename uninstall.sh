#!/usr/bin/env bash
set -euo pipefail
ID="org.kde.plasma.cheatkat"
LEGACY_ID="org.kde.plasma.kitty-shortcuts"

if ! command -v kpackagetool6 >/dev/null 2>&1; then
    echo "kpackagetool6 not found." >&2
    exit 1
fi

for id in "$ID" "$LEGACY_ID"; do
    if kpackagetool6 -t Plasma/Applet -l 2>/dev/null | grep -qx "$id"; then
        kpackagetool6 -t Plasma/Applet -r "$id"
    fi
done
echo "Removed cheatkat."
