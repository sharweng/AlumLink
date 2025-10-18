#!/bin/bash

# Socket.IO Connection Test Script

echo "========================================="
echo "Socket.IO Connection Diagnostic Test"
echo "========================================="
echo ""

echo "Step 1: Check if backend is running"
echo "------------------------------------"
curl -s http://localhost:5000/api/v1/auth/me > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Backend is running on port 5000"
else
    echo "❌ Backend is NOT running on port 5000"
    echo "   Run: cd /home/sjm/Documents/AlumLink && npm run dev"
    exit 1
fi
echo ""

echo "Step 2: Check if frontend is running"
echo "------------------------------------"
curl -s http://localhost:5173 > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Frontend is running on port 5173"
else
    echo "❌ Frontend is NOT running on port 5173"
    echo "   Run: cd /home/sjm/Documents/AlumLink/frontend && npm run dev"
    exit 1
fi
echo ""

echo "Step 3: Check Socket.IO endpoint"
echo "------------------------------------"
# Try to connect to Socket.IO
curl -s http://localhost:5000/socket.io/ > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Socket.IO endpoint is accessible"
else
    echo "⚠️  Socket.IO endpoint check inconclusive (this is normal)"
fi
echo ""

echo "Step 4: Manual Testing Instructions"
echo "------------------------------------"
echo ""
echo "1. Open Chrome/Firefox Developer Tools (F12) in BOTH tabs"
echo ""
echo "2. Go to Console tab"
echo ""
echo "3. Login to both accounts"
echo ""
echo "4. Look for these logs in the console:"
echo ""
echo "   Expected SUCCESS:"
echo "   -----------------"
echo "   🔵 Attempting to connect to Socket.IO..."
echo "   Auth User ID: 68e14d0f194abe855e9d9ec2"
echo "   🔑 JWT token found (length: 150+)"
echo "   First 20 chars: eyJhbGciOiJIUzI1NiIs..."
echo "   ✅ Connected to socket server"
echo "   Socket ID: abc123xyz"
echo ""
echo "   Possible FAILURE scenarios:"
echo "   ---------------------------"
echo "   ❌ No JWT token found in cookies!"
echo "   Available cookies: (empty or no jwt)"
echo "   → Solution: Logout and login again"
echo ""
echo "   ❌ Socket connection error: Authentication error"
echo "   → Solution: Check backend logs for auth error details"
echo ""
echo "5. In BACKEND terminal, look for:"
echo ""
echo "   Expected SUCCESS:"
echo "   -----------------"
echo "   🔐 Socket authentication attempt..."
echo "   Token received: YES (length: 150+)"
echo "   ✅ Token decoded, userId: 68e14d0f194abe855e9d9ec2"
echo "   ✅ Socket authenticated for user: 68e14d0f194abe855e9d9ec2"
echo "   🟢 User connected: 68e14d0f194abe855e9d9ec2, Socket ID: abc123"
echo "   📝 Stored in socket map. Total connected users: 1"
echo ""
echo "   Possible FAILURE scenarios:"
echo "   ---------------------------"
echo "   🔐 Socket authentication attempt..."
echo "   Token received: NO"
echo "   ❌ No token provided in socket handshake"
echo "   → Frontend isn't sending the JWT token"
echo ""
echo "   OR:"
echo "   🔐 Socket authentication attempt..."
echo "   Token received: YES (length: 150)"
echo "   ❌ Socket authentication error: jwt malformed"
echo "   → Token is invalid or corrupted"
echo ""
echo "6. Quick Browser Console Test"
echo "-----------------------------"
echo ""
echo "Run this in the browser console to check JWT:"
echo ""
echo "  document.cookie"
echo ""
echo "You should see: jwt=eyJhbGc..."
echo ""
echo "If you DON'T see 'jwt=' in the output:"
echo "  → Logout and login again"
echo "  → Check if 'withCredentials: true' is set in axios"
echo ""
echo "========================================="
echo "End of Diagnostic Script"
echo "========================================="
