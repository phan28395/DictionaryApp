@echo off
echo =====================================
echo Lightning Dictionary - Windows Dependency Checker
echo =====================================
echo.

set ALL_GOOD=1

:: Check Node.js
echo Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] Node.js is NOT installed
    echo     Download from: https://nodejs.org/
    set ALL_GOOD=0
) else (
    for /f "tokens=*" %%i in ('node --version') do echo [✓] Node.js installed: %%i
)
echo.

:: Check npm
echo Checking npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] npm is NOT installed
    set ALL_GOOD=0
) else (
    for /f "tokens=*" %%i in ('npm --version') do echo [✓] npm installed: %%i
)
echo.

:: Check Rust
echo Checking Rust...
rustc --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] Rust is NOT installed
    echo     Download from: https://rustup.rs/
    set ALL_GOOD=0
) else (
    for /f "tokens=*" %%i in ('rustc --version') do echo [✓] Rust installed: %%i
)
echo.

:: Check Cargo
echo Checking Cargo...
cargo --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] Cargo is NOT installed
    set ALL_GOOD=0
) else (
    for /f "tokens=*" %%i in ('cargo --version') do echo [✓] Cargo installed: %%i
)
echo.

:: Check Git (optional but recommended)
echo Checking Git...
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Git is NOT installed (optional but recommended)
    echo     Download from: https://git-scm.com/
) else (
    for /f "tokens=*" %%i in ('git --version') do echo [✓] Git installed: %%i
)
echo.

:: Check for Visual Studio Build Tools
echo Checking for C++ Build Tools...
if exist "%ProgramFiles(x86)%\Microsoft Visual Studio\2022\BuildTools\VC\Tools\MSVC\" (
    echo [✓] Visual Studio Build Tools 2022 found
) else if exist "%ProgramFiles(x86)%\Microsoft Visual Studio\2019\BuildTools\VC\Tools\MSVC\" (
    echo [✓] Visual Studio Build Tools 2019 found
) else if exist "%ProgramFiles%\Microsoft Visual Studio\2022\Community\VC\Tools\MSVC\" (
    echo [✓] Visual Studio 2022 Community found
) else (
    echo [!] Visual Studio Build Tools may not be installed
    echo     Download from: https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022
    echo     Select "Desktop development with C++" workload
)
echo.

:: Check WebView2
echo Checking WebView2 Runtime...
reg query "HKEY_LOCAL_MACHINE\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] WebView2 Runtime may not be installed
    echo     The app will prompt to install if needed
    echo     Or download from: https://developer.microsoft.com/en-us/microsoft-edge/webview2/
) else (
    echo [✓] WebView2 Runtime is installed
)
echo.

:: Summary
echo =====================================
if %ALL_GOOD% equ 1 (
    echo [✓] All required dependencies are installed!
    echo.
    echo You can now run:
    echo   npm install
    echo   npm run tauri dev
) else (
    echo [X] Some dependencies are missing!
    echo.
    echo Please install the missing dependencies listed above.
    echo For detailed instructions, see WINDOWS_SETUP.md
)
echo =====================================
echo.
pause