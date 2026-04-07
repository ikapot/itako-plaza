# Itako News-Trade System V2 - Cloud Run Deploy Script
$PROJECT_ID = "itako-plaza-kenji"
$REGION = "asia-northeast1"
$SERVICE_NAME = "itako-news-trade"

# gcloud の場所を特定（パスにない場合への配慮）
$GCLOUD_BIN = "gcloud"
$FALLBACK_PATH = "$HOME\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"

if (!(Get-Command $GCLOUD_BIN -ErrorAction SilentlyContinue)) {
    if (Test-Path $FALLBACK_PATH) {
        $GCLOUD_BIN = $FALLBACK_PATH
        Write-Host "🔍 Found gcloud at absolute path: $GCLOUD_BIN" -ForegroundColor Magenta
    } else {
        Write-Host "❌ Error: gcloud not found in PATH or at the common install location." -ForegroundColor Red
        exit 1
    }
}

Write-Host "🚀 Preparing deployment for $SERVICE_NAME to project $PROJECT_ID..." -ForegroundColor Cyan

# Set current project
& $GCLOUD_BIN config set project $PROJECT_ID

# Define the secrets sequence for Cloud Run
$SECRETS = "WALLET_API_KEY=WALLET_API_KEY:latest," + `
           "WALLET_API_SECRET=WALLET_API_SECRET:latest," + `
           "OPENROUTER_API_KEY=OPENROUTER_API_KEY:latest," + `
           "DISCORD_WEBHOOK_URL=DISCORD_WEBHOOK_URL:latest"

Write-Host "📦 Initializing Cloud Run deployment with Secret Manager integration..." -ForegroundColor Yellow

# Execute Deployment
& $GCLOUD_BIN run deploy $SERVICE_NAME `
  --source . `
  --region $REGION `
  --set-secrets=$SECRETS `
  --allow-unauthenticated

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deployment Successful!" -ForegroundColor Green
    Write-Host "---"
    Write-Host "💡 Note: Ensure your Cloud Run service account has 'Secret Manager Secret Accessor' role."
} else {
    Write-Host "❌ Deployment Failed with exit code $LASTEXITCODE" -ForegroundColor Red
}
