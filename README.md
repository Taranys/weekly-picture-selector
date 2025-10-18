# Weekly Picture Selector

A desktop application designed to simplify the process of selecting your favorite photos from large photo collections. Perfect for creating year-in-review albums, baby books, or any project that requires curating the best moments from each week.

## 🎯 Overview

Managing thousands of photos from a year can be overwhelming. This application helps you efficiently browse through your photo library organized by weeks, select 2-4 favorite photos per week, and export them into a well-organized folder structure.

## ✨ Current Features (Phases 1-2 Complete ✅)

### 📁 Photo Management
- **Directory Scanning** - Recursive scanning with EXIF metadata extraction
- **Weekly Organization** - ISO 8601 week numbering with chronological sorting (earliest to latest)
- **Thumbnail Generation** - Fast, cached thumbnails using Sharp
- **Progress Tracking** - Real-time scan progress with 3-phase indicators (scanning, EXIF, thumbnails)

### ⭐ Photo Selection & Favorites
- **Favorite Toggle** - Mark favorites with visual feedback
- **Smart Warnings** - Orange indicator when >4 favorites per week (recommended: 2-4)
- **Visual Feedback** - Golden border ring and enlarged star badge on favorited photos
- **Statistics** - Photo count and favorite counter per week and globally
- **Favorites Summary** - Dedicated view with statistics dashboard and export preview

### 🎨 User Interface
- **View Toggle** - Switch between "All Photos" and "Favorites" view
- **Week Sidebar** - Navigate by week with:
  - Year separators
  - Date ranges (e.g., "Jan 1 - Jan 7")
  - Favorite count with warning colors
- **Photo Grid** - Responsive grid layout with hover effects
- **Lightbox View** - Full-screen photo viewer with:
  - High-resolution image display
  - EXIF metadata display (camera, lens, settings, dimensions)
  - Navigation controls (previous/next)
- **Statistics Dashboard** - Overview of:
  - Total weeks and favorites
  - Complete/incomplete weeks
  - Average favorites per week
  - Warnings for weeks with >4 favorites

### 📊 Export Preview
- **Folder Structure** - Preview S01/S02/... folder layout
- **Week Details** - See which photos go in each export folder
- **Quick Navigation** - Jump from export preview to specific weeks

### 📤 Export Functionality (Phase 2)
- **Export Dialog** - Comprehensive configuration interface
- **Folder Naming** - Choose from S01, Week-01, or custom prefix
- **File Operations** - Copy or move photos (with warnings)
- **Photo Renaming** - Optional sequential or date-based naming
- **Dry Run Mode** - Test export without copying files
- **Progress Tracking** - Real-time progress with phase indicators
- **Export Report** - Detailed summary with statistics and errors
- **Conflict Detection** - Warns about existing folders

### ⌨️ Keyboard Shortcuts
- `Space` or `F` - Toggle favorite
- `←` / `→` - Navigate photos in lightbox
- `Esc` - Close lightbox

### ✅ Quality Assurance
- **67 Passing Tests** - Comprehensive test suite
- **Jest + React Testing Library** - Modern testing stack
- **High Coverage** - 100% on PhotoGrid, WeekSidebar, and FavoritesSummary
- **Test Scripts**:
  - `npm test` - Run all tests
  - `npm test:watch` - Watch mode
  - `npm test:coverage` - Coverage report

## 🔮 Upcoming Features

### Phase 3: Enhanced Organization
- Subdirectory grouping and filtering
- Hide photos/folders functionality

### Phase 4: Facial Recognition
- Automatic face detection (100% local processing)
- Face clustering and labeling
- Filter photos by detected people

### Phase 5: Polish
- Dark/light theme
- Virtual scrolling for large collections
- Zoom in lightbox
- Performance optimizations

## 🛠️ Technical Stack

### Core Technologies
- **Desktop Framework**: Electron 28 (cross-platform Windows/Mac support)
- **Frontend**: React 18 + TypeScript 5 + Tailwind CSS 3
- **Database**: SQLite via better-sqlite3 (local metadata storage)
- **Image Processing**: Sharp 0.33 (high-performance thumbnails)
- **EXIF Parsing**: exifr 7 (fast metadata extraction)
- **Testing**: Jest 30 + React Testing Library 16

### Why This Stack?
- **Cross-platform**: Single codebase for Windows and Mac
- **Performance**: Sharp handles 5000+ photos efficiently
- **Modern UI**: React + Tailwind for polished interfaces
- **Privacy**: All processing local, no cloud dependencies
- **Type Safety**: TypeScript for better developer experience
- **Rich Ecosystem**: Mature npm libraries

### Supported Formats
- **Images**: JPEG, PNG, HEIC, WebP
- **RAW**: CR2, NEF, ARW (EXIF extraction only)

### Performance Targets
- Scan 5000 photos: ~30-60 seconds
- Thumbnail generation: 2-5 minutes (cached, one-time)
- UI navigation: 60 FPS smooth scrolling

