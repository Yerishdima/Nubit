#!/bin/sh
# Registers the Nubit native messaging host on macOS / Linux (current user).
# Usage: ./install.sh <EXTENSION_ID>
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
ID="$1"
if [ -z "$ID" ]; then
  printf 'Extension ID (chrome://extensions → Nubit): '
  read -r ID
fi
case "$ID" in
  *[!a-p]*|'') echo "Invalid extension ID: $ID" >&2; exit 1;;
esac
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js not found. Install it from https://nodejs.org and re-run." >&2
  exit 1
fi
chmod +x "$HERE/host.sh"
MANIFEST="$HERE/com.nubit.host.json"
cat > "$MANIFEST" <<EOF
{
  "name": "com.nubit.host",
  "description": "Nubit native host: runs local programs (yt-dlp, ffmpeg, ...) for the Nubit extension",
  "path": "$HERE/host.sh",
  "type": "stdio",
  "allowed_origins": ["chrome-extension://$ID/"]
}
EOF
if [ "$(uname)" = "Darwin" ]; then
  DIRS="$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts
$HOME/Library/Application Support/Chromium/NativeMessagingHosts
$HOME/Library/Application Support/Microsoft Edge/NativeMessagingHosts
$HOME/Library/Application Support/BraveSoftware/Brave-Browser/NativeMessagingHosts"
else
  DIRS="$HOME/.config/google-chrome/NativeMessagingHosts
$HOME/.config/chromium/NativeMessagingHosts
$HOME/.config/microsoft-edge/NativeMessagingHosts
$HOME/.config/BraveSoftware/Brave-Browser/NativeMessagingHosts"
fi
echo "$DIRS" | while IFS= read -r d; do
  mkdir -p "$d"
  cp "$MANIFEST" "$d/com.nubit.host.json"
done
echo "Nubit native host installed (manifest: $MANIFEST). Reload the extension and press 'Check helper' in its settings."
