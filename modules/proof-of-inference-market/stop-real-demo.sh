#!/bin/bash

echo "🛑 Stopping Proof-of-Inference AVS - REAL INTEGRATION DEMO"
echo "========================================================="

# Function to stop service
stop_service() {
    local name=$1
    local pid_file="logs/${name}.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null; then
            echo "🛑 Stopping $name (PID: $pid)..."
            kill $pid
            sleep 2
            
            if ps -p $pid > /dev/null; then
                echo "   ⚠️  Force killing $name..."
                kill -9 $pid
            fi
            
            echo "   ✅ $name stopped"
        else
            echo "   ℹ️  $name was not running"
        fi
        rm -f "$pid_file"
    else
        echo "   ℹ️  No PID file for $name"
    fi
}

# Stop all services
echo "🔄 Stopping services..."

stop_service "avs-verification"
stop_service "ml-agent" 
stop_service "4mica-payment"
stop_service "erc8004-integration"

echo ""
echo "✅ All services stopped"
echo ""
echo "📊 Logs are available in logs/ directory"
echo "🧹 To clean up logs: rm -rf logs/"
