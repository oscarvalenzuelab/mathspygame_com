#!/bin/bash

# Start Python HTTP server on port 8000
echo "Starting HTTP server at http://localhost:8000"
echo "Press Ctrl+C to stop"
python3 -m http.server 8000
