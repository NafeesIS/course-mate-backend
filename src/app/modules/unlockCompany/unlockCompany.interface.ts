import { Types } from 'mongoose';

export interface IUnlockedCompany {
  userId: Types.ObjectId;
  companyId: string;
  companyName: string;
  unlockType: 'documents' | 'report';
  unlockedAt: Date;
  expiryDate: Date;
}

export interface IAttempts {
  attemptId: number;
  srn: string;
  mca_user_id: string;
  challan_url: string;
  attemptStatus:
    | 'verification_pending'
    | 'verification_failed'
    | 'payment_pending'
    | 'payment_failed'
    | 'payment_success'
    | 'challan_pending'
    | 'challan_downloaded'
    | 'upload_failed'
    | 'completed';
  error: null | string;
  attemptedAt: Date;
  filename: string;
}

// interfaces for Document Download Job
export interface IProcessingStages {
  challanPayment: {
    status:
      | 'pending'
      | 'challan_skipped'
      | 'verification_pending'
      | 'verification_failed'
      | 'payment_pending'
      | 'payment_failed'
      | 'payment_success'
      | 'challan_pending'
      | 'challan_downloaded'
      | 'upload_failed'
      | 'completed';
    totalAttempts: number;
    attempts: IAttempts[];
  };
  documentDownload: {
    status: 'pending' | 'in_progress' | 'success';
    totalDocuments: number;
    downloadedDocuments: number;
    pendingDocuments: number;
    lastUpdated: Date;
    completedAt: Date;
    totalZipFiles: number;
    zipFiles: {
      blob_url: string;
      container: string;
      createdAt: Date;
      filename: string;
      storage_account: string;
      successful_files: number;
      total_size_bytes: number;
      failed_files: {
        doc_id: Types.ObjectId;
        error: string;
      }[];
    }[];
  };
  documentDownloadV3: {
    status: 'pending' | 'in_progress' | 'success';
    totalDocuments: number;
    downloadedDocuments: number;
    pendingDocuments: number;
    lastUpdated: Date;
    completionPercentage: number;
    markedAsSuccess: boolean;
    completedAt: Date;
    totalZipFiles: number;
    zipFiles: {
      blob_url: string;
      container: string;
      createdAt: Date;
      filename: string;
      storage_account: string;
      successful_files: number;
      total_size_bytes: number;
      failed_files: {
        doc_id: Types.ObjectId;
        error: string;
      }[];
    }[];
  };
}

export interface IJob extends Document {
  cin: string;
  companyName: string;
  userId: Types.ObjectId;
  jobStatus:
    | 'pending'
    | 'challan_skipped'
    | 'no_docs_found'
    | 'challan_paid'
    | 'downloading_docs'
    | 'documents_downloaded';
  processingStages: IProcessingStages;
  createdAt: Date;
  updatedAt: Date;
}
