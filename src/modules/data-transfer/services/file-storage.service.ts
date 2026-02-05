import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class FileStorageService {
  private readonly logger = new Logger(FileStorageService.name);
  private readonly tempDir: string;

  constructor() {
    // Use temp-data directory in project root
    this.tempDir = path.join(process.cwd(), 'temp-data');
    this.ensureTempDir();
  }

  private async ensureTempDir(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      this.logger.error('Failed to create temp directory:', error);
    }
  }

  /**
   * Save a buffer to a temporary file
   * @returns The full path to the saved file
   */
  async saveFile(buffer: Buffer, extension: string = 'csv'): Promise<string> {
    await this.ensureTempDir();
    const fileName = `${randomUUID()}.${extension}`;
    const filePath = path.join(this.tempDir, fileName);

    await fs.writeFile(filePath, buffer);
    this.logger.debug(`Saved file to ${filePath}`);

    return filePath;
  }

  /**
   * Save a string to a temporary file
   */
  async saveString(content: string, extension: string = 'csv'): Promise<string> {
    return this.saveFile(Buffer.from(content, 'utf-8'), extension);
  }

  /**
   * Read a file as buffer
   */
  async readFile(filePath: string): Promise<Buffer> {
    return fs.readFile(filePath);
  }

  /**
   * Read a file as string
   */
  async readFileAsString(filePath: string): Promise<string> {
    return fs.readFile(filePath, 'utf-8');
  }

  /**
   * Delete a file
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
      this.logger.debug(`Deleted file ${filePath}`);
    } catch (error) {
      // Ignore if file doesn't exist
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        this.logger.error(`Failed to delete file ${filePath}:`, error);
        throw error;
      }
    }
  }

  /**
   * Check if a file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file stats
   */
  async getFileStats(filePath: string): Promise<{ size: number; mtime: Date }> {
    const stats = await fs.stat(filePath);
    return { size: stats.size, mtime: stats.mtime };
  }

  /**
   * Clean up old files in temp directory
   * @param maxAgeMs Maximum age in milliseconds (default: 24 hours)
   */
  async cleanupOldFiles(maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<number> {
    let deletedCount = 0;
    const now = Date.now();

    try {
      const files = await fs.readdir(this.tempDir);

      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        try {
          const stats = await fs.stat(filePath);
          const age = now - stats.mtime.getTime();

          if (age > maxAgeMs) {
            await fs.unlink(filePath);
            deletedCount++;
            this.logger.debug(`Cleaned up old file: ${file}`);
          }
        } catch (error) {
          this.logger.warn(`Failed to process file ${file} during cleanup:`, error);
        }
      }

      this.logger.log(`Cleaned up ${deletedCount} old temp files`);
    } catch (error) {
      this.logger.error('Failed to cleanup temp files:', error);
    }

    return deletedCount;
  }

  /**
   * Get the temp directory path
   */
  getTempDir(): string {
    return this.tempDir;
  }
}
