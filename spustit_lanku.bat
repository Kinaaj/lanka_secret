@echo off
title Spustit Turnaj - Lanka 2027
echo Spoustim Chrome s povolenym automatickym prehravanim hudby pro turnaj...

:: Detekce cesty ke Chrome
set "CHROME_EXE=C:\Program Files\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME_EXE%" set "CHROME_EXE=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME_EXE%" set "CHROME_EXE=chrome.exe"

:: Cesta k score.html
set "APP_URL=file:///%~dp0score.html"

:: Spusteni Chrome s povolenym autoplay bez nutnosti prvniho kliku
start "" "%CHROME_EXE%" --autoplay-policy=no-user-gesture-required "%APP_URL%"
