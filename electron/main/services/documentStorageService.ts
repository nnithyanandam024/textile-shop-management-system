import fs from 'fs';
import path from 'path';
import { app } from 'electron';

export class DocumentStorageService {
  private getStorageDir(staffCode: string): string {
    const baseDir = app ? app.getPath('userData') : path.join(process.cwd(), 'temp_storage');
    const targetDir = path.join(baseDir, 'documents', 'staff', staffCode);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    return targetDir;
  }

  saveDocumentFile(input: {
    staffCode: string;
    originalFileName: string;
    buffer: Buffer;
    maxSizeMB?: number;
  }): { relativePath: string; fileName: string; fileSize: number; mimeType: string } {
    const maxSizeMB = input.maxSizeMB || 10;
    const fileSizeMB = input.buffer.length / (1024 * 1024);

    if (fileSizeMB > maxSizeMB) {
      throw new Error(`File size exceeds maximum limit of ${maxSizeMB} MB.`);
    }

    const ext = path.extname(input.originalFileName).toLowerCase();
    const allowedExts = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
    if (!allowedExts.includes(ext)) {
      throw new Error(`Unsupported file extension '${ext}'. Allowed types: PDF, JPG, PNG, WEBP.`);
    }

    const mimeMap: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
    };
    const mimeType = mimeMap[ext] || 'application/octet-stream';

    const dir = this.getStorageDir(input.staffCode);
    const uniqueName = `doc_${Date.now()}_${Math.floor(Math.random() * 10000)}${ext}`;
    const fullPath = path.join(dir, uniqueName);

    fs.writeFileSync(fullPath, input.buffer);

    const relativePath = path.relative(app ? app.getPath('userData') : process.cwd(), fullPath);

    return {
      relativePath,
      fileName: input.originalFileName,
      fileSize: input.buffer.length,
      mimeType,
    };
  }

  readDocumentAsBase64(relativePath: string): { base64: string; mimeType: string } {
    const baseDir = app ? app.getPath('userData') : process.cwd();
    const fullPath = path.isAbsolute(relativePath) ? relativePath : path.join(baseDir, relativePath);

    if (!fs.existsSync(fullPath)) {
      throw new Error('Document file not found on disk.');
    }

    const ext = path.extname(fullPath).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
    };
    const mimeType = mimeMap[ext] || 'application/octet-stream';

    const buffer = fs.readFileSync(fullPath);
    return {
      base64: buffer.toString('base64'),
      mimeType,
    };
  }
}
