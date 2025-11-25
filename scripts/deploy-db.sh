#!/bin/bash

# AwareHub Database Deployment Script
# This script automates the deployment of database changes to Supabase

set -e

echo "🚀 AwareHub Database Deployment"
echo "================================"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed"
    echo "📥 Installing Supabase CLI..."
    npm install -g supabase
fi

# Check if logged in
echo "🔐 Checking Supabase authentication..."
if ! supabase projects list &> /dev/null; then
    echo "📝 Please log in to Supabase"
    supabase login
fi

# Check environment variables
if [ -z "$SUPABASE_PROJECT_REF" ]; then
    echo "⚠️  SUPABASE_PROJECT_REF not set"
    read -p "Enter your Supabase project reference ID: " SUPABASE_PROJECT_REF
    export SUPABASE_PROJECT_REF
fi

# Link to project
echo "🔗 Linking to Supabase project..."
supabase link --project-ref $SUPABASE_PROJECT_REF

# Show pending migrations
echo ""
echo "📋 Checking for pending migrations..."
supabase db diff

# Confirm deployment
echo ""
read -p "🤔 Do you want to deploy these changes? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "⚡ Deploying database changes..."

    # Push migrations
    supabase db push

    echo ""
    echo "✅ Database deployment complete!"
    echo ""

    # Optional: Generate TypeScript types
    read -p "📝 Generate TypeScript types? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🔨 Generating types..."
        npm run supabase:generate-types
        echo "✅ Types generated!"
    fi

    echo ""
    echo "🎉 All done! Your database is up to date."
else
    echo "❌ Deployment cancelled"
    exit 1
fi
