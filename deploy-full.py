#!/usr/bin/env python3
"""Full deploy: upload entire build directory + .htaccess to KAS."""

import ftplib
import os

FTP_HOST = os.environ.get("FTP_HOST", "w019276c.kasserver.com")
FTP_USER = os.environ.get("FTP_USER", "f0180dc8")
FTP_PASS = os.environ["FTP_PASS"]  # Required: set FTP_PASS environment variable
BUILD_DIR = "/media/timefliez/FileSystem/projects/alex_aust/build"
HTACCESS = "/media/timefliez/FileSystem/projects/alex_aust/.htaccess"

ftp = ftplib.FTP(FTP_HOST)
ftp.login(FTP_USER, FTP_PASS)
ftp.encoding = 'utf-8'
print(f"Connected to {FTP_HOST}")

count = 0

SKIP_EXT = {'.br', '.gz'}

def upload_dir(local_dir, remote_dir):
    global count
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
            count += 1

print("Uploading build directory...")
upload_dir(BUILD_DIR, "/")

# Upload .htaccess separately (not in build)
with open(HTACCESS, 'rb') as f:
    ftp.storbinary('STOR /.htaccess', f)
count += 1
print(f"Uploaded .htaccess")

ftp.quit()
print(f"\nDone! Uploaded {count} files.")
