#!/usr/bin/env python3
"""Upload only HTML files to KAS FTP (after CSS inlining)."""

import ftplib
import os
import glob

FTP_HOST = "w019276c.kasserver.com"
FTP_USER = "f0180dc8"
FTP_PASS = "ForAlmightyClaude1210!"
BUILD_DIR = "/media/timefliez/FileSystem/projects/alex_aust/build"

ftp = ftplib.FTP(FTP_HOST)
ftp.login(FTP_USER, FTP_PASS)
ftp.encoding = 'utf-8'
print(f"Connected to {FTP_HOST}")

html_files = glob.glob(os.path.join(BUILD_DIR, "**", "*.html"), recursive=True)
html_files += glob.glob(os.path.join(BUILD_DIR, "*.html"))
html_files = sorted(set(html_files))

for html_path in html_files:
    rel = os.path.relpath(html_path, BUILD_DIR)
    remote = "/" + rel
    with open(html_path, 'rb') as f:
        ftp.storbinary(f'STOR {remote}', f)
    print(f"  Uploaded: {remote}")

ftp.quit()
print(f"\nDone! Uploaded {len(html_files)} HTML files.")
