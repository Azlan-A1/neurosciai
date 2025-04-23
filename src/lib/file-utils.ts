import { promises as fs } from 'fs';
import path from 'path';

export async function ensureUploadDir() {
  const uploadDir = path.join(process.cwd(), 'uploads');
  try {
    await fs.mkdir(uploadDir, { recursive: true });
    return uploadDir;
  } catch (error) {
    console.error('Failed to create upload directory:', error);
    throw error;
  }
}

export async function saveFile(file: File, filename: string) {
  const uploadDir = await ensureUploadDir();
  const filepath = path.join(uploadDir, filename);
  
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  await fs.writeFile(filepath, buffer);
  return filepath;
}

export async function getFileDetails(filepath: string) {
  const stats = await fs.stat(filepath);
  return {
    path: filepath,
    size: stats.size,
    created: stats.birthtime,
    modified: stats.mtime,
  };
} 