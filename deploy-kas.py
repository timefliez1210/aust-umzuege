#!/usr/bin/env python3
"""Deploy static site to KAS hosting via FTP.
Step 1: Move existing WP files to /wp-old/
Step 2: Upload build/ contents to FTP root
"""

import ftplib
import os
import sys

FTP_HOST = "w019276c.kasserver.com"
FTP_USER = "f0180dc8"
FTP_PASS = "ForAlmightyClaude1210!"
BUILD_DIR = "/media/timefliez/FileSystem/projects/alex_aust/build"

# Files/dirs to skip when moving (don't move these into wp-old)
SKIP_MOVE = {'.', '..', 'wp-old'}


def connect():
    ftp = ftplib.FTP(FTP_HOST)
    ftp.login(FTP_USER, FTP_PASS)
    ftp.encoding = 'utf-8'
    print(f"Connected to {FTP_HOST}")
    return ftp


def list_items(ftp, path="/"):
    """List files and dirs at given path."""
    items = []
    ftp.cwd(path)
    ftp.retrlines('LIST', lambda line: items.append(line))
    result = []
    for line in items:
        parts = line.split(None, 8)
        if len(parts) < 9:
            continue
        name = parts[8]
        is_dir = line.startswith('d')
        result.append((name, is_dir))
    return result


def move_wp_files(ftp):
    """Move all existing files/dirs on FTP root into /wp-old/."""
    print("\n=== Step 1: Moving existing WP files to /wp-old/ ===")

    # Create wp-old if it doesn't exist
    try:
        ftp.mkd("/wp-old")
        print("Created /wp-old/")
    except ftplib.error_perm:
        print("/wp-old/ already exists")

    items = list_items(ftp, "/")
    moved = 0
    for name, is_dir in items:
        if name in SKIP_MOVE:
            continue
        src = f"/{name}"
        dst = f"/wp-old/{name}"
        try:
            ftp.rename(src, dst)
            kind = "dir" if is_dir else "file"
            print(f"  Moved {kind}: {name}")
            moved += 1
        except ftplib.error_perm as e:
            print(f"  WARN: Could not move {name}: {e}")

    print(f"Moved {moved} items to /wp-old/")


def upload_dir(ftp, local_dir, remote_dir="/"):
    """Recursively upload a local directory to FTP."""
    entries = sorted(os.listdir(local_dir))
    for entry in entries:
        local_path = os.path.join(local_dir, entry)
        remote_path = f"{remote_dir.rstrip('/')}/{entry}"

        if os.path.isdir(local_path):
            # Create remote dir
            try:
                ftp.mkd(remote_path)
            except ftplib.error_perm:
                pass  # already exists
            upload_dir(ftp, local_path, remote_path)
        else:
            with open(local_path, 'rb') as f:
                ftp.storbinary(f'STOR {remote_path}', f)
            print(f"  Uploaded: {remote_path}")


def upload_build(ftp):
    """Upload build/ contents to FTP root."""
    print("\n=== Step 2: Uploading build to FTP root ===")

    file_count = sum(len(files) for _, _, files in os.walk(BUILD_DIR))
    print(f"Uploading {file_count} files from {BUILD_DIR}")

    upload_dir(ftp, BUILD_DIR, "/")
    print(f"\nUpload complete!")


def main():
    ftp = connect()

    # Step 1: Move WP files
    move_wp_files(ftp)

    # Step 2: Upload new site
    upload_build(ftp)

    ftp.quit()
    print("\n=== Deployment complete! ===")


if __name__ == "__main__":
    main()
