import { google } from "googleapis";
import { Request } from 'express';
import multer from 'multer';
import path from 'path';
import { Readable } from 'stream';

// Google Drive configuration
const GOOGLE_DRIVE_CLIENT_ID = process.env.GOOGLE_DRIVE_CLIENT_ID;
const GOOGLE_DRIVE_CLIENT_SECRET = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
const GOOGLE_DRIVE_REFRESH_TOKEN = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID; // Optional: specific folder ID

// Initialize Google Drive API
const oauth2Client = new google.auth.OAuth2(
  GOOGLE_DRIVE_CLIENT_ID,
  GOOGLE_DRIVE_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground' // Redirect URL for getting refresh token
);

oauth2Client.setCredentials({
  refresh_token: GOOGLE_DRIVE_REFRESH_TOKEN,
});

const drive = google.drive({
  version: 'v3',
  auth: oauth2Client,
});

// Memory storage for multer (files will be uploaded directly to Google Drive)
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
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

// Multer configuration with memory storage
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: fileFilter,
});

// Function to upload file to Google Drive
export const uploadToGoogleDrive = async (
  file: Express.Multer.File,
  folderName?: string
): Promise<string> => {
  try {
    // Create a readable stream from buffer
    const bufferStream = new Readable();
    bufferStream.push(file.buffer);
    bufferStream.push(null);

    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    const fileName = `${file.fieldname}-${uniqueSuffix}${fileExtension}`;

    // Create folder if specified
    let parentFolderId = GOOGLE_DRIVE_FOLDER_ID;
    if (folderName) {
      parentFolderId = await createOrGetFolder(folderName, GOOGLE_DRIVE_FOLDER_ID);
    }

    // Upload file to Google Drive
    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: parentFolderId ? [parentFolderId] : undefined,
      },
      media: {
        mimeType: file.mimetype,
        body: bufferStream,
      },
    });

    // Make file publicly viewable
    await drive.permissions.create({
      fileId: response.data.id!,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // Return public URL
    const fileId = response.data.id!;
    return `https://drive.google.com/file/d/${fileId}/view`;
  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
    throw new Error('Failed to upload file to Google Drive');
  }
};

// Function to create or get folder
const createOrGetFolder = async (folderName: string, parentId?: string): Promise<string> => {
  try {
    // Check if folder already exists
    const query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder'${
      parentId ? ` and '${parentId}' in parents` : ''
    } and trashed=false`;

    const response = await drive.files.list({
      q: query,
      fields: 'files(id, name)',
    });

    if (response.data.files && response.data.files.length > 0) {
      return response.data.files[0].id!;
    }

    // Create new folder
    const folderResponse = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentId ? [parentId] : undefined,
      },
    });

    return folderResponse.data.id!;
  } catch (error) {
    console.error('Error creating/getting folder:', error);
    throw new Error('Failed to create/get folder in Google Drive');
  }
};

// Function to delete file from Google Drive
export const deleteFromGoogleDrive = async (fileUrl: string): Promise<void> => {
  try {
    // Extract file ID from Google Drive URL
    const fileIdMatch = fileUrl.match(/\/d\/(.+?)\/view/);
    if (!fileIdMatch) {
      throw new Error('Invalid Google Drive URL');
    }

    const fileId = fileIdMatch[1];
    await drive.files.delete({
      fileId: fileId,
    });
  } catch (error) {
    console.error('Error deleting from Google Drive:', error);
    throw new Error('Failed to delete file from Google Drive');
  }
};

// Function to get direct download URL
export const getDirectDownloadUrl = (driveUrl: string): string => {
  const fileIdMatch = driveUrl.match(/\/d\/(.+?)\/view/);
  if (!fileIdMatch) {
    return driveUrl;
  }
  
  const fileId = fileIdMatch[1];
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
};

// Helper function to upload multiple files
export const uploadMultipleToGoogleDrive = async (
  files: Express.Multer.File[],
  folderName?: string
): Promise<string[]> => {
  const uploadPromises = files.map(file => uploadToGoogleDrive(file, folderName));
  return Promise.all(uploadPromises);
};