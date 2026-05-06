@echo off
setlocal

cd /d "%~dp0.."

where mysql >nul 2>nul
if errorlevel 1 (
  echo 未找到 mysql 客户端，请先安装 MySQL 客户端后再执行初始化脚本。
  exit /b 1
)

if "%DATABASE_URL%"=="" (
  set "DATABASE_URL=mysql://evenji:evenji@localhost:3306/app_feature_repository"
)

for /f "usebackq delims=" %%i in (`powershell -NoProfile -Command "$url = [System.Uri]$env:DATABASE_URL; $userInfo = $url.UserInfo.Split(':', 2); $user = if ($userInfo.Length -gt 0 -and $userInfo[0]) { [System.Uri]::UnescapeDataString($userInfo[0]) } else { 'evenji' }; $password = if ($userInfo.Length -gt 1 -and $userInfo[1]) { [System.Uri]::UnescapeDataString($userInfo[1]) } else { 'evenji' }; $dbName = $url.AbsolutePath.TrimStart('/'); if ([string]::IsNullOrWhiteSpace($dbName)) { $dbName = 'app_feature_repository' }; Write-Output ('DB_HOST=' + $url.Host); Write-Output ('DB_PORT=' + $(if ($url.Port -gt 0) { $url.Port } else { 3306 })); Write-Output ('DB_USER=' + $user); Write-Output ('DB_PASSWORD=' + $password); Write-Output ('DB_NAME=' + $dbName);"`) do set "%%i"

echo [1/4] 检查并创建数据库
set "MYSQL_PWD=%DB_PASSWORD%"
mysql --host="%DB_HOST%" --port="%DB_PORT%" --user="%DB_USER%" --execute="CREATE DATABASE IF NOT EXISTS `%DB_NAME%` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
if errorlevel 1 goto :error
set "MYSQL_PWD="

echo [2/4] 生成 Prisma Client
set "PYTHONUTF8=1"
python -m prisma generate
if errorlevel 1 goto :error

echo [3/4] 初始化数据库结构
python -m prisma db push
if errorlevel 1 goto :error

echo [4/4] 写入种子数据
python prisma\seed.py
if errorlevel 1 goto :error

echo 数据库初始化完成
exit /b 0

:error
set "MYSQL_PWD="
echo 数据库初始化失败
exit /b 1
