# Kubernetes Deployment Guide

This directory contains Kubernetes manifests for deploying the TerranXT SCADA Frontend with automatic HTTPS.

## Prerequisites

1. **Kubernetes cluster** (AKS, EKS, GKE, or any Kubernetes cluster)
2. **kubectl** configured to access your cluster
3. **NGINX Ingress Controller** installed
4. **cert-manager** installed for automatic HTTPS certificates

## Installation Steps

### 1. Install NGINX Ingress Controller

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml
```

Or for Azure AKS:
```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml
```

### 2. Install cert-manager

```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.3/cert-manager.yaml
```

Wait for cert-manager to be ready:
```bash
kubectl wait --for=condition=ready pod -l app.kubernetes.io/instance=cert-manager -n cert-manager --timeout=300s
```

### 3. Create ACR Secret

Create the secret to pull images from Azure Container Registry:

```bash
# Get ACR credentials
ACR_NAME="sheesham"
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query passwords[0].value -o tsv)

# Create Kubernetes secret
kubectl create secret docker-registry acr-secret \
  --docker-server=sheesham.azurecr.io \
  --docker-username=$ACR_USERNAME \
  --docker-password=$ACR_PASSWORD \
  --docker-email=mubashshir.uddin@terranxt.com \
  --dry-run=client -o yaml | kubectl apply -f -
```

### 4. Update Configuration Files

Before deploying, update the following files:

1. **deployment.yaml**: Update `REACT_APP_API_URL` with your backend API URL
2. **ingress.yaml**: Replace `your-domain.com` with your actual domain name
3. **cert-manager-issuer.yaml**: Replace `your-email@example.com` with your email address

### 5. Deploy cert-manager ClusterIssuer

```bash
kubectl apply -f k8s/cert-manager-issuer.yaml
```

### 6. Deploy the Application

```bash
# Deploy in order
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
```

### 7. Verify Deployment

Check if pods are running:
```bash
kubectl get pods -l app=terranxt-scada-frontend
```

Check the ingress:
```bash
kubectl get ingress terranxt-scada-frontend-ingress
```

Check certificate status:
```bash
kubectl describe certificate terranxt-scada-frontend-tls
```

### 8. Get the External IP/Domain

For Azure AKS with NGINX Ingress:
```bash
kubectl get service ingress-nginx-controller -n ingress-nginx
```

Update your DNS to point your domain to the external IP address.

## Troubleshooting

### Check pod logs
```bash
kubectl logs -l app=terranxt-scada-frontend
```

### Check ingress controller logs
```bash
kubectl logs -n ingress-nginx -l app.kubernetes.io/component=controller
```

### Check cert-manager logs
```bash
kubectl logs -n cert-manager -l app.kubernetes.io/instance=cert-manager
```

### Test certificate issuance
If certificates aren't being issued, check:
```bash
kubectl describe certificate terranxt-scada-frontend-tls
kubectl describe certificaterequest -l app=terranxt-scada-frontend
kubectl describe challenge -l app=terranxt-scada-frontend
```

## Updating the Application

After building and pushing a new image:

```bash
# Build and push new image
az acr login --name sheesham
docker build -t sheesham.azurecr.io/terranxt-scada-frontend:latest .
docker push sheesham.azurecr.io/terranxt-scada-frontend:latest

# Restart deployment to pull new image
kubectl rollout restart deployment terranxt-scada-frontend
```

## Notes

- The deployment uses 2 replicas for high availability
- Health checks are configured at `/health` endpoint
- Automatic HTTPS is enabled via cert-manager and Let's Encrypt
- Certificates are automatically renewed before expiration
- Make sure your domain DNS is properly configured before deploying


