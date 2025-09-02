// utils/normalizePayload.ts
import {
  BlobBeginCopyFromURLOptions,
  BlobDeleteOptions,
  BlobSASPermissions,
  BlobServiceClient,
  BlockBlobClient,
  ContainerClient,
  SASProtocol,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
} from '@azure/storage-blob';
import httpStatus from 'http-status';
import { Types } from 'mongoose';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import config from '../../config';
import AppError from '../../errors/AppError';
import { FileUpload, ICategory, IDoc, ISubcategory, ITag } from './doc.interface';

export const sanitizeTextField = (text: string): string => {
  return text
    .replace(/-{2,}/g, '-') // Collapses multiple hyphens into one
    .replace(/^-+|-+$/g, '') // Removes leading/trailing hyphens
    .trim();
};

export const refineNameTitleField = (text: string): string => {
  return text
    .replace(/-/g, '') // Remove all hyphens
    .replace(/\s+/g, ' ') // Collapse multiple spaces into one
    .split(' ') // Split into words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Title Case
    .join(' ')
    .trim(); // Move trim to the end
};

export const normalizeTags = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove everything except a-z and 0-9
    .trim(); // Move trim to the end
};

export const generateSlug = (text: string): string => {
  return text
    .toLowerCase() // Convert all letters to lowercase
    .replace(/\s+/g, '-') // Replace spaces (and multiple spaces) with hyphen
    .replace(/-+/g, '-') // Collapse multiple consecutive hyphens into one
    .replace(/[^a-z0-9-]/g, '') // Remove all characters except lowercase letters, numbers, and hyphens
    .replace(/^-+|-+$/g, '') // Remove hyphens from start and end
    .trim(); // Move trim to the end
};

export const refineCategoryPayload = (payload: Partial<ISubcategory | ICategory>) => {
  if (payload.name) {
    payload.name = refineNameTitleField(payload.name);
  }
  if (payload.description) {
    payload.description = sanitizeTextField(payload.description);
  }
  if (payload.metaTitle) {
    payload.metaTitle = sanitizeTextField(payload.metaTitle);
  }
  if (payload.metaDescription) {
    payload.metaDescription = sanitizeTextField(payload.metaDescription);
  }
  if (!payload.slug && payload.name) {
    payload.slug = generateSlug(payload.name);
  } else if (payload.slug) {
    payload.slug = generateSlug(payload.slug);
  }

  return payload;
};

export const refineTagsPayload = (payload: Partial<ITag>) => {
  if (payload.name) {
    payload.name = normalizeTags(payload.name);
  }
  if (!payload.slug && payload.name) {
    payload.slug = generateSlug(payload.name);
  } else if (payload.slug) {
    payload.slug = generateSlug(payload.slug);
  }

  return payload;
};

export const refineDocPayload = (payload: Partial<IDoc>) => {
  if (payload.title) {
    payload.title = refineNameTitleField(payload.title);
  }
  if (payload.metaTitle) {
    payload.metaTitle = sanitizeTextField(payload.metaTitle);
  }
  if (payload.metaDescription) {
    payload.metaDescription = sanitizeTextField(payload.metaDescription);
  }
  if (payload.content) {
    payload.content = payload.content.trim();
  }
  if (!payload.excerpt && payload.content) {
    const plainText = payload.content
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const words = plainText.split(' ').slice(0, 80);
    payload.excerpt = sanitizeTextField(words.join(' ') + (words.length === 10 ? '...' : ''));
  }
  if (payload.excerpt) {
    payload.excerpt = sanitizeTextField(payload.excerpt);
  }
  if (!payload.thumbnailId) {
    payload.thumbnailId = payload.headerImageId;
  }
  if (!payload.slug && payload.title) {
    payload.slug = generateSlug(payload.title);
  } else if (payload.slug) {
    payload.slug = generateSlug(payload.slug);
  }
  return payload;
};

export const refineDraftDocPayload = (payload: Partial<IDoc>) => {
  if (payload.title) {
    payload.title = refineNameTitleField(payload.title);
  }
  if (payload.metaTitle) {
    payload.metaTitle = sanitizeTextField(payload.metaTitle);
  } else {
    payload.metaTitle = ' ';
  }
  if (payload.metaDescription) {
    payload.metaDescription = sanitizeTextField(payload.metaDescription);
  } else {
    payload.metaDescription = ' ';
  }
  if (payload.content) {
    payload.content = payload.content.trim();
  } else {
    payload.content = ' ';
  }
  if (!payload.excerpt && payload.content) {
    const plainText = payload.content
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const words = plainText.split(' ').slice(0, 80);
    payload.excerpt = sanitizeTextField(words.join(' ') + (words.length === 10 ? '...' : ''));
  }
  if (payload.excerpt) {
    payload.excerpt = sanitizeTextField(payload.excerpt);
  } else {
    payload.excerpt = ' ';
  }
  if (!payload.categoryId) {
    payload.categoryId = new Types.ObjectId('68a19bb4b09c3b367367f7bc');
  }
  if (!payload.thumbnailId) {
    payload.thumbnailId = payload.headerImageId;
  }
  if (!payload.slug && payload.title) {
    payload.slug = generateSlug(payload.title);
  } else if (payload.slug) {
    payload.slug = generateSlug(payload.slug);
  }
  return payload;
};

export const uploadImageToAzureWithSAS = async (file: FileUpload): Promise<string> => {
  const AZURE_STORAGE_CONNECTION_STRING = config.azure_filesure_storage_token;
  const AZURE_STORAGE_CONTAINER_NAME = 'docs-images';
  if (!AZURE_STORAGE_CONNECTION_STRING) {
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'Missing Azure storage account key');
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
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to upload image to Azure Blob Storage'
    );
  }
};

