@echo off
title Doi ten thu muc TLTN/FE
color 0B

if "%~dp0"=="%temp%\" goto :run_rename

echo ======================================================
echo       TIEN TRINH TU DONG DOI TEN THU MUC DU AN
echo ======================================================
echo.
echo Luy y: Chuong trinh se tu dong sao chep vao thu muc Temp 
echo va chay de giai phong khoa file tren thu muc FE.
echo.
copy "%~f0" "%temp%\rename_project_temp.bat" /y >nul
start "" "%temp%\rename_project_temp.bat"
exit

:run_rename
cls
echo ======================================================
echo       TIEN TRINH TU DONG DOI TEN THU MUC DU AN
echo ======================================================
echo.
echo [!] QUAN TRONG: Vui long dong phan mem lap trinh (Cursor, VS Code, IntelliJ,...)
echo     hoac bat ky file nao trong thu muc D:\TLTN\FE dang mo de tranh loi khoa file.
echo.
echo Chuong trinh se doi ten trong 5 giay nua...
timeout /t 5

:retry
ren "d:\TLTN\FE" "22130054_LyTuanDung"
if %errorlevel% equ 0 (
    echo.
    echo ======================================================
    echo   [SUCCESS] DA DOI TEN THU MUC THANH CONG!
    echo ======================================================
    echo   * Duong dan moi: D:\TLTN\22130054_LyTuanDung
    echo   * Vui long mo lai thu muc moi nay bang IDE cua ban.
    echo ======================================================
    echo.
) else (
    echo.
    echo [ERROR] Khong the doi ten thu muc!
    echo Co the vi:
    echo   1. Ban chua dong phan mem lap trinh (IDE) hoac terminal cmd/bash dang mo tai day.
    echo   2. Mot file nao do trong thu muc van dang bi khoa boi he thong.
    echo.
    echo Vui long dong het tat ca cac ung dung tren va nhan phim bat ky de THU LAI...
    pause >nul
    goto :retry
)

pause
(goto) 2>nul & del "%~f0"
exit
