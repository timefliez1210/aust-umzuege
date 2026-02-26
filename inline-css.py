#!/usr/bin/env python3
"""Post-build script: Inline CSS <link> tags into <style> blocks.
Eliminates render-blocking CSS requests for better Lighthouse scores.
"""

import os
import re
import glob

BUILD_DIR = "/media/timefliez/FileSystem/projects/alex_aust/build"

# Match <link href="...css" rel="stylesheet">
LINK_RE = re.compile(
    r'<link\s+href="([^"]+\.css)"\s+rel="stylesheet"\s*>'
)

def inline_css_in_html(html_path):
    """Replace CSS <link> tags with inline <style> blocks."""
    with open(html_path, 'r', encoding='utf-8') as f:
        content = f.read()

    html_dir = os.path.dirname(html_path)
    modified = False

    def replace_link(match):
        nonlocal modified
        css_href = match.group(1)
        # Resolve absolute paths (starting with /) from BUILD_DIR, relative from html_dir
        if css_href.startswith('/'):
            css_path = os.path.normpath(os.path.join(BUILD_DIR, css_href.lstrip('/')))
        else:
            css_path = os.path.normpath(os.path.join(html_dir, css_href))

        if not os.path.exists(css_path):
            print(f"  WARN: CSS not found: {css_href}")
            return match.group(0)

        with open(css_path, 'r', encoding='utf-8') as f:
            css_content = f.read().strip()

        modified = True
        return f'<style>{css_content}</style>'

    new_content = LINK_RE.sub(replace_link, content)

    if modified:
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    return False


def main():
    html_files = glob.glob(os.path.join(BUILD_DIR, "**", "*.html"), recursive=True)
    html_files += glob.glob(os.path.join(BUILD_DIR, "*.html"))
    html_files = sorted(set(html_files))

    print(f"Processing {len(html_files)} HTML files...")
    inlined = 0

    for html_path in html_files:
        rel = os.path.relpath(html_path, BUILD_DIR)
        if inline_css_in_html(html_path):
            print(f"  Inlined CSS in: {rel}")
            inlined += 1

    print(f"\nDone! Inlined CSS in {inlined}/{len(html_files)} files.")


if __name__ == "__main__":
    main()
