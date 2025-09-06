# Stay Sync - Docker & Kubernetes Deployment Guide

This guide covers deploying the Stay Sync educational assessment platform using Docker and Kubernetes.

## 🏗️ Architecture Overview

- **Backend**: Flask API with MongoDB and Redis
- **Frontend**: React SPA with Nginx
- **Database**: MongoDB with persistent storage
- **Cache**: Redis for session management
- **Load Balancer**: Nginx Ingress Controller
- **SSL**: Let's Encrypt certificates

## 📋 Prerequisites

### Local Development
- Docker & Docker Compose
- Node.js 18+ (for frontend development)
- Python 3.10+ (for backend development)

### Production Deployment
- Kubernetes cluster (1.20+)
- Helm 3.0+
- kubectl configured
- Nginx Ingress Controller
- cert-manager (for SSL certificates)

## 🚀 Quick Start

### Local Development with Docker Compose

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd staysync
   ```

2. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Start the application**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost
   - Backend API: http://localhost:8000
   - MongoDB: localhost:27017
   - Redis: localhost:6379

### Production Deployment with Kubernetes

1. **Prepare your Kubernetes cluster**
   ```bash
   # Install Nginx Ingress Controller
   kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/cloud/deploy.yaml
   
   # Install cert-manager
   kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
   ```

2. **Create namespace and secrets**
   ```bash
   kubectl apply -f k8s/namespace.yaml
   kubectl apply -f k8s/secrets.yaml
   kubectl apply -f k8s/configmap.yaml
   ```

3. **Deploy with Helm**
   ```bash
   # Add Bitnami Helm repository
   helm repo add bitnami https://charts.bitnami.com/bitnami
   helm repo update
   
   # Install dependencies
   helm dependency update helm/staysync
   
   # Deploy the application
   helm install staysync ./helm/staysync \
     --namespace staysync \
     --create-namespace \
     --values helm/staysync/values.yaml
   ```

4. **Deploy with Kubernetes manifests**
   ```bash
   kubectl apply -f k8s/mongodb.yaml
   kubectl apply -f k8s/redis.yaml
   kubectl apply -f k8s/backend.yaml
   kubectl apply -f k8s/frontend.yaml
   kubectl apply -f k8s/ingress.yaml
   ```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://admin:password123@mongodb:27017/staysync?authSource=admin` |
| `JWT_SECRET_KEY` | JWT signing key | `your-super-secret-jwt-key-change-in-production` |
| `AWS_ACCESS_KEY_ID` | AWS S3 access key | - |
| `AWS_SECRET_ACCESS_KEY` | AWS S3 secret key | - |
| `AWS_S3_BUCKET` | S3 bucket name | - |
| `BREVO_API_KEY` | Email service API key | - |
| `CORS_ORIGINS` | Allowed CORS origins | `https://staysync.pydahsoft.in,https://crt.pydahsoft.in` |

### Kubernetes Secrets

Create secrets for sensitive data:

```bash
kubectl create secret generic staysync-secrets \
  --from-literal=mongodb-uri="mongodb://admin:password123@mongodb:27017/staysync?authSource=admin" \
  --from-literal=jwt-secret-key="your-super-secret-jwt-key" \
  --from-literal=aws-access-key-id="your-aws-key" \
  --from-literal=aws-secret-access-key="your-aws-secret" \
  --from-literal=aws-s3-bucket="your-bucket" \
  --from-literal=brevo-api-key="your-brevo-key" \
  --namespace=staysync
```

## 🐳 Docker Commands

### Build Images
```bash
# Build backend
docker build -t staysync-backend:latest ./backend

# Build frontend
docker build -t staysync-frontend:latest ./frontend
```

### Run Locally
```bash
# Development
docker-compose up -d

# Production
docker-compose -f docker-compose.prod.yml up -d
```

### Push to Registry
```bash
# Tag images
docker tag staysync-backend:latest ghcr.io/your-org/staysync-backend:latest
docker tag staysync-frontend:latest ghcr.io/your-org/staysync-frontend:latest

# Push images
docker push ghcr.io/your-org/staysync-backend:latest
docker push ghcr.io/your-org/staysync-frontend:latest
```

## ☸️ Kubernetes Commands

### Basic Operations
```bash
# Check pods
kubectl get pods -n staysync

# Check services
kubectl get services -n staysync

# Check ingress
kubectl get ingress -n staysync

# View logs
kubectl logs -f deployment/staysync-backend -n staysync
kubectl logs -f deployment/staysync-frontend -n staysync
```

### Scaling
```bash
# Scale backend
kubectl scale deployment staysync-backend --replicas=5 -n staysync

# Scale frontend
kubectl scale deployment staysync-frontend --replicas=3 -n staysync
```

### Updates
```bash
# Update image
kubectl set image deployment/staysync-backend backend=staysync-backend:v2.0.0 -n staysync

# Rolling update
kubectl rollout restart deployment/staysync-backend -n staysync
kubectl rollout restart deployment/staysync-frontend -n staysync
```

## 🔍 Monitoring & Troubleshooting

### Health Checks
- Backend: `http://api.staysync.pydahsoft.in/health`
- Frontend: `http://staysync.pydahsoft.in/health`

### Common Issues

1. **Pod not starting**
   ```bash
   kubectl describe pod <pod-name> -n staysync
   kubectl logs <pod-name> -n staysync
   ```

2. **Service not accessible**
   ```bash
   kubectl get endpoints -n staysync
   kubectl describe service <service-name> -n staysync
   ```

3. **Ingress not working**
   ```bash
   kubectl describe ingress staysync-ingress -n staysync
   kubectl get ingressclass
   ```

### Performance Tuning

1. **Resource Limits**
   - Backend: 1GB RAM, 500m CPU
   - Frontend: 256MB RAM, 200m CPU
   - MongoDB: 1GB RAM, 500m CPU
   - Redis: 256MB RAM, 200m CPU

2. **Horizontal Pod Autoscaling**
   - Backend: 3-10 replicas
   - Frontend: 2-5 replicas

## 🔒 Security

### SSL/TLS
- Automatic SSL certificates via Let's Encrypt
- Force HTTPS redirect
- Security headers configured

### Network Policies
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: staysync-network-policy
  namespace: staysync
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
  egress:
  - to: []
    ports:
    - protocol: TCP
      port: 443
    - protocol: TCP
      port: 80
```

## 📊 CI/CD Pipeline

The repository includes GitHub Actions workflows for:
- Docker image building and pushing
- Kubernetes deployment
- Automated testing

### Workflow Triggers
- `main` branch: Production deployment
- `develop` branch: Staging deployment
- Tags: Release deployment

## 🆘 Support

For issues and support:
- Create an issue in the repository
- Contact: support@pydahsoft.in
- Documentation: https://docs.pydahsoft.in

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.
