# Development Guide

## Prerequisites

- Node.js 18+ (tested with Node.js 24)
- npm or yarn
- macOS or Windows

## Installation

```bash
npm install
```

## Development

Start the application in development mode:

```bash
npm run dev
```

This will:
1. Start Vite dev server for the React frontend (port 5173)
2. Compile TypeScript for Electron main process
3. Launch Electron with hot-reload enabled

## Project Structure

```
src/
├── main/              # Electron main process (Node.js)
│   ├── main.ts        # Entry point
│   ├── preload.ts     # IPC bridge (security)
│   ├── database.ts    # SQLite operations
│   ├── scanner.ts     # Photo scanning (TODO)
│   ├── thumbnail.ts   # Thumbnail generation (TODO)
│   └── exporter.ts    # Export functionality (TODO)
├── renderer/          # React frontend
│   ├── App.tsx        # Main component
│   ├── main.tsx       # Entry point
│   ├── components/    # UI components (TODO)
│   ├── hooks/         # React hooks (TODO)
│   └── stores/        # State management (TODO)
└── shared/            # Shared types
    └── types.ts       # TypeScript interfaces
```

## Available Scripts

- `npm run dev` - Start development mode
- `npm run build` - Build for production
- `npm run package` - Package app for current OS
- `npm run package:mac` - Package for macOS
- `npm run package:win` - Package for Windows

## Current Status

### ✅ Completed
- Project structure initialized
- Electron + React + TypeScript configured
- Tailwind CSS setup
- SQLite database schema created
- Basic UI shell with folder selection

### 🚧 In Progress
- Directory scanning and EXIF extraction
- Thumbnail generation with Sharp
- Weekly view implementation

### 📋 Todo (Phase 1 MVP)
- Photo display with weekly grouping
- Favorites selection system
- Full-screen lightbox
- Favorites summary view

## Database Schema

SQLite database located at: `~/Library/Application Support/weekly-picture-selector/photos.db` (macOS)

Tables:
- `photos` - Photo metadata and favorites
- `faces` - Face detection data (Phase 4)
- `people` - Person labels (Phase 4)
- `settings` - App configuration

## IPC Communication

Exposed via `window.electronAPI`:
- `selectDirectory()` - Open folder picker
- `scanPhotos(path)` - Scan directory for photos
- `getPhotos()` - Fetch all photos from DB
- `toggleFavorite(id)` - Mark/unmark favorite
- `exportFavorites(config)` - Export to folders

## Troubleshooting

### Port 5173 already in use
Kill the process:
```bash
lsof -ti:5173 | xargs kill
```

### Electron doesn't start
Make sure Vite dev server is running first:
```bash
npm run dev:renderer
# Wait for server to start, then in another terminal:
npm run dev:main
```

### Database locked error
Close all Electron instances and delete:
```bash
rm ~/Library/Application\ Support/weekly-picture-selector/photos.db*
```
