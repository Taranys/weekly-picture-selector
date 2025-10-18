# Weekly Picture Selector - Detailed Roadmap

## Project Overview
Application to facilitate the selection of 2-4 favorite photos per week from a year's worth of photos, with export capabilities and facial recognition features.

---

## Phase 1: Core Photo Explorer (MVP) - 90% Complete

### 1.1 Directory Selection & File System ✅ **COMPLETED**
**Goal**: Allow users to select and scan a directory for photos

**Features**:
- ✅ File browser/dialog to select root directory
- ✅ Recursive directory scanning
- ✅ Photo file detection (JPEG, PNG, HEIC, WebP)
- ✅ EXIF metadata extraction (capture date, camera, lens, ISO, aperture, shutter, dimensions)
- ✅ Loading progress indicator (3 phases: scanning, EXIF extraction, thumbnails)
- ✅ Error handling for corrupted/unsupported files

**Technical Requirements**:
- ✅ File system access API (Electron dialog)
- ✅ EXIF parsing library (exifr)
- ✅ Supported formats: `.jpg`, `.jpeg`, `.png`, `.heic`, `.webp`

---

### 1.2 Photo Display - Weekly View ✅ **MOSTLY COMPLETED**
**Goal**: Display photos organized by week with thumbnail grid

**Features**:
- ✅ Group photos by week based on EXIF capture date (ISO 8601)
- ✅ Thumbnail grid view (responsive 2-6 columns based on screen size)
- ✅ Week headers with date range (e.g., "Jan 1 - Jan 7")
- ✅ Year separators in sidebar
- ✅ Chronological sorting (earliest to latest)
- ✅ Lazy loading with browser native lazy loading
- ✅ Smooth scrolling between weeks
- ✅ Photo count indicator per week
- ⏳ Virtual scrolling for thousands of photos (Phase 5 optimization)

**UI Components**:
- ✅ Week sidebar with navigation
- ✅ Thumbnail grid (golden border for favorites)
- ✅ Photo metadata overlay (date, filename on hover)
- ✅ Empty state for no photos

---

### 1.3 Photo Selection & Favorites ✅ **COMPLETED**
**Goal**: Enable marking 2-4 photos as favorites per week

**Features**:
- ✅ Favorite toggle button on thumbnail hover
- ✅ Visual indicator for favorited photos (golden ring border, enlarged star badge)
- ✅ Favorite counter per week and globally
- ✅ Validation: warning (orange color + triangle icon) when selecting more than 4 per week
- ✅ Quick unfavorite action
- ✅ Keyboard shortcuts (Space or F to favorite/unfavorite)
- ✅ Selection persistence (SQLite database)

**Validation Rules**:
- ✅ Minimum: 0 favorites per week (optional weeks)
- ✅ Recommended: 2-4 favorites per week
- ✅ Maximum: Flexible, but warn if >4 (orange indicator with tooltip)

---

### 1.4 Full-Screen Photo View ✅ **MOSTLY COMPLETED**
**Goal**: View photos in high resolution with navigation

**Features**:
- ✅ Click thumbnail to open full-screen lightbox
- ✅ High-resolution image loading
- ✅ Navigation controls (previous/next arrows)
- ✅ Keyboard navigation (arrow keys ←/→, Space/F for favorite, ESC to close)
- ✅ Favorite toggle in full-screen mode
- ✅ Photo metadata display (date, filename, camera, lens, ISO, aperture, shutter, dimensions)
- ⏳ Zoom in/out capability (Phase 5)
- ✅ Close button and backdrop click to exit
- ✅ Smooth transitions between photos
- ✅ Keyboard shortcuts hint display

---

### 1.5 Favorites Summary View ⏳ **IN PROGRESS** (Final 10% of Phase 1)
**Goal**: Review all selected favorites organized by week

**Features**:
- ⏳ Dedicated "Favorites" tab/view or filter
- ⏳ Weekly grid showing only favorited photos
- ⏳ Week navigation (jump to specific week)
- ⏳ Edit mode: remove favorites or add more
- ⏳ Statistics dashboard:
  - Total weeks with photos
  - Total favorites selected
  - Weeks with 0 favorites (incomplete)
  - Average favorites per week