export const getBlobServiceAndContainer = (): {
  service: BlobServiceClient;
  container: ContainerClient;
} => {
  const CONTAINER_NAME = 'docs-images';
  const CONN_STR = config.azure_filesure_storage_token;
  if (!CONN_STR) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Missing Azure storage account connection string'
    );
  }

  const service = BlobServiceClient.fromConnectionString(CONN_STR);
  const container = service.getContainerClient(CONTAINER_NAME);
  return { service, container };
};

export const buildReadSasUrl = (container: string, blobName: string, ttlMinutes = 10): string => {
  const CONN_STR = config.azure_filesure_storage_token;
  if (!CONN_STR) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Missing Azure storage account connection string'
    );
  }

  const { accountName, accountKey } = parseConnString(CONN_STR);
  const creds = new StorageSharedKeyCredential(accountName, accountKey);

  const startsOn = new Date(Date.now() - 60_000); // 1 min clock skew
  const expiresOn = new Date(Date.now() + ttlMinutes * 60_000);

  const sas = generateBlobSASQueryParameters(
    {
      containerName: container,
      blobName,
      permissions: BlobSASPermissions.parse('r'),
      protocol: SASProtocol.Https,
      startsOn,
      expiresOn,
    },
    creds
  ).toString();

  return `https://${accountName}.blob.core.windows.net/${container}/${blobName}?${sas}`;
};

export const getContainer = () => getBlobServiceAndContainer().container;

export const assertBlobExists = async (blob: BlockBlobClient) => {
  const exists = await blob.exists();
  if (!exists) {
    throw new AppError(httpStatus.NOT_FOUND, 'verifyEmailPOST is not defined');
  }
};

export const deleteBlobIncludeSnapshots = async (blob: BlockBlobClient) => {
  const opts: BlobDeleteOptions = { deleteSnapshots: 'include' };
  await blob.delete(opts);
};

export const setMetadataSafe = async (
  blob: BlockBlobClient,
  metadata?: Record<string, string | undefined>,
  ifMatch?: string
) => {
  if (!metadata) return;
  const cleaned: Record<string, string> = {};
  for (const [k, v] of Object.entries(metadata)) {
    if (v === undefined || v === null) continue;
    cleaned[k] = String(v);
  }
  await blob.setMetadata(cleaned, { conditions: ifMatch ? { ifMatch } : undefined });
};

export const setHTTPHeadersSafe = async (
  blob: BlockBlobClient,
  httpHeaders?: {
    contentType?: string;
    contentEncoding?: string;
    contentLanguage?: string;
    cacheControl?: string;
    contentDisposition?: string;
    contentMD5?: Uint8Array;
  },
  ifMatch?: string
) => {
  if (!httpHeaders) return;
  await blob.setHTTPHeaders(
    {
      blobContentType: httpHeaders.contentType,
      blobContentEncoding: httpHeaders.contentEncoding,
      blobContentLanguage: httpHeaders.contentLanguage,
      blobCacheControl: httpHeaders.cacheControl,
      blobContentDisposition: httpHeaders.contentDisposition,
      blobContentMD5: httpHeaders.contentMD5,
    },
    { conditions: ifMatch ? { ifMatch } : undefined }
  );
};

const parseConnString = (conn: string): { accountName: string; accountKey: string } => {
  const parts = Object.fromEntries(
    conn.split(';').map(kv => {
      const [k, v] = kv.split('=');
      return [k, v];
    })
  );
  const accountName = parts['AccountName'];
  const accountKey = parts['AccountKey'];
  if (!accountName || !accountKey) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Invalid Azure storage account configuration'
    );
  }

  return { accountName, accountKey };
};

export const buildShortReadSasUrlForExistingBlob = async (
  blob: BlockBlobClient,
  ttlMinutes = 10
) => {
  const conn = config.azure_filesure_storage_token;
  if (!conn) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Missing Azure storage account connection string'
    );
  }

  const { accountName, accountKey } = parseConnString(conn);
  const creds = new StorageSharedKeyCredential(accountName, accountKey);

  const startsOn = new Date(Date.now() - 60_000);
  const expiresOn = new Date(Date.now() + ttlMinutes * 60_000);

  const sas = generateBlobSASQueryParameters(
    {
      containerName: blob.containerName,
      blobName: blob.name,
      permissions: BlobSASPermissions.parse('r'),
      protocol: SASProtocol.Https,
      startsOn,
      expiresOn,
    },
    creds
  ).toString();

  const url = new URL(blob.url);
  url.search = sas;
  return url.toString();
};

export const copyRenameBlob = async (
  sourceBlob: BlockBlobClient,
  targetBlob: BlockBlobClient,
  ifMatch?: string,
  sasTtlMinutes = 15
) => {
  const sourceUrlWithSas = await buildShortReadSasUrlForExistingBlob(sourceBlob, sasTtlMinutes);
  const copyOpts: BlobBeginCopyFromURLOptions = {
    conditions: ifMatch ? { ifMatch } : undefined,
  };
  const poller = await targetBlob.beginCopyFromURL(sourceUrlWithSas, copyOpts);
  await poller.pollUntilDone();
};

export const fetchBlobProps = async (blob: BlockBlobClient) => {
  const props = await blob.getProperties();
  return {
    etag: props.etag,
    lastModified: props.lastModified?.toISOString(),
  };
};
