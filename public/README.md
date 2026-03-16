# Public Assets

This folder contains static assets served directly by Next.js.

## Required Files

Add the following files to this directory:

### Icons (for PWA manifest)
- `icon-192.png` - 192x192px app icon
- `icon-512.png` - 512x512px app icon

### Optional Files
- `robots.txt` - Search engine crawling rules
- `sitemap.xml` - Site structure for SEO
- Images, fonts, or other static assets

## Usage

Files in this folder are served from the root URL:
- `public/icon-192.png` → `https://yourdomain.com/icon-192.png`
- `public/logo.svg` → `https://yourdomain.com/logo.svg`

## Notes

- The favicon is handled by `src/app/favicon.ico` (Next.js App Router convention)
- The manifest is generated dynamically by `src/app/manifest.ts`
- Keep this folder for static assets even if currently empty
