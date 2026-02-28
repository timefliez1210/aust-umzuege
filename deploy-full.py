#!/usr/bin/env python3
"""Full deploy: upload entire build directory + .htaccess to KAS."""

import ftplib
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

def load_dotenv():
    """Load .env file from script directory if FTP_PASS not already set."""
    env_path = os.path.join(SCRIPT_DIR, ".env")
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, _, val = line.partition("=")
                    os.environ.setdefault(key.strip(), val.strip())

load_dotenv()

FTP_HOST = os.environ.get("FTP_HOST", "w019276c.kasserver.com")
FTP_USER = os.environ.get("FTP_USER", "f0180dc8")
FTP_PASS = os.environ["FTP_PASS"]
BUILD_DIR = os.path.join(SCRIPT_DIR, "build")
HTACCESS = os.path.join(SCRIPT_DIR, ".htaccess")

ftp = ftplib.FTP_TLS(FTP_HOST)
ftp.login(FTP_USER, FTP_PASS)
ftp.prot_p()
ftp.encoding = 'utf-8'
print(f"Connected to {FTP_HOST}")

SKIP_EXT = {'.br', '.gz'}

def count_files(local_dir):
    """Count uploadable files for progress tracking."""
    total = 0
    for entry in os.listdir(local_dir):
        local_path = os.path.join(local_dir, entry)
        if os.path.isdir(local_path):
            total += count_files(local_path)
        elif os.path.splitext(entry)[1] not in SKIP_EXT:
            total += 1
    return total

total_files = count_files(BUILD_DIR) + 1  # +1 for .htaccess
uploaded = 0

def progress_bar(current, total):
    pct = current / total * 100
    filled = int(pct / 2)
    bar = '█' * filled + '░' * (50 - filled)
    print(f'\r  [{bar}] {pct:5.1f}%  ({current}/{total} files)', end='', flush=True)

def upload_dir(local_dir, remote_dir):
    global uploaded
    for entry in sorted(os.listdir(local_dir)):
        local_path = os.path.join(local_dir, entry)
        remote_path = f"{remote_dir.rstrip('/')}/{entry}"
        if os.path.isdir(local_path):
            try:
                ftp.mkd(remote_path)
            except:
                pass
            upload_dir(local_path, remote_path)
        else:
            if os.path.splitext(entry)[1] in SKIP_EXT:
                continue
            with open(local_path, 'rb') as f:
                ftp.storbinary(f'STOR {remote_path}', f)
            uploaded += 1
            progress_bar(uploaded, total_files)

print(f"Uploading {total_files} files...")
upload_dir(BUILD_DIR, "/")

# Upload .htaccess separately (not in build)
with open(HTACCESS, 'rb') as f:
    ftp.storbinary('STOR /.htaccess', f)
uploaded += 1
progress_bar(uploaded, total_files)

ftp.quit()
print(f"\n\nDone! Uploaded {uploaded} files.")
