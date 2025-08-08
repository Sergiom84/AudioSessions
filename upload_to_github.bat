@echo on
REM AudioSessions - Upload to GitHub (robust)

cd /d "%~dp0"

git --no-pager --version
git rev-parse --is-inside-work-tree >NUL 2>&1 || git init

REM Ensure branch is main
git checkout -B main

REM Ensure remote 'origin' points to the correct repo
git remote get-url origin >NUL 2>&1 || git remote add origin https://github.com/Sergiom84/AudioSessions.git
git remote set-url origin https://github.com/Sergiom84/AudioSessions.git

echo ===== Remotes =====
git remote -v

echo ===== Status =====
git status -sb

echo ===== Commit =====
git add -A
git commit -m "Sync: Private Zone analytics modal + fixes" || echo No changes to commit.

echo ===== Push (verbose) =====
git push -v -u origin main

echo ===== Last commit =====
git --no-pager log -1 --oneline --decorate --no-color

pause
