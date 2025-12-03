# PowerShell deployment script for TerranXT SCADA Frontend
# This script builds, pushes, and optionally deploys the application

$ACR_NAME = "sheesham"
$IMAGE_NAME = "terranxt-scada-frontend"
$IMAGE_TAG = "latest"
$FULL_IMAGE_NAME = "${ACR_NAME}.azurecr.io/${IMAGE_NAME}:${IMAGE_TAG}"

Write-Host "=== Logging into Azure Container Registry ===" -ForegroundColor Green
az acr login --name $ACR_NAME

Write-Host "=== Building and pushing Docker image for linux/amd64 ===" -ForegroundColor Green
# Use buildx for reliable cross-platform builds
docker buildx create --use --name multiarch-builder 2>$null
# Build and push directly to ACR with buildx (more reliable for cross-platform)
docker buildx build --platform linux/amd64 -t $FULL_IMAGE_NAME --push .

Write-Host "=== Image pushed successfully ===" -ForegroundColor Green
Write-Host "Image: $FULL_IMAGE_NAME" -ForegroundColor Cyan

# Optional: Deploy to Kubernetes
$deploy = Read-Host "Do you want to deploy to Kubernetes now? (y/n)"
if ($deploy -eq "y" -or $deploy -eq "Y") {
    Write-Host "=== Deploying to Kubernetes ===" -ForegroundColor Green
    kubectl rollout restart deployment terranxt-scada-frontend
    Write-Host "Deployment restarted. Check status with: kubectl get pods -l app=terranxt-scada-frontend" -ForegroundColor Cyan
}


