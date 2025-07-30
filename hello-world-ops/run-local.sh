#!/bin/bash

echo "🚀 Setting up local Kubernetes deployment with monitoring..."

# Check if minikube is installed
if ! command -v minikube &> /dev/null; then
    echo "❌ Minikube not found. Installing..."
    curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
    sudo install minikube-linux-amd64 /usr/local/bin/minikube
    rm minikube-linux-amd64
fi

# Start minikube
echo "🔧 Starting minikube..."
minikube start

# Set docker environment to use minikube's docker daemon
echo "🐳 Configuring Docker environment..."
eval $(minikube docker-env)

# Install dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Build Docker image
echo "🏗️ Building Docker image..."
docker build -t hello-world-ops:latest .

# Apply Kubernetes manifests
echo "📦 Deploying to Kubernetes..."
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml

# Deploy monitoring stack
echo "📊 Deploying monitoring stack..."
kubectl apply -f k8s/prometheus-config.yaml
kubectl apply -f k8s/prometheus-deployment.yaml
kubectl apply -f k8s/prometheus-service.yaml
kubectl apply -f k8s/grafana-datasources.yaml
kubectl apply -f k8s/grafana-dashboards.yaml
kubectl apply -f k8s/grafana-deployment.yaml
kubectl apply -f k8s/grafana-service.yaml

# Wait for deployment to be ready
echo "⏳ Waiting for deployment to be ready..."
kubectl rollout status deployment/hello-world-ops -n hello-world-ops --timeout=300s
kubectl rollout status deployment/prometheus -n hello-world-ops --timeout=300s
kubectl rollout status deployment/grafana -n hello-world-ops --timeout=300s

# Show deployment status
echo "📊 Deployment status:"
kubectl get pods -n hello-world-ops
kubectl get svc -n hello-world-ops

# Get the service URLs
echo "🌐 Service URLs:"
echo "Application:"
minikube service hello-world-ops-service -n hello-world-ops --url
echo ""
echo "Grafana:"
minikube service grafana-service -n hello-world-ops --url
echo ""
echo "Prometheus:"
kubectl port-forward svc/prometheus-service 9090:9090 -n hello-world-ops &
echo "http://localhost:9090"

echo ""
echo "✅ Deployment complete!"
echo "🔍 Application: Use 'minikube service hello-world-ops-service -n hello-world-ops' to open the app"
echo "📊 Grafana: Use 'minikube service grafana-service -n hello-world-ops' to open Grafana"
echo "   Username: admin, Password: admin123"
echo "🔍 To check logs: kubectl logs -f deployment/hello-world-ops -n hello-world-ops"
echo "🛑 To stop: minikube stop"