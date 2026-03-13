import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { join, extname } from 'path';

@Injectable()
export class FileStorageService {
  private readonly logger = new Logger(FileStorageService.name);
  private readonly uploadDir: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadDir = this.configService.get<string>('upload.uploadDir') || './uploads';
  }

  /**
   * Save an uploaded file to disk in the given subdirectory.
   * Returns the relative file path and a URL-friendly path.
   */
  async saveFile(
    file: Express.Multer.File,
    subDir: string,
  ): Promise<{ filePath: string; fileUrl: string }> {
    const targetDir = join(this.uploadDir, subDir);
    await fs.mkdir(targetDir, { recursive: true });

    const ext = extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
    const filePath = join(targetDir, uniqueName);

    await fs.writeFile(filePath, file.buffer);
    this.logger.log(`Saved file: ${filePath} (${file.size} bytes)`);

    // Return a URL path relative to the static-served uploads directory
    const fileUrl = `/uploads/${subDir}/${uniqueName}`;

    return { filePath, fileUrl };
  }

  /**
   * Delete a file from disk if it exists.
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
      this.logger.log(`Deleted file: ${filePath}`);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        this.logger.warn(`Failed to delete file: ${filePath}`, error.message);
      }
    }
  }
}