- ⏳ Export preview: visualize final output structure (S01/S02/...)

---

## Phase 2: Export Functionality

### 2.1 Export Configuration
**Goal**: Configure export settings before generating output

**Features**:
- Choose export destination directory
- Naming convention options:
  - `S01`, `S02`, `S03`... (default)
  - `Week-01`, `Week-02`...
  - Custom prefix
- Option to copy or move files
- Photo renaming in exported folders (optional):
  - Keep original names
  - Sequential numbering (e.g., `photo_1.jpg`, `photo_2.jpg`)
  - Include date in filename
- Dry run mode: preview changes without executing
- Export only selected weeks vs. all weeks

---

### 2.2 Export Execution
**Goal**: Create organized folder structure with favorite photos

**Features**:
- Create week folders (S01, S02, etc.)
- Copy favorite photos to corresponding week folders
- Progress bar with status updates
- Error handling (disk space, permissions, file conflicts)
- Export log/report:
  - Number of files copied
  - Total size
  - Skipped files (with reasons)
  - Export timestamp
- Success confirmation with option to open export folder
- Undo/rollback capability (delete exported folders)

**Output Structure**:
```
/ExportFolder
  /S01
    photo1.jpg
    photo2.jpg
  /S02
    photo3.jpg
    photo4.jpg
    photo5.jpg
  ...
```

---

## Phase 3: Bonus Features

### 3.1 Subdirectory Grouping
**Goal**: Organize photos by subdirectories for better context

**Features**:
- Detect and preserve subdirectory structure
- Display subdirectory name as tag/label on thumbnails
- Filter view by subdirectory
- Subdirectory headers in weekly view (nested grouping):
  - Week 1
    - /Vacation
    - /Birthday_Party
- Collapsible subdirectory sections
- Subdirectory statistics (photo count, favorites count)

**UI Enhancement**:
- Subdirectory color coding
- Breadcrumb navigation
- "All" vs "Subdirectory" view toggle

---

### 3.2 Hide Photos/Directories
**Goal**: Exclude unwanted photos or folders from view

**Features**:
- Right-click context menu: "Hide photo" or "Hide folder"
- Hidden items list/manager (view and restore hidden items)
- Visual indicator for hidden items (if shown in manager)
- Exclusion rules:
  - Hide specific file types
  - Hide photos below certain resolution
  - Hide screenshots (detect by metadata)
- Persist hide settings
- Bulk hide/unhide actions

---

## Phase 4: Facial Recognition (Advanced)

### 4.1 Face Detection
**Goal**: Automatically detect faces in all photos

**Features**:
- Run face detection on photo import
- Background processing with progress indicator
- Face bounding boxes stored with metadata
- Face count per photo
- Detection confidence score
- Re-run detection option (improved models)

**Technical Stack**:
- Face detection library (e.g., face-api.js, OpenCV, AWS Rekognition)
- Face encoding/embedding generation
- Database to store face metadata

---

### 4.2 Face Clustering & Labeling
**Goal**: Group similar faces and allow naming

**Features**:
- Automatic face clustering (unsupervised learning)
- Face cluster view: grid of similar faces
- Manual face labeling (name assignment)
- Merge/split face clusters
- Unknown faces section
- Face thumbnail extraction
- Confidence indicator for face matches

**UI Components**:
- "People" tab/sidebar
- Face cluster cards with sample photos
- Drag-and-drop to reassign faces
- Search faces by name

---

### 4.3 Face-Based Filtering
**Goal**: Filter photos by detected person

**Features**:
- People filter dropdown/sidebar
- Multi-select people (show photos with Person A OR Person B)
- "Only this person" mode (show photos with only selected people)
- Face count badge on thumbnails
- Clear filters button
- Combine face filter with date range filter
- Save favorite person filters

**Use Cases**:
- View all photos of a child for baby album
- Find photos with specific family members
- Create person-specific exports

