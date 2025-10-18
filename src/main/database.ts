import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import type { Photo, ExifData } from '../shared/types';

let db: Database.Database | null = null;

export function initDatabase(): Database.Database {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'photos.db');

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  // Create tables
  createTables();

  return db;
}

function createTables() {
  if (!db) return;

  // Photos table
  db.exec(`
    CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT NOT NULL UNIQUE,
      filename TEXT NOT NULL,
      capture_date TEXT,
      week_number INTEGER,
      year INTEGER,
      exif_data TEXT,
      thumbnail_path TEXT,
      is_favorite INTEGER DEFAULT 0,
      subdirectory TEXT,
      is_hidden INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indexes for performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_photos_week ON photos(year, week_number);
    CREATE INDEX IF NOT EXISTS idx_photos_favorite ON photos(is_favorite);
    CREATE INDEX IF NOT EXISTS idx_photos_hidden ON photos(is_hidden);
  `);

  // Faces table (for Phase 4)
  db.exec(`
    CREATE TABLE IF NOT EXISTS faces (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      photo_id INTEGER NOT NULL,
      embedding BLOB,
      bounding_box TEXT NOT NULL,
      person_id INTEGER,
      confidence REAL,
      FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE
    )
  `);

  // People table (for Phase 4)
  db.exec(`
    CREATE TABLE IF NOT EXISTS people (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      representative_face_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

// Photo operations
export function insertPhoto(photo: Omit<Photo, 'id' | 'createdAt'>): number {
  const db = getDatabase();

  const stmt = db.prepare(`
    INSERT INTO photos (
      path, filename, capture_date, week_number, year,
      exif_data, thumbnail_path, is_favorite, subdirectory, is_hidden
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const info = stmt.run(
    photo.path,
    photo.filename,
    photo.captureDate?.toISOString() || null,
    photo.weekNumber,
    photo.year,
    photo.exifData ? JSON.stringify(photo.exifData) : null,
    photo.thumbnailPath,
    photo.isFavorite ? 1 : 0,
    photo.subdirectory,
    photo.isHidden ? 1 : 0
  );

  return info.lastInsertRowid as number;
}

export function getAllPhotos(): Photo[] {
  const db = getDatabase();

  const stmt = db.prepare(`
    SELECT * FROM photos WHERE is_hidden = 0 ORDER BY capture_date ASC
  `);

  const rows = stmt.all() as any[];

  return rows.map(rowToPhoto);
}

export function getPhotosByWeek(year: number, weekNumber: number): Photo[] {
  const db = getDatabase();

  const stmt = db.prepare(`
    SELECT * FROM photos
    WHERE year = ? AND week_number = ? AND is_hidden = 0
    ORDER BY capture_date ASC
  `);

  const rows = stmt.all(year, weekNumber) as any[];

  return rows.map(rowToPhoto);
}

export function toggleFavorite(photoId: number): boolean {
  const db = getDatabase();

  const stmt = db.prepare(`
    UPDATE photos
    SET is_favorite = NOT is_favorite
    WHERE id = ?
  `);

  const info = stmt.run(photoId);

  return info.changes > 0;
}

export function getFavoritePhotos(): Photo[] {
  const db = getDatabase();

  const stmt = db.prepare(`
    SELECT * FROM photos WHERE is_favorite = 1 AND is_hidden = 0
    ORDER BY year ASC, week_number ASC, capture_date ASC
  `);

  const rows = stmt.all() as any[];

  return rows.map(rowToPhoto);
}

export function clearAllPhotos() {
  const db = getDatabase();
  db.exec('DELETE FROM photos');
}

// Helper function to convert database row to Photo object
function rowToPhoto(row: any): Photo {
  return {
    id: row.id,
    path: row.path,
    filename: row.filename,
    captureDate: row.capture_date ? new Date(row.capture_date) : null,
    weekNumber: row.week_number,
    year: row.year,
    exifData: row.exif_data ? JSON.parse(row.exif_data) : null,
    thumbnailPath: row.thumbnail_path,
    isFavorite: row.is_favorite === 1,
    subdirectory: row.subdirectory,
    isHidden: row.is_hidden === 1,
    createdAt: new Date(row.created_at),
  };
}
