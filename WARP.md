# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Essential Commands
```bash
# Install dependencies
npm install

# Build TypeScript to JavaScript
npm run build

# Start development server (auto-restart on changes)
npm run dev

# Start production server
npm start

# Watch TypeScript files for changes and recompile
npm run watch

# Clean build directory
npm run clean
```

### Testing and Running
- **Development URL**: http://localhost:3000
- **Health Check**: http://localhost:3000/api/health
- **Platform Pages**: 
  - YouTube: http://localhost:3000/youtube
  - Instagram: http://localhost:3000/instagram
  - Facebook: http://localhost:3000/facebook
  - TikTok: http://localhost:3000/tiktok

### Prerequisites
- Node.js (v16 or higher)
- Python (required by yt-dlp)
- Port 3000 must be available

## Architecture Overview

### High-Level Structure
This is a full-stack video downloader web application with a TypeScript/Express.js backend serving static HTML/CSS/JS frontend files. The application supports downloading videos from YouTube, Instagram, Facebook, and TikTok using ytdlp-nodejs.

### Backend Architecture
- **Entry Point**: `src/server.ts` - Main Express server with middleware setup
- **Route Organization**: Platform-specific route handlers in `src/routes/`
  - `youtube.ts` - YouTube downloads, playlists, MP3 extraction, Shorts
  - `instagram.ts` - Instagram Reels, Stories, Posts
  - `facebook.ts` - Facebook Reels, Videos, Watch content
  - `tiktok.ts` - TikTok short/long videos, audio extraction
- **API Pattern**: Each platform has standardized endpoints:
  - `POST /api/{platform}/info` - Get content information
  - `POST /api/{platform}/download` - Download video content
  - Platform-specific endpoints for special content types

### Frontend Architecture
- **Static Serving**: Express serves static files from `public/` directory
- **Page Structure**: 
  - `public/index.html` - Homepage with platform selection
  - `public/pages/` - Individual platform pages
  - Frontend uses vanilla HTML/CSS/JavaScript (no frameworks)

### Key Dependencies
- **ytdlp-nodejs**: Core video processing library
- **Express.js**: Web server framework
- **CORS**: Cross-origin request handling
- **TypeScript**: Primary language with strict mode disabled

## API Patterns

### Request Format
All API endpoints expect JSON payloads with at minimum:
```json
{
  "url": "platform_video_url"
}
```

### Response Format
- **Info endpoints** return metadata: title, duration, available formats
- **Download endpoints** return download status and file information
- **Error responses** include descriptive error messages

### Current Implementation Status
Routes contain mock responses - actual ytdlp integration needs implementation for production use.

## Development Workflow

### Adding New Platform Support
1. Create new route file in `src/routes/{platform}.ts`
2. Follow existing pattern with info/download endpoints
3. Add route registration in `src/server.ts`
4. Create corresponding HTML page in `public/pages/`
5. Add navigation link in main index.html

### TypeScript Configuration
- Target: ES2020 with CommonJS modules
- Output: `dist/` directory with source maps and declarations
- Path aliases: `@/*` maps to `src/*`
- Strict mode disabled for flexibility

### Error Handling
- Global error middleware catches unhandled errors
- Development mode shows detailed error messages
- Production mode shows generic error responses
- Console logging for debugging

## File Structure Context

### Generated Files (don't edit directly)
- `dist/` - Compiled JavaScript output
- `node_modules/` - Dependencies

### Configuration Files
- `tsconfig.json` - TypeScript compilation settings
- `package.json` - Dependencies and scripts
- `.gitignore` - Git exclusions

### Important Notes
- Server runs on PORT environment variable or defaults to 3000
- Static files served from public directory relative to compiled server.js
- Cross-origin requests enabled via CORS middleware
- URL validation implemented for platform-specific endpoints