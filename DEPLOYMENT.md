# Deployment Guide - TerranXT SCADA Frontend

This guide covers Dockerizing, building, pushing, and deploying the frontend application to Kubernetes with automatic HTTPS.

## Quick Start

### 1. Build and Push Docker Image

**Using the provided commands:**
```bash
az acr login --name sheesham
docker build -t sheesham.azurecr.io/terranxt-scada-frontend:latest .
docker push sheesham.azurecr.io/terranxt-scada-frontend:latest
```

**Or use the deployment script:**
- **Linux/Mac:** `bash deploy.sh`
- **Windows PowerShell:** `.\deploy.ps1`

### 2. Kubernetes Deployment

See `k8s/README.md` for detailed Kubernetes deployment instructions.

## Files Created

### Docker Files
- **Dockerfile** - Multi-stage build using Node.js and Nginx
- **.dockerignore** - Excludes unnecessary files from Docker build
- **nginx.conf** - Nginx configuration for serving React SPA

### Kubernetes Files
- **k8s/deployment.yaml** - Kubernetes Deployment manifest
- **k8s/service.yaml** - Kubernetes Service manifest
- **k8s/ingress.yaml** - Ingress with HTTPS configuration (NGINX Ingress)
- **k8s/ingress-azure-appgw.yaml** - Alternative ingress for Azure Application Gateway
- **k8s/cert-manager-issuer.yaml** - Cert-manager ClusterIssuer for Let's Encrypt
- **k8s/acr-secret.yaml** - Template for ACR authentication secret
- **k8s/README.md** - Detailed deployment guide

### Scripts
- **deploy.sh** - Bash deployment script
- **deploy.ps1** - PowerShell deployment script

## Configuration Required

Before deploying, update these values:

1. **k8s/deployment.yaml**
   - `REACT_APP_API_URL`: Set your backend API URL

2. **k8s/ingress.yaml** or **k8s/ingress-azure-appgw.yaml**
   - Replace `your-domain.com` with your actual domain name

3. **k8s/cert-manager-issuer.yaml**
   - Replace `your-email@example.com` with your email address

## Docker Image Details

- **Base Image (Build):** `node:18-alpine`
- **Base Image (Runtime):** `nginx:alpine`
- **Port:** 80
- **Health Check:** `/health` endpoint

## Kubernetes Deployment Features

- ✅ **High Availability:** 2 replicas
- ✅ **Automatic HTTPS:** Cert-manager with Let's Encrypt
- ✅ **Health Checks:** Liveness and readiness probes
- ✅ **Resource Limits:** CPU and memory limits configured
- ✅ **ACR Integration:** Image pull secrets configured
- ✅ **SPA Support:** Nginx configured for React Router

## HTTPS Configuration

The deployment uses **cert-manager** with **Let's Encrypt** for automatic HTTPS:

1. Cert-manager automatically requests certificates
2. Certificates are automatically renewed before expiration
3. HTTP traffic is redirected to HTTPS
4. No manual certificate management required

## Troubleshooting

### Docker Build Issues
- Ensure Docker is running
- Check ACR login: `az acr login --name sheesham`
- Verify Dockerfile syntax

### Kubernetes Deployment Issues
- Check pod status: `kubectl get pods -l app=terranxt-scada-frontend`
- View logs: `kubectl logs -l app=terranxt-scada-frontend`
- Check ingress: `kubectl get ingress`
- Verify certificate: `kubectl describe certificate terranxt-scada-frontend-tls`

### HTTPS Certificate Issues
- Ensure DNS is pointing to your ingress IP
- Check cert-manager logs: `kubectl logs -n cert-manager -l app.kubernetes.io/instance=cert-manager`
- Verify ClusterIssuer: `kubectl get clusterissuer letsencrypt-prod`

## Environment Variables

The application uses the following environment variable:
- `REACT_APP_API_URL`: Backend API URL (set in deployment.yaml)

## Updating the Application

After making changes:

1. Build and push new image:
   ```bash
   docker build -t sheesham.azurecr.io/terranxt-scada-frontend:latest .
   docker push sheesham.azurecr.io/terranxt-scada-frontend:latest
   ```

2. Restart deployment:
   ```bash
   kubectl rollout restart deployment terranxt-scada-frontend
   ```

3. Monitor rollout:
   ```bash
   kubectl rollout status deployment terranxt-scada-frontend
   ```

## Support

For issues or questions, refer to:
- `k8s/README.md` - Detailed Kubernetes deployment guide
- Kubernetes documentation
- cert-manager documentation: https://cert-manager.io/docs/


