#!/bin/bash
# Stop all Proof-of-Inference AVS services

echo "🛑 Stopping Proof-of-Inference AVS - All Services"
echo "================================================================"

# Kill processes on ports
echo "Stopping services on ports 8082, 8083, 8084, 8085..."

lsof -ti:8082 | xargs kill -9 2>/dev/null && echo "✅ Stopped service on port 8082" || echo "   No service on port 8082"
lsof -ti:8083 | xargs kill -9 2>/dev/null && echo "✅ Stopped service on port 8083" || echo "   No service on port 8083"
lsof -ti:8084 | xargs kill -9 2>/dev/null && echo "✅ Stopped service on port 8084" || echo "   No service on port 8084"
lsof -ti:8085 | xargs kill -9 2>/dev/null && echo "✅ Stopped service on port 8085" || echo "   No service on port 8085"

echo ""
echo "================================================================"
echo "✅ All services stopped"
echo "================================================================"
