import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  private uploadPath: string;
  private baseUrl: string;

  constructor(private configService: ConfigService) {
    // Set upload directory path
    this.uploadPath = path.join(process.cwd(), 'uploads');

    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }

    // Create subdirectories
    ['pets', 'profiles', 'thumbnails'].forEach(dir => {
      const dirPath = path.join(this.uploadPath, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    });

    // Base URL for serving images (use relative path for proxy compatibility)
    this.baseUrl = `/uploads`;
  }

  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'pets',
  ): Promise<string> {
    // Validate file
    this.validateImageFile(file);

    // Generate unique filename
    const fileExt = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExt}`;
    const filePath = path.join(this.uploadPath, folder, fileName);

    // Save file
    fs.writeFileSync(filePath, file.buffer);

    // Return URL
    return `${this.baseUrl}/${folder}/${fileName}`;
  }

  async uploadMultipleImages(
    files: Express.Multer.File[],
    folder: string = 'pets',
  ): Promise<string[]> {
    const uploadPromises = files.map((file) => this.uploadImage(file, folder));
    return Promise.all(uploadPromises);
  }

  async uploadThumbnail(
    file: Express.Multer.File,
    folder: string = 'thumbnails',
  ): Promise<string> {
    return this.uploadImage(file, folder);
  }

  async deleteImage(imageUrl: string): Promise<void> {
    try {
      // Extract file path from URL
      const urlPath = imageUrl.replace(this.baseUrl, '');
      const filePath = path.join(this.uploadPath, urlPath);

      // Delete file if it exists
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      // Don't throw error - deletion failure shouldn't block the operation
    }
  }

  async deleteMultipleImages(imageUrls: string[]): Promise<void> {
    const deletePromises = imageUrls.map((url) => this.deleteImage(url));
    await Promise.all(deletePromises);
  }

  validateImageFile(file: Express.Multer.File): void {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new Error(
        'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.',
      );
    }

    if (file.size > maxSize) {
      throw new Error('File size exceeds 5MB limit.');
    }
  }

  validateMultipleImageFiles(files: Express.Multer.File[]): void {
    files.forEach((file) => this.validateImageFile(file));
  }

  getUploadPath(): string {
    return this.uploadPath;
  }
}
