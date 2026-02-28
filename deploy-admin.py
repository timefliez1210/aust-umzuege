#!/usr/bin/env python3
"""Deploy admin SPA only: admin.html + _app/ chunks + .htaccess."""

import ftplib
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))


def load_dotenv():
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

SKIP_EXT = {'.br', '.gz'}

ftp = ftplib.FTP_TLS(FTP_HOST)
ftp.login(FTP_USER, FTP_PASS)
ftp.prot_p()
ftp.encoding = 'utf-8'
print(f"Connected to {FTP_HOST}")

count = 0


def upload_dir(local_dir, remote_dir):
    global count
    for entry in sorted(os.listdir(local_dir)):
        local_path = os.path.join(local_dir, entry)
        remote_path = f"{remote_dir.rstrip('/')}/{entry}"
        if os.path.isdir(local_path):
            try:
                ftp.mkd(remote_path)
            except ftplib.error_perm:
                pass
            upload_dir(local_path, remote_path)
        else:
            if os.path.splitext(entry)[1] in SKIP_EXT:
                continue
            with open(local_path, 'rb') as f:
                ftp.storbinary(f'STOR {remote_path}', f)
            count += 1


# 1. Upload admin.html (SPA shell)
print("Uploading admin.html...")
admin_html = os.path.join(BUILD_DIR, "admin.html")
with open(admin_html, 'rb') as f:
    ftp.storbinary('STOR /admin.html', f)
count += 1

# 2. Upload _app/ (JS/CSS chunks shared by all routes)
print("Uploading _app/...")
upload_dir(os.path.join(BUILD_DIR, "_app"), "/_app")

# 3. Upload .htaccess (contains admin SPA fallback rule)
print("Uploading .htaccess...")
with open(HTACCESS, 'rb') as f:
    ftp.storbinary('STOR /.htaccess', f)
count += 1

ftp.quit()
print(f"\nDone! Uploaded {count} files (admin only).")
