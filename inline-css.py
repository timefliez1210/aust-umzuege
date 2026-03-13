#!/usr/bin/env python3
"""Post-build script: Inline CSS <link> tags into <style> blocks.
Eliminates render-blocking CSS requests for better Lighthouse scores.
"""

import os
import re
import glob

BUILD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "build")

# Match <link href="...css" rel="stylesheet">
LINK_RE = re.compile(
    r'<link\s+href="([^"]+\.css)"\s+rel="stylesheet"\s*>'
)

def inline_css_in_html(html_path):
    """Replace CSS <link> tags with inline <style> blocks placed just before </head>.

    Moving the <style> blocks to the end of <head> ensures meta tags, canonical,
    and OG tags appear before the CSS in the HTML — important for crawlers and
    tools that truncate large HTML responses.
    """
    with open(html_path, 'r', encoding='utf-8') as f:
        content = f.read()

    html_dir = os.path.dirname(html_path)
    style_blocks = []

    def strip_link(match):
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

        style_blocks.append(f'<style>{css_content}</style>')
        return ''  # Remove <link> from its original position

    new_content = LINK_RE.sub(strip_link, content)

    if not style_blocks:
        return False

    # Insert all collected <style> blocks just before </head>
    combined_styles = '\n'.join(style_blocks)
    new_content = new_content.replace('</head>', f'{combined_styles}\n</head>', 1)

    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    return True


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
