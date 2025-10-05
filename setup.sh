#!/bin/bash

# Dommarjävel Development Setup Script

set -e

echo "🏈 Setting up Dommarjävel development environment..."

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed. Please install Node.js 18+ first."
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed. Please install Python 3.13+ first."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is required but not installed. Please install npm first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Setup Backend
echo "🐍 Setting up Backend..."
cd Backend

if [ ! -d ".venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv .venv
fi

echo "Activating virtual environment..."
source .venv/bin/activate

echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "Setting up environment variables..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✅ Created .env file from template"
else
    echo "✅ .env file already exists"
fi

cd ..

# Setup Frontend
echo "⚛️  Setting up Frontend..."
cd Frontend

echo "Installing Node.js dependencies..."
npm install

echo "Setting up environment variables..."
if [ ! -f ".env.local" ]; then
    cp .env.local.example .env.local
    echo "✅ Created .env.local file from template"
else
    echo "✅ .env.local file already exists"
fi

cd ..

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start development:"
echo "1. Backend:  cd Backend && source .venv/bin/activate && python run.py"
echo "2. Frontend: cd Frontend && npm run dev"
echo ""
echo "Then open http://localhost:3000 in your browser"