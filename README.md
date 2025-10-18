# Weekly Picture Selector

A desktop application designed to simplify the process of selecting your favorite photos from large photo collections. Perfect for creating year-in-review albums, baby books, or any project that requires curating the best moments from each week.

## Overview

Managing thousands of photos from a year can be overwhelming. This application helps you efficiently browse through your photo library organized by weeks, select 2-4 favorite photos per week, and export them into a well-organized folder structure.

## Key Features

### Photo Explorer
- **Smart Photo Organization**: Automatically groups your photos by week based on capture date from EXIF metadata
- **Intuitive Selection**: Easy-to-use interface to mark your favorite photos with visual indicators
- **Weekly View**: Browse through your entire year with photos organized in weekly grids
- **Full-Screen Mode**: View photos in high resolution with keyboard navigation
- **Favorites Summary**: Review all your selections in one place before exporting

### Export System
- **Structured Output**: Creates organized folders following the pattern `S01`, `S02`, `S03`... for each week
- **Flexible Configuration**: Choose naming conventions, copy vs. move options, and more
- **Progress Tracking**: Visual feedback during export with detailed reports
- **Safe Operations**: Dry run mode to preview changes before executing

### Bonus Features
- **Subdirectory Grouping**: Organize and filter photos by subfolder (e.g., "Vacation", "Birthday")
- **Hide Unwanted Items**: Exclude specific photos or folders from your view
- **Facial Recognition** (Advanced): Filter photos by detected faces to quickly find pictures of specific people

## Use Cases

- Create year-end photo albums with the best moments from each week
- Build baby's first year photo book with weekly progression
- Compile travel memories organized by week
- Curate social media content from your photo archive
- Generate weekly photo highlights for family sharing

## Technical Stack

### Architecture Decision
After evaluating multiple solutions (Electron, Tauri, Python), we selected **Electron + React + TypeScript** for optimal balance between development speed and performance.

### Core Technologies
- **Desktop Framework**: Electron (cross-platform Windows/Mac support)
- **Frontend**: React + TypeScript + Tailwind CSS
- **Database**: SQLite (via better-sqlite3) for metadata and selections
- **Image Processing**: Sharp (high-performance thumbnail generation)
- **EXIF Parsing**: exifr (fast metadata extraction)
- **Facial Recognition**: face-api.js (TensorFlow.js - 100% local, privacy-first)

### Why This Stack?
- **Cross-platform**: Single codebase for Windows and Mac
- **Performance**: Sharp handles 5000+ photos efficiently, face-api.js runs entirely offline
- **Modern UI**: React + Tailwind enables rapid development of polished interfaces
- **Privacy**: All processing happens locally, no cloud dependencies
- **Developer Experience**: TypeScript for type safety, hot reload for fast iteration
- **Rich Ecosystem**: npm provides mature libraries for all requirements

### Supported Formats
- Images: JPEG, PNG, HEIC, WebP
- RAW formats: CR2, NEF, ARW (via exifr)

### Performance Targets
- Scan 5000 photos: ~30-60 seconds
- Thumbnail generation: 2-5 minutes (cached)
- Facial recognition: 5-10 minutes (background processing)
- UI navigation: 60 FPS smooth scrolling

## Getting Started

*(Installation and usage instructions will be added as development progresses)*

See [ROADMAP.md](./ROADMAP.md) for detailed feature plans and development timeline.

## Project Status

Currently in initial planning phase. The roadmap outlines a phased approach:
- **Phase 1**: Core photo explorer (MVP)
- **Phase 2**: Export functionality
- **Phase 3**: Bonus features (subdirectory grouping, hide options)
- **Phase 4**: Facial recognition
- **Phase 5**: Polish and enhancements

## License

*(To be determined)*
