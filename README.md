# Image Compressor

A web app that shrinks JPG and PNG images in the browser using a serverless backend. Drag in a batch of images, get back smaller files (often up to ~80% smaller), and download them one at a time or all together as a ZIP.

## Features
- Drag-and-drop or file-picker upload for multiple images
- Server-side compression in a Netlify Function using `imagemin`:
  - JPEG: `imagemin-jpeg-recompress`
  - PNG: `imagemin-pngquant` (lossy palette quantization)
- Shows original vs. compressed size for each file
- Per-file download, plus a "download all" ZIP built client-side with JSZip

## Tech stack
JavaScript · HTML · CSS · Node.js · Netlify Functions (serverless) · imagemin · JSZip

## How it works
The browser reads each image as base64 and posts it to the `compress_files` function (`serverless/compress_files.js`). The function compresses the buffer and returns the result as base64 with its new size, and the UI builds the download links.

## Run locally
```bash
npm install
npm install -g netlify-cli
netlify dev        # serves dist/ and the functions in serverless/
```

## Deploy
`netlify.toml` publishes `dist/` and deploys functions from `serverless/`. Connect the repo to Netlify and it builds as is.
