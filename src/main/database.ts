import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import path from 'path';
import * as fs from 'fs';
import { app } from 'electron';
import type { Photo, Face, Person, BoundingBox } from '../shared/types';

let db: SqlJsDatabase | null = null;
let dbPath: string | null = null;

export async function initDatabase(): Promise<SqlJsDatabase> {
  const userDataPath = app.getPath('userData');
  dbPath = path.join(userDataPath, 'photos.db');

  // Initialize sql.js
  const SQL = await initSqlJs();

  // Load existing database or create new one
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables
  createTables();

  // Save to disk
  saveDatabase();

  return db;
}

// Save database to disk
function saveDatabase() {
  if (!db || !dbPath) return;

  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

function createTables() {
  if (!db) return;

  // Photos table
  db.run(`
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

  // Faces table (for Phase 4)
  db.run(`
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
  db.run(`
    CREATE TABLE IF NOT EXISTS people (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      representative_face_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Settings table
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  // Create indexes for performance
  db.run(`CREATE INDEX IF NOT EXISTS idx_photos_week ON photos(year, week_number)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_photos_favorite ON photos(is_favorite)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_photos_hidden ON photos(is_hidden)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_faces_photo_id ON faces(photo_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_faces_person_id ON faces(person_id)`);
}

export function getDatabase(): SqlJsDatabase {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

export function closeDatabase() {
  if (db) {
    saveDatabase();
    db.close();
    db = null;
  }
}

// Helper functions for sql.js API
function execQuery(sql: string, params: any[] = []): any[] {
  const db = getDatabase();
  const result = db.exec(sql, params);

  if (result.length === 0) {
    return [];
  }

  const columns = result[0].columns;
  const values = result[0].values;

  return values.map((row: any[]) => {
    const obj: any = {};
    columns.forEach((col: string, idx: number) => {
      obj[col] = row[idx];
    });
    return obj;
  });
}

function execQueryOne(sql: string, params: any[] = []): any | null {
  const results = execQuery(sql, params);
  return results.length > 0 ? results[0] : null;
}

function runQuery(sql: string, params: any[] = []): void {
  const db = getDatabase();
  db.run(sql, params);
  saveDatabase();
}

// Photo operations
export function insertPhoto(photo: Omit<Photo, 'id' | 'createdAt'>): number {
  runQuery(`
    INSERT INTO photos (
      path, filename, capture_date, week_number, year,
      exif_data, thumbnail_path, is_favorite, subdirectory, is_hidden
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
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
  ]);

  const row = execQueryOne(`SELECT last_insert_rowid() as id`);
  return row.id;
}

export function getAllPhotos(): Photo[] {
  const rows = execQuery(`
    SELECT * FROM photos WHERE is_hidden = 0 ORDER BY capture_date ASC
  `);
  return rows.map(rowToPhoto);
}

export function getPhotosByWeek(year: number, weekNumber: number): Photo[] {
  const rows = execQuery(`
    SELECT * FROM photos
    WHERE year = ? AND week_number = ? AND is_hidden = 0
    ORDER BY capture_date ASC
  `, [year, weekNumber]);
  return rows.map(rowToPhoto);
}

export function toggleFavorite(photoId: number): boolean {
  // sql.js doesn't support "NOT is_favorite", we need to do it manually
  const photo = execQueryOne(`SELECT is_favorite FROM photos WHERE id = ?`, [photoId]);
  if (!photo) return false;

  runQuery(`UPDATE photos SET is_favorite = ? WHERE id = ?`, [photo.is_favorite ? 0 : 1, photoId]);
  return true;
}

export function getFavoritePhotos(): Photo[] {
  const rows = execQuery(`
    SELECT * FROM photos WHERE is_favorite = 1 AND is_hidden = 0
    ORDER BY year ASC, week_number ASC, capture_date ASC
  `);
  return rows.map(rowToPhoto);
}

export function clearAllPhotos() {
  runQuery('DELETE FROM photos');
}

// Subdirectory operations
export function getUniqueSubdirectories(): string[] {
  const rows = execQuery(`
    SELECT DISTINCT subdirectory
    FROM photos
    WHERE subdirectory IS NOT NULL AND is_hidden = 0
    ORDER BY subdirectory ASC
  `);
  return rows.map((row) => row.subdirectory);
}

export function getPhotosBySubdirectory(subdirectory: string | null): Photo[] {
  let rows;

  if (subdirectory === null) {
    rows = execQuery(`
      SELECT * FROM photos
      WHERE subdirectory IS NULL AND is_hidden = 0
      ORDER BY capture_date ASC
    `);
  } else {
    rows = execQuery(`
      SELECT * FROM photos
      WHERE subdirectory = ? AND is_hidden = 0
      ORDER BY capture_date ASC
    `, [subdirectory]);
  }

  return rows.map(rowToPhoto);
}

export function getSubdirectoryStats(): Array<{ subdirectory: string | null; photoCount: number; favoriteCount: number }> {
  const rows = execQuery(`
    SELECT
      subdirectory,
      COUNT(*) as photo_count,
      SUM(CASE WHEN is_favorite = 1 THEN 1 ELSE 0 END) as favorite_count
    FROM photos
    WHERE is_hidden = 0
    GROUP BY subdirectory
    ORDER BY subdirectory ASC
  `);

  return rows.map((row) => ({
    subdirectory: row.subdirectory,
    photoCount: row.photo_count,
    favoriteCount: row.favorite_count,
  }));
}

// Hide/unhide operations
export function hidePhoto(photoId: number): boolean {
  runQuery(`UPDATE photos SET is_hidden = 1 WHERE id = ?`, [photoId]);
  return true;
}

export function unhidePhoto(photoId: number): boolean {
  runQuery(`UPDATE photos SET is_hidden = 0 WHERE id = ?`, [photoId]);
  return true;
}

export function hidePhotosBySubdirectory(subdirectory: string): number {
  const before = execQueryOne(`SELECT COUNT(*) as count FROM photos WHERE subdirectory = ?`, [subdirectory]);
  runQuery(`UPDATE photos SET is_hidden = 1 WHERE subdirectory = ?`, [subdirectory]);
  return before.count;
}

export function unhidePhotosBySubdirectory(subdirectory: string): number {
  const before = execQueryOne(`SELECT COUNT(*) as count FROM photos WHERE subdirectory = ?`, [subdirectory]);
  runQuery(`UPDATE photos SET is_hidden = 0 WHERE subdirectory = ?`, [subdirectory]);
  return before.count;
}

export function getHiddenPhotos(): Photo[] {
  const rows = execQuery(`
    SELECT * FROM photos
    WHERE is_hidden = 1
    ORDER BY subdirectory ASC, capture_date ASC
  `);
  return rows.map(rowToPhoto);
}

export function getHiddenPhotoCount(): number {
  const row = execQueryOne(`SELECT COUNT(*) as count FROM photos WHERE is_hidden = 1`);
  return row.count;
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

// Face operations (Phase 4)
export function insertFace(face: Omit<Face, 'id'>): number {
  // Convert Float32Array to Buffer for BLOB storage
  const embeddingBuffer = Buffer.from(new Float32Array(face.embedding).buffer);

  runQuery(`
    INSERT INTO faces (photo_id, embedding, bounding_box, person_id, confidence)
    VALUES (?, ?, ?, ?, ?)
  `, [
    face.photoId,
    embeddingBuffer,
    JSON.stringify(face.boundingBox),
    face.personId,
    face.confidence
  ]);

  const row = execQueryOne(`SELECT last_insert_rowid() as id`);
  return row.id;
}

export function getFacesByPhotoId(photoId: number): Face[] {
  const rows = execQuery(`SELECT * FROM faces WHERE photo_id = ?`, [photoId]);
  return rows.map(rowToFace);
}

export function getAllFaces(): Face[] {
  const rows = execQuery(`SELECT * FROM faces`);
  return rows.map(rowToFace);
}

export function updateFacePersonId(faceId: number, personId: number | null): boolean {
  runQuery(`UPDATE faces SET person_id = ? WHERE id = ?`, [personId, faceId]);
  return true;
}

export function deleteFacesByPhotoId(photoId: number): number {
  const before = execQueryOne(`SELECT COUNT(*) as count FROM faces WHERE photo_id = ?`, [photoId]);
  runQuery(`DELETE FROM faces WHERE photo_id = ?`, [photoId]);
  return before.count;
}

export function getFaceCount(photoId: number): number {
  const row = execQueryOne(`SELECT COUNT(*) as count FROM faces WHERE photo_id = ?`, [photoId]);
  return row.count;
}

// Person operations (Phase 4)
export function insertPerson(name: string, representativeFaceId: number | null = null): number {
  runQuery(`
    INSERT INTO people (name, representative_face_id)
    VALUES (?, ?)
  `, [name, representativeFaceId]);

  const row = execQueryOne(`SELECT last_insert_rowid() as id`);
  return row.id;
}

export function updatePerson(id: number, name: string, representativeFaceId: number | null = null): boolean {
  runQuery(`
    UPDATE people
    SET name = ?, representative_face_id = ?
    WHERE id = ?
  `, [name, representativeFaceId, id]);
  return true;
}

export function deletePerson(id: number): boolean {
  // Unassign all faces from this person first
  runQuery(`UPDATE faces SET person_id = NULL WHERE person_id = ?`, [id]);

  // Delete the person
  runQuery(`DELETE FROM people WHERE id = ?`, [id]);
  return true;
}

export function getAllPeople(): Person[] {
  const rows = execQuery(`
    SELECT
      p.*,
      COUNT(DISTINCT f.photo_id) as photo_count
    FROM people p
    LEFT JOIN faces f ON f.person_id = p.id
    GROUP BY p.id
    ORDER BY p.name ASC
  `);
  return rows.map(rowToPerson);
}

export function getPersonById(id: number): Person | null {
  const row = execQueryOne(`
    SELECT
      p.*,
      COUNT(DISTINCT f.photo_id) as photo_count
    FROM people p
    LEFT JOIN faces f ON f.person_id = p.id
    WHERE p.id = ?
    GROUP BY p.id
  `, [id]);

  return row ? rowToPerson(row) : null;
}

export function getPhotosByPersonId(personId: number): Photo[] {
  const rows = execQuery(`
    SELECT DISTINCT p.*
    FROM photos p
    INNER JOIN faces f ON f.photo_id = p.id
    WHERE f.person_id = ? AND p.is_hidden = 0
    ORDER BY p.capture_date ASC
  `, [personId]);
  return rows.map(rowToPhoto);
}

export function getPhotosByPeople(personIds: number[], mode: 'any' | 'only' = 'any'): Photo[] {
  if (mode === 'any') {
    // Photos with any of these people
    const placeholders = personIds.map(() => '?').join(',');
    const rows = execQuery(`
      SELECT DISTINCT p.*
      FROM photos p
      INNER JOIN faces f ON f.photo_id = p.id
      WHERE f.person_id IN (${placeholders}) AND p.is_hidden = 0
      ORDER BY p.capture_date ASC
    `, personIds);
    return rows.map(rowToPhoto);
  } else {
    // Photos with ONLY these people (no other people)
    const placeholders = personIds.map(() => '?').join(',');
    const rows = execQuery(`
      SELECT DISTINCT p.*
      FROM photos p
      WHERE p.id IN (
        SELECT photo_id
        FROM faces
        WHERE person_id IN (${placeholders})
        GROUP BY photo_id
        HAVING COUNT(DISTINCT person_id) = ?
      )
      AND p.id NOT IN (
        SELECT photo_id
        FROM faces
        WHERE person_id NOT IN (${placeholders}) AND person_id IS NOT NULL
      )
      AND p.is_hidden = 0
      ORDER BY p.capture_date ASC
    `, [...personIds, personIds.length]);
    return rows.map(rowToPhoto);
  }
}

// Helper functions to convert database rows
function rowToFace(row: any): Face {
  // sql.js returns Uint8Array for BLOBs, convert to Float32Array
  let embedding: number[];

  if (row.embedding) {
    const uint8Array = row.embedding instanceof Uint8Array
      ? row.embedding
      : new Uint8Array(row.embedding);

    const float32Array = new Float32Array(
      uint8Array.buffer,
      uint8Array.byteOffset,
      uint8Array.byteLength / 4
    );

    embedding = Array.from(float32Array);
  } else {
    embedding = [];
  }

  return {
    id: row.id,
    photoId: row.photo_id,
    embedding,
    boundingBox: JSON.parse(row.bounding_box) as BoundingBox,
    personId: row.person_id,
    confidence: row.confidence,
  };
}

function rowToPerson(row: any): Person {
  return {
    id: row.id,
    name: row.name,
    representativeFaceId: row.representative_face_id,
    photoCount: row.photo_count || 0,
  };
}
