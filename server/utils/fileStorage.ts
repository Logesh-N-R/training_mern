import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export async function readJsonFile<T>(filename: string): Promise<T[]> {
  const filePath = path.join(dataDir, filename);
  
  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }
    
    const data = await fs.promises.readFile(filePath, 'utf-8');
    return JSON.parse(data) || [];
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return [];
  }
}

export async function writeJsonFile<T>(filename: string, data: T[]): Promise<void> {
  const filePath = path.join(dataDir, filename);
  
  try {
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing ${filename}:`, error);
    throw error;
  }
}

export function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}
