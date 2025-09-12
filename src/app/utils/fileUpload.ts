import { Request } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';

// Ensure upload directories exist
const ensureDirectoryExists = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Storage configuration
const storage = multer.diskStorage({
  destination: (req: Request, file: any, cb:any) => {
    let uploadPath = '';
    
    if (file.fieldname === 'thumbnail') {
      uploadPath = 'uploads/thumbnails';
    } else if (file.fieldname === 'pdfNotes') {
      uploadPath = 'uploads/pdf-notes';
    } else {
      uploadPath = 'uploads/others';
    }
    
    ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req: Request, file: any, cb:any) => {
    // Create unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    const fileName = `${file.fieldname}-${uniqueSuffix}${fileExtension}`;
    cb(null, fileName);
  }
});

// File filter function
const fileFilter = (req: Request, file: any, cb: any) => {
  if (file.fieldname === 'thumbnail') {
    // Accept only image files for thumbnails
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for thumbnails'));
    }
  } else if (file.fieldname === 'pdfNotes') {
    // Accept only PDF files for notes
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed for notes'));
    }
  } else {
    cb(null, true);
  }
};

// Multer configuration
export const upload = multer({
  limits: { fileSize: 3 * 1024 * 1024 }, // 3 MB
});

// Helper function to get file URL
export const getFileUrl = (req: Request, filePath: string): string => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/${filePath.replace(/\\/g, '/')}`;
};

// Helper function to delete file
export const deleteFile = (filePath: string): void => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};