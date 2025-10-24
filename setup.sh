#!/bin/bash

# VerifAgents Setup Script

echo "🚀 Setting up VerifAgents..."

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js $(node --version) and npm $(npm --version) detected"

# Copy .env.example to .env if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your API keys before running demos"
fi

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install common package dependencies
echo "📦 Installing common package dependencies..."
cd common && npm install && cd ..

# Build common package
echo "🔨 Building common utilities..."
cd common && npm run build && cd ..

# Install dependencies for each module
echo "📦 Installing module dependencies..."

# Verifiable Prediction Agents
echo "  📊 Installing Verifiable Prediction Agents..."
cd modules/verifiable-prediction-agents && npm install && cd ../..

# Verifiable Research Agent
echo "  📚 Installing Verifiable Research Agent..."
cd modules/verifiable-research-agent && npm install && cd ../..

echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Edit .env file with your API keys"
echo "2. Run 'npm run demo:prediction' for Prediction Agent demo"
echo "3. Run 'npm run demo:research' for Research Agent demo"
echo ""
echo "📖 See README.md for detailed documentation"