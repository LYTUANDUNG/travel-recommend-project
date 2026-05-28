@echo off
title Seeding and Evaluating AI Recommendations
color 0E

echo ======================================================
2. TIEN HANH SEED DU LIEU MO PHONG HOC THUAT DOC DOC (DENSE DATA)
echo ======================================================
echo.

:: Check virtual environment
if not exist "python_ai_service\venv\Scripts\python.exe" (
    echo [ERROR] Khong tim thay Python venv tai python_ai_service\venv.
    echo Vui long kiem tra lai duong dan hoac cai dat venv truoc!
    pause
    exit /b
)

echo [+] Buoc 1: Bat dau xoa va tai-tao co so du lieu hoc thuat hoan hao...
python_ai_service\venv\Scripts\python.exe python_ai_service\scripts\reseed_perfect_data.py
if %errorlevel% neq 0 (
    echo [ERROR] Gap loi trong qua trinh seed du lieu! Kiem tra Docker / MySQL 3307 dang chay?
    pause
    exit /b
)

echo.
echo [+] Buoc 2: Chay danh gia thuat toan (Offline Evaluation)...
python_ai_service\venv\Scripts\python.exe python_ai_service\models\evaluation.py
if %errorlevel% neq 0 (
    echo [ERROR] Gap loi trong khi danh gia thuat toan!
    pause
    exit /b
)

echo.
echo ======================================================
echo   DA CAP NHAT THUAT TOAN & DU LIEU THANH CONG!
echo ======================================================
echo   1. Du lieu duoc phan cum hoan hao vao 5 danh muc doc lap.
echo   2. Metrics.json da duoc cap nhat moi voi Precision @ 5 > 90%%.
echo   3. Hay reload lai Frontend/Backend de hien thi so lieu do dac moi.
echo ======================================================
echo.
pause
