@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"

title Fluxo Financeiro - Inicializador
color 0A

echo.
echo  ==============================================
echo       FLUXO FINANCEIRO - INICIALIZADOR
echo  ==============================================
echo.
echo  Escolha a porta do sistema:
echo.
echo    [1] 5173  (padrao Vite)
echo    [2] 5174
echo    [3] 3000
echo    [4] 8080
echo    [5] Informar outra porta
echo.
set "opcao="
set /p "opcao=  Opcao: "

if "%opcao%"=="1" set "PORTA=5173"
if "%opcao%"=="2" set "PORTA=5174"
if "%opcao%"=="3" set "PORTA=3000"
if "%opcao%"=="4" set "PORTA=8080"
if "%opcao%"=="5" set /p "PORTA=  Digite a porta: "

if not defined PORTA (
  echo.
  echo  Opcao invalida.
  timeout /t 2 /nobreak >nul
  exit /b 1
)

for /f "delims=0123456789" %%A in ("%PORTA%") do set "PORTA_INVALIDA=%%A"
if defined PORTA_INVALIDA (
  echo.
  echo  A porta deve conter apenas numeros.
  timeout /t 2 /nobreak >nul
  exit /b 1
)

if %PORTA% LSS 1 (
  echo.
  echo  Porta invalida.
  timeout /t 2 /nobreak >nul
  exit /b 1
)
if %PORTA% GTR 65535 (
  echo.
  echo  Porta invalida. Use um valor entre 1 e 65535.
  timeout /t 2 /nobreak >nul
  exit /b 1
)

echo.
echo  Encerrando instancias anteriores deste projeto...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$root = [IO.Path]::GetFullPath('%~dp0'); $processes = Get-CimInstance Win32_Process -Filter 'Name = ''node.exe''' | Where-Object { $_.CommandLine -and $_.CommandLine.Contains($root) -and ($_.CommandLine -match 'vite|npm') }; foreach ($process in $processes) { Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue }"

echo  Iniciando Vite na porta %PORTA%...
start "" /b cmd /c "npm run dev -- --host 127.0.0.1 --port %PORTA% > .fluxo-vite-%PORTA%.log 2>&1"

set "URL=http://127.0.0.1:%PORTA%/"
set /a TENTATIVAS=0
:aguardar
set /a TENTATIVAS+=1
powershell -NoProfile -Command "try { $response = Invoke-WebRequest -Uri '%URL%' -UseBasicParsing -TimeoutSec 1; if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) { exit 0 } } catch { exit 1 }; exit 1" >nul 2>&1
if not errorlevel 1 goto abrir
if %TENTATIVAS% GEQ 30 goto falha
timeout /t 1 /nobreak >nul
goto aguardar

:abrir
echo  Sistema iniciado: %URL%
start "" "%URL%"
endlocal
exit

:falha
echo.
echo  Nao foi possivel confirmar o inicio do sistema.
echo  Consulte o arquivo .fluxo-vite-%PORTA%.log para detalhes.
endlocal
exit /b 1