---

### 4.4 Face Recognition Settings
**Goal**: Configure recognition accuracy and behavior

**Features**:
- Sensitivity slider (strict vs. loose matching)
- Minimum face size threshold
- Enable/disable face detection per folder
- Privacy settings:
  - Store face data locally only
  - Clear all face data option
  - Exclude specific photos from face detection
- Performance settings:
  - Detection quality (fast vs. accurate)
  - Background processing priority

---

## Phase 5: Polish & Enhancements

### 5.1 User Experience Improvements
- Dark/light theme toggle
- Responsive design (tablet/desktop optimization)
- Drag-and-drop folder selection
- Photo sorting options (date, name, size)
- Search by filename or date range
- Bulk favorite actions (select multiple, favorite all visible)
- Undo/redo for favorite selections
- Keyboard shortcuts help overlay

### 5.2 Performance Optimization
- Thumbnail caching
- Incremental loading (pagination)
- Database indexing for large collections
- Multi-threaded image processing
- Memory management for face detection

### 5.3 Data Management
- Save/load project files (session persistence)
- Multiple projects support
- Import/export favorite selections (JSON/CSV)
- Backup and restore settings
- Cloud sync option (future consideration)

### 5.4 Analytics & Insights
- Photo timeline visualization
- Most photographed days/weeks
- Camera usage statistics
- Photo quality insights (resolution, sharpness)
- Favorite selection patterns

---

## Technical Architecture Recommendations

### Frontend
- **Framework**: React or Vue.js for UI
- **State Management**: Redux/Vuex or Context API
- **UI Components**: Tailwind CSS + Headless UI or Material-UI
- **Image Handling**: Sharp or Jimp for thumbnails
- **Lightbox**: react-image-lightbox or photoswipe

### Backend (if needed)
- **Electron** (for desktop app with file system access)
- **Node.js** + Express (for web app with backend)
- **Database**: SQLite (embedded) or PostgreSQL

### Face Recognition
- **Libraries**:
  - face-api.js (JavaScript, runs in browser)
  - OpenCV + dlib (Python backend)
  - AWS Rekognition or Azure Face API (cloud-based)

### File Handling
- **EXIF Parsing**: exifr or exif-parser
- **File System**: fs-extra (Node.js) or Electron APIs

---

## Development Phases Timeline

| Phase | Duration | Priority |
|-------|----------|----------|
| Phase 1: Core Explorer | 4-6 weeks | Critical |
| Phase 2: Export | 2-3 weeks | Critical |
| Phase 3: Bonus Features | 2-3 weeks | Medium |
| Phase 4: Facial Recognition | 4-6 weeks | Low (Future) |
| Phase 5: Polish | Ongoing | Medium |

**Total MVP (Phases 1-2)**: 6-9 weeks
**Full Feature Set (Phases 1-4)**: 12-18 weeks

---

## Success Metrics
- ✅ User can browse 1000+ photos smoothly
- ✅ Selection of favorites takes <10 minutes for 52 weeks
- ⏳ Export completes in <30 seconds for 200 photos (Phase 2)
- ⏳ Face detection accuracy >90% for frontal faces (Phase 4)
- ✅ App loads in <3 seconds

## Testing & Quality
- ✅ **39 unit tests** covering core functionality
- ✅ **100% coverage** on PhotoGrid and WeekSidebar components
- ✅ **91% coverage** on Lightbox component
- ✅ **Jest + React Testing Library** for modern testing
- ✅ Test scripts: `npm test`, `npm test:watch`, `npm test:coverage`

## Recent Updates (Latest)
- ✅ Added warning system for >4 favorites per week (orange color + icon)
- ✅ Added Spacebar keyboard shortcut for toggling favorites
- ✅ Enhanced visual feedback with golden border ring on favorites
- ✅ Implemented chronological week sorting (earliest to latest)
- ✅ Added year separators and date ranges in sidebar
- ✅ Created comprehensive test suite with 39 passing tests
- ✅ Fixed local file loading with webSecurity: false