## 🚀 Getting Started

### Installation

```bash
# Clone the repository
git clone https://github.com/Taranys/weekly-picture-selector.git
cd weekly-picture-selector

# Install dependencies
npm install

# Rebuild native modules for Electron
npx electron-rebuild
```

### Development

```bash
# Run in development mode (hot reload)
npm run dev

# Run tests
npm test                # Run once
npm test:watch          # Watch mode
npm test:coverage       # With coverage report

# Build for production
npm run build

# Package for distribution
npm run package         # Current platform
npm run package:mac     # macOS (.dmg)
npm run package:win     # Windows (.exe)
```

## 📸 Usage

1. **Launch** the application
2. **Select Folder** - Click "Select Folder" button and choose your photo directory
3. **Wait for Scan** - Progress bar shows scanning → EXIF extraction → thumbnail generation
4. **Navigate Weeks** - Use the sidebar to browse weeks (sorted chronologically)
5. **View Photos** - Click any photo to open full-screen lightbox
6. **Mark Favorites**:
   - Click star button on thumbnail
   - Or press `Space`/`F` in lightbox
7. **Track Progress** - See favorite count per week and total in header
8. **Export Favorites** - Click "Export Favorites" button in Favorites view
9. **Configure Export** - Choose destination, naming pattern, and options
10. **Review Results** - View detailed export report with statistics

## 📋 Project Status

**Current Phase:** Phase 2 Export - ✅ **COMPLETE**

### ✅ Completed (Phase 1)
- [x] Directory scanning with EXIF extraction
- [x] Thumbnail generation with caching
- [x] Weekly photo organization (ISO 8601)
- [x] Photo grid with favorites toggle
- [x] Lightbox with keyboard navigation
- [x] Warning system for >4 favorites per week
- [x] Visual indicators (golden borders, badges)
- [x] Keyboard shortcuts (Space, F, arrows, Esc)
- [x] Favorites summary view with statistics dashboard
- [x] Export preview visualization (S01/S02/... structure)
- [x] View toggle (All Photos / Favorites)

### ✅ Completed (Phase 2)
- [x] Export configuration dialog with all options
- [x] Folder naming patterns (S01, Week-01, custom)
- [x] Copy or move file operations
- [x] Photo renaming options (sequential, date, original)
- [x] Dry-run mode for testing
- [x] Progress tracking with real-time updates
- [x] Export summary report with detailed statistics
- [x] Conflict detection and handling
- [x] Comprehensive test suite (67 tests total)

### 📅 Next Up (Phase 3)
- [ ] Subdirectory grouping and filtering
- [ ] Hide photos/folders functionality

## 🧪 Testing

The project includes comprehensive tests for all major components:

```bash
npm test                # Run all tests
npm test:watch          # Watch mode for development
npm test:coverage       # Generate coverage report
```

**Test Coverage:**
- **scanner.test.ts** - Week number calculation utility (6 tests)
- **PhotoGrid.test.tsx** - Photo grid component (8 tests)
- **WeekSidebar.test.tsx** - Week navigation sidebar (11 tests)
- **Lightbox.test.tsx** - Full-screen photo viewer (14 tests)
- **FavoritesSummary.test.tsx** - Favorites summary view (18 tests)
- **exporter.test.ts** - Export functionality and validation (10 tests)

**Current Stats:**
- 67 tests passing
- 100% coverage on PhotoGrid, WeekSidebar, and FavoritesSummary
- 91% coverage on Lightbox
- Comprehensive export validation and error handling tests

## 🗂️ Project Structure

```
weekly-picture-selector/
├── src/
│   ├── main/              # Electron main process
│   │   ├── database.ts    # SQLite operations
│   │   ├── scanner.ts     # Photo scanning + EXIF
│   │   ├── thumbnail.ts   # Thumbnail generation
│   │   ├── main.ts        # Main process entry
│   │   └── preload.ts     # IPC bridge
│   ├── renderer/          # React frontend
│   │   ├── components/    # UI components
│   │   ├── hooks/         # React hooks
│   │   └── App.tsx        # Main app component
│   ├── shared/            # Shared types
│   │   └── types.ts       # TypeScript interfaces
│   └── setupTests.ts      # Jest configuration
├── jest.config.js         # Jest configuration
├── ROADMAP.md            # Detailed development plan
└── CLAUDE.md             # Project guidance for AI
```

## 🤝 Contributing

This is a personal project for learning and personal use. Bug reports and suggestions are welcome via GitHub issues.

## 📄 License

ISC

## 🙏 Acknowledgments

Built with:
- [Electron](https://www.electronjs.org/) - Desktop framework
- [React](https://react.dev/) - UI library
- [Sharp](https://sharp.pixelplumbing.com/) - Image processing
- [exifr](https://github.com/MikeKovarik/exifr) - EXIF parsing
- [Tailwind CSS](https://tailwindcss.com/) - Styling

---

See [ROADMAP.md](./ROADMAP.md) for detailed feature plans and development timeline.
