@echo off
reg delete "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.nubit.host" /f >nul 2>&1
reg delete "HKCU\Software\Microsoft\Edge\NativeMessagingHosts\com.nubit.host" /f >nul 2>&1
reg delete "HKCU\Software\BraveSoftware\Brave-Browser\NativeMessagingHosts\com.nubit.host" /f >nul 2>&1
reg delete "HKCU\Software\Chromium\NativeMessagingHosts\com.nubit.host" /f >nul 2>&1
del "%~dp0com.nubit.host.json" >nul 2>&1
echo Nubit native host removed.
pause
