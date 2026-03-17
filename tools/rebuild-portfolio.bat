@echo off
cd /d "%~dp0.."
node tools\build-content.js
if %errorlevel% neq 0 (
    echo.
    echo Error al reconstruir portfolioData.js
    pause
    exit /b %errorlevel%
)
echo.
echo portfolioData.js actualizado correctamente.
pause
