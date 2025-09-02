import { BlobServiceClient } from '@azure/storage-blob';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import config from '../../../config';
import { FileUpload } from '../../docs/doc.interface';

export const HandleUserImageUploadToAzure = async (file: FileUpload): Promise<string> => {
  const AZURE_STORAGE_CONNECTION_STRING = config.azure_filesure_storage_token;
  const AZURE_STORAGE_CONTAINER_NAME = 'filesure-users';
  if (!AZURE_STORAGE_CONNECTION_STRING) {
    throw new Error('Missing Azure storage account key');
  }

  try {
    const blobService = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    // Get the container client
    const container = blobService.getContainerClient(AZURE_STORAGE_CONTAINER_NAME);

    // Generate a unique file name
    const uniqueFileName = `${uuidv4()}${path.extname(file.originalname)}`;

    // Get the block blob client
    const blob = container.getBlockBlobClient(uniqueFileName);

    // Upload the file buffer with proper MIME type
    await blob.uploadData(file.buffer, {
      blobHTTPHeaders: { blobContentType: file.mimetype },
    });

    // Return the public URL of the uploaded blob
    return blob.url;
  } catch (error) {
    throw new Error('Failed to upload image to Azure Blob Storage');
  }
};
