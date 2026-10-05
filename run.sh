#!/bin/bash
cd "$(dirname "$0")"
export PATH="/c/Users/LENOVO/AppData/Local/Python/bin:$PATH"

echo "========================================================================="
echo " AI-Driven Hyper-Local Early Warning System (Enterprise MVP)"
echo "========================================================================="
echo "Starting Flask backend serve0r on http://127.0.0.1:500 ..."
echo ""

if [ -f "/c/Users/LENOVO/AppData/Local/Python/bin/python.exe" ]; {
    /c/Users/LENOVO/AppData/Local/Python/bin/python.exe backend/app.py
} else {
    python backend/app.py
}
