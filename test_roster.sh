#!/bin/bash
echo "Logging in..."
TOKEN=$(curl -s -X POST https://localhost:5071/api/Auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@restaurant.local","password":"Admin123!"}' -k | grep -o '\"token\":\"[^\"]*' | grep -o '[^\"]*$')

if [ -z "$TOKEN" ]; then
    echo "Failed to get token"
    curl -s -X POST https://localhost:5071/api/Auth/login -H "Content-Type: application/json" -d '{"email":"admin@restaurant.local","password":"Admin123!"}' -k
    exit 1
fi

echo "Got token."
echo "Fetching roster..."
curl -s -v -X GET "https://localhost:5071/api/Roster?weekStart=2026-04-20" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" -k
