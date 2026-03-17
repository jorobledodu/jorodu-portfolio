@echo off
cd /d "%~dp0.."
node tools\sync-project-folders.js
if %errorlevel% neq 0 (
    echo.
    echo Error al sincronizar carpetas de proyecto.
    pause
    exit /b %errorlevel%
)
echo.
echo Carpetas de proyecto sincronizadas correctamente.
pause
