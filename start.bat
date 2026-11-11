@echo off
title DevPilot AI - Launcher
color 0b
echo ====================================================
echo        DevPilot AI Code Intelligence Platform
echo ====================================================
echo.
echo Starting DevPilot AI server...
cd /d "%~dp0"
node server.js
pause
