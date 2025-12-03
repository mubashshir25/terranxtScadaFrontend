#!/bin/bash

# Deployment script for TerranXT SCADA Frontend
# This script builds, pushes, and optionally deploys the application

set -e

ACR_NAME="sheesham"
IMAGE_NAME="terranxt-scada-frontend"
IMAGE_TAG="latest"
FULL_IMAGE_NAME="${ACR_NAME}.azurecr.io/${IMAGE_NAME}:${IMAGE_TAG}"

echo "=== Setting up Docker buildx for cross-platform builds ==="
docker buildx create --use --name multiarch-builder 2>/dev/null || true

echo "=== Building Docker image for linux/amd64 ==="
# Use buildx for reliable cross-platform builds
docker buildx build --platform linux/amd64 -t ${FULL_IMAGE_NAME} --load .

echo "=== Logging into Azure Container Registry ==="
az acr login --name ${ACR_NAME}

echo "=== Pushing image to ACR ==="
docker push ${FULL_IMAGE_NAME}

echo "=== Image pushed successfully ==="
echo "Image: ${FULL_IMAGE_NAME}"

# Optional: Deploy to Kubernetes
read -p "Do you want to deploy to Kubernetes now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "=== Deploying to Kubernetes ==="
    kubectl rollout restart deployment terranxt-scada-frontend
    echo "Deployment restarted. Check status with: kubectl get pods -l app=terranxt-scada-frontend"
fi


