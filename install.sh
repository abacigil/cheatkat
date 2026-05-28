#!/usr/bin/env bash
# Install or upgrade the cheatkat Plasma 6 widget.
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
PKG="$DIR/package"
ID="org.kde.plasma.cheatkat"
LEGACY_ID="org.kde.plasma.kitty-shortcuts"

if ! command -v kpackagetool6 >/dev/null 2>&1; then
    echo "kpackagetool6 not found. This widget requires KDE Plasma 6." >&2
    exit 1
fi

# Clean up older versions of this widget if present
if kpackagetool6 -t Plasma/Applet -l 2>/dev/null | grep -qx "$LEGACY_ID"; then
    echo "Removing legacy package $LEGACY_ID..."
    kpackagetool6 -t Plasma/Applet -r "$LEGACY_ID" || true
fi

if kpackagetool6 -t Plasma/Applet -l 2>/dev/null | grep -qx "$ID"; then
    echo "Upgrading $ID..."
    kpackagetool6 -t Plasma/Applet -u "$PKG"
else
    echo "Installing $ID..."
    kpackagetool6 -t Plasma/Applet -i "$PKG"
fi

echo
echo "Done. Add it via:"
echo "  right-click desktop → Add Widgets → search for 'cheatkat'"
echo
echo "Plasma caches QML aggressively. To pick up changes during development:"
echo "  pkill -9 plasmashell ; sleep 1 ; kstart plasmashell &"
