#!/bin/bash
# BizBooks APK Build Script
# This script sets up the Capacitor Android project and builds the APK

set -e

echo "=========================================="
echo "  BizBooks APK Builder"
echo "=========================================="

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed. Please install Node.js v18+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "ERROR: Node.js v18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "Node.js version: $(node -v) ✓"

# Install dependencies
echo ""
echo "Installing dependencies..."
npm install

# Add Android platform if not exists
if [ ! -d "android" ]; then
    echo "Adding Android platform..."
    npx cap add android
else
    echo "Android platform already exists."
fi

# Sync web assets
echo "Syncing web assets..."
npx cap sync android

# Check for Android SDK
if [ -z "$ANDROID_SDK_ROOT" ] && [ -z "$ANDROID_HOME" ]; then
    echo ""
    echo "WARNING: ANDROID_SDK_ROOT or ANDROID_HOME not set."
    echo "Please install Android Studio and set up the Android SDK."
    echo ""
    echo "Opening Android Studio for manual build..."
    npx cap open android
    exit 0
fi

# Try to build APK via command line
echo ""
echo "Building debug APK..."
cd android

if [ -f "gradlew" ]; then
    chmod +x gradlew
    ./gradlew assembleDebug
    echo ""
    echo "=========================================="
    echo "  Build Complete!"
    echo "=========================================="
    echo ""
    echo "Debug APK location:"
    echo "  android/app/build/outputs/apk/debug/app-debug.apk"
    echo ""
    echo "To install on a connected device:"
    echo "  adb install android/app/build/outputs/apk/debug/app-debug.apk"
else
    echo "Gradle wrapper not found. Opening Android Studio..."
    cd ..
    npx cap open android
fi
