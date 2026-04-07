#!/bin/bash
set -e
PROJECT_DIR="/c/Users/ikapo/Desktop/itako"
cd "$PROJECT_DIR"
TEMP_DIR=$(mktemp -d)
TARBALL="$TEMP_DIR/project.tgz"
STAGING_DIR="$TEMP_DIR/staging"
mkdir -p "$STAGING_DIR"

echo "Staging project files..." >&2
tar --exclude='node_modules' \
    --exclude='.git' \
    --exclude='.env' \
    --exclude='.env.*' \
    --exclude='dist' \
    --exclude='tmp' \
    --exclude='.agents' \
    --exclude='filelist.txt' \
    --exclude='lint.json' \
    --exclude='diff.txt' \
    --exclude='sync_log.txt' \
    --exclude='author_mapping.txt' \
    --exclude='build_err.log' \
    --exclude='tmp_deploy.sh' \
    --exclude='script.ps1' \
    --exclude='_temp_design.md' \
    -cf - . | tar -C "$STAGING_DIR" -xf -

echo "Creating deployment package..." >&2
tar -czf "$TARBALL" -C "$STAGING_DIR" .
ls -lh "$TARBALL" >&2

echo "Deploying to Vercel..." >&2
RESPONSE=$(curl -s -X POST "https://claude-skills-deploy.vercel.com/api/deploy" \
    -F "file=@$TARBALL" \
    -F "framework=vite")

echo "Raw response: $RESPONSE" >&2

if echo "$RESPONSE" | grep -q '"error"'; then
    echo "Error from Vercel: $RESPONSE" >&2
    rm -rf "$TEMP_DIR"
    exit 1
fi

PREVIEW_URL=$(echo "$RESPONSE" | grep -o '"previewUrl":"[^"]*"' | cut -d'"' -f4)
CLAIM_URL=$(echo "$RESPONSE" | grep -o '"claimUrl":"[^"]*"' | cut -d'"' -f4)

echo "" >&2
echo "✓ Deployment triggered!" >&2
echo "" >&2
echo "Preview URL: $PREVIEW_URL" >&2
echo "Claim URL:   $CLAIM_URL" >&2

rm -rf "$TEMP_DIR"
echo "$RESPONSE"
