# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Weekly Picture Selector is a desktop application for curating favorite photos organized by week. The primary goal is to help users select 2-4 favorite photos per week from large collections (targeting ~5000 photos/year) and export them into a structured folder format (S01, S02, S03...).

**Target Users**: Personal use (2 users - owner and spouse)
**Target Platforms**: Windows and Mac desktop

## Technical Stack

### Core Architecture
- **Desktop Framework**: Electron (enables cross-platform desktop with file system access)
- **Frontend**: React + TypeScript + Tailwind CSS
- **Database**: SQLite via better-sqlite3 (stores photo metadata, favorites, face data)
- **Image Processing**: Sharp (high-performance thumbnail generation and caching)
- **EXIF Parsing**: exifr (extracts capture dates and camera metadata)
- **Facial Recognition**: face-api.js with TensorFlow.js (100% local, privacy-first)

### Architecture Decisions
This stack was chosen after evaluating Electron, Tauri, Python, and Flutter alternatives. Key factors:
- **Development speed**: TypeScript/React ecosystem for rapid prototyping
- **Performance**: Sharp handles 5000+ photos efficiently; face-api.js runs entirely offline
- **Privacy**: All processing local, no cloud dependencies (critical requirement)
- **Cross-platform**: Single codebase for Windows/Mac

### Expected Project Structure
```
src/
├── main/              # Electron main process (Node.js backend)
│   ├── database.ts    # SQLite operations (photos, favorites, face data)
│   ├── scanner.ts     # Directory scanning + EXIF extraction
│   ├── thumbnail.ts   # Sharp-based thumbnail generation
│   ├── exporter.ts    # Export favorites to S01/S02/... folders
│   └── faces.ts       # Face detection/recognition coordination
├── renderer/          # React frontend (Electron renderer process)
│   ├── components/    # UI components
│   ├── hooks/         # React hooks for state/IPC
│   ├── stores/        # State management (Context API or Redux)
│   └── App.tsx        # Main application component
└── shared/            # Shared TypeScript types/interfaces
    └── types.ts       # Photo, Week, Face, Export types
```

## Development Phases

The project follows a 5-phase roadmap (see ROADMAP.md):

1. **Phase 1 (MVP)**: Core photo explorer with weekly view, favorites selection, full-screen lightbox
2. **Phase 2 (MVP)**: Export functionality with configurable folder naming
3. **Phase 3**: Subdirectory grouping, hide photos/folders
4. **Phase 4**: Facial recognition (detection, clustering, filtering)
5. **Phase 5**: Polish, performance optimization, analytics

**Current Status**: Initial planning phase - no code yet

## Key Technical Constraints

### Performance Targets
- Scan 5000 photos: 30-60 seconds
- Thumbnail generation: 2-5 minutes (cached, one-time)
- Face detection: 5-10 minutes (background processing)
- UI navigation: 60 FPS smooth scrolling

### Supported Formats
- Images: JPEG, PNG, HEIC, WebP
- RAW formats: CR2, NEF, ARW (EXIF only, display via conversion)

### Data Flow Architecture

**Photo Scanning**:
1. User selects directory → Main process recursively scans filesystem
2. EXIF metadata extracted (capture date, camera info) → Stored in SQLite
3. Thumbnails generated via Sharp → Cached to disk
4. Photo list sent to renderer via IPC

**Favorites Management**:
1. User clicks favorite → Renderer sends IPC message to main
2. Main process updates SQLite (photo_id, week_number, is_favorite)
3. State synchronized back to renderer

**Export Process**:
1. User configures export (destination, naming convention)
2. Main process creates week folders (S01, S02, ...)
3. Copies favorited photos to corresponding folders
4. Progress updates sent to renderer via IPC events

**Face Recognition** (Phase 4):
1. Face detection runs in renderer (TensorFlow.js on GPU)
2. Face embeddings sent to main → SQLite storage
3. Clustering performed in main process (CPU-intensive)
4. Face filters applied in renderer using stored metadata

## Critical Design Patterns

### Electron IPC Communication
- **Main → Renderer**: Use `webContents.send()` for progress updates, events
- **Renderer → Main**: Use `ipcRenderer.invoke()` for async operations (scan, export, DB queries)
- **Preload script**: Expose safe IPC channels via `contextBridge`

### Database Schema (SQLite)
Key tables:
- `photos`: path, filename, capture_date, week_number, exif_data, thumbnail_path
- `favorites`: photo_id, is_favorite, added_at
- `faces`: photo_id, face_embedding, bounding_box, person_id, confidence
- `people`: person_id, name, representative_face_id
- `settings`: key-value pairs for app configuration

### Week Calculation
- Use ISO 8601 week numbering (Monday as first day)
- Group photos by year + week_number
- Handle edge cases (photos without EXIF dates → "Unknown" week)

### Thumbnail Strategy
- Generate multiple sizes (small: 200px, medium: 400px, large: 800px)
- Cache to `~/.weekly-picture-selector/thumbnails/{photo_hash}/`
- Use Sharp's `resize()` with quality optimization
- Lazy load thumbnails as user scrolls (virtual scrolling)

## Validation Rules

### Favorites Selection
- Recommended: 2-4 favorites per week
- No hard maximum, but warn UI if >4 selected
- Allow weeks with 0 favorites (optional)

### Export
- Must have at least 1 favorite selected across all weeks
- Validate destination directory exists and is writable
- Check available disk space before copying
- Handle filename conflicts (append suffix: `photo_1.jpg`, `photo_2.jpg`)

## Privacy and Security

- **All data local**: No cloud services, no telemetry, no external API calls
- **Face data**: Stored only in local SQLite, never transmitted
- **User photos**: Never copied/moved without explicit export action
- **Settings**: Allow clearing all face data, delete thumbnails cache

## Performance Considerations

### Handling Large Collections
- Use virtual scrolling (react-window or react-virtualized) for 1000+ photos
- Implement pagination for database queries (LIMIT/OFFSET)
- Index SQLite tables on week_number, is_favorite, person_id
- Debounce favorite toggle to batch DB writes

### Memory Management
- Limit concurrent Sharp operations (pool size: 4-8)
- Unload thumbnails outside viewport
- Run face detection in batches (100 photos at a time)
- Use Worker threads for CPU-intensive tasks (main process)

### Cross-Platform File Paths
- Use Node.js `path` module (handles Windows backslashes vs Unix forward slashes)
- Normalize paths when storing in SQLite
- Handle case-insensitive filesystems (macOS default)

## Development Workflow

When implementing features:
1. Start with database schema and types in `shared/types.ts`
2. Implement main process logic with error handling
3. Create IPC handlers with TypeScript types
4. Build React components with loading/error states
5. Test on both platforms (Windows path handling differs)

## Future Considerations

- **Mobile version**: If needed later, backend logic (SQLite, Sharp) could become a REST API consumed by Flutter mobile app
- **Cloud sync**: Could add optional iCloud/Google Drive sync for favorites metadata (not implemented in MVP)
- **Multi-project support**: Consider separating SQLite databases per photo collection
