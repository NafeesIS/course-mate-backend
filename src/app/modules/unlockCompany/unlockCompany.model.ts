import { model, Schema } from 'mongoose';
import { IAttempts, IJob, IProcessingStages, IUnlockedCompany } from './unlockCompany.interface';

const UnlockedCompanySchema = new Schema<IUnlockedCompany>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  companyId: { type: String, required: true },
  companyName: { type: String, required: true },
  unlockType: {
    type: String,
    enum: ['documents', 'report'],
    required: true,
  },
  unlockedAt: { type: Date, default: Date.now },
  expiryDate: { type: Date, required: true },
});

UnlockedCompanySchema.index({ userId: 1, companyId: 1 }, { unique: true });

const AttemptsSchema = new Schema<IAttempts>({
  attemptId: { type: Number, required: true },
  srn: { type: String, required: true },
  mca_user_id: { type: String, required: true },
  challan_url: { type: String, required: true },
  attemptStatus: {
    type: String,
    enum: [
      'verification_pending',
      'verification_failed',
      'payment_pending',
      'payment_failed',
      'payment_success',
      'challan_pending',
      'challan_downloaded',
      'upload_failed',
      'completed',
    ],
  },
  error: { type: String, default: null },
  attemptedAt: { type: Date, required: true },
  filename: { type: String, default: null },
});

const ProcessingStagesSchema = new Schema<IProcessingStages>(
  {
    challanPayment: {
      status: {
        type: String,
        enum: [
          'pending',
          'challan_skipped',
          'verification_pending',
          'verification_failed',
          'payment_pending',
          'payment_failed',
          'payment_success',
          'challan_pending',
          'challan_downloaded',
          'upload_failed',
          'completed',
        ],
        default: 'pending',
      },
      totalAttempts: { type: Number, default: 0 },
      attempts: { type: [AttemptsSchema], default: [] },
    },
    documentDownload: {
      status: { type: String, enum: ['pending', 'in_progress', 'success'], default: 'pending' },
      totalDocuments: { type: Number, default: 0 },
      downloadedDocuments: { type: Number, default: 0 },
      pendingDocuments: { type: Number, default: 0 },
      lastUpdated: { type: Date, default: Date.now },
      completedAt: { type: Date },
      totalZipFiles: { type: Number, default: 0 },
      zipFiles: {
        type: [
          {
            filename: String,
            storage_account: String,
            container: String,
            blob_url: String,
            createdAt: Date,
            total_size_bytes: Number,
            successful_files: Number,
            failed_files: [
              {
                doc_id: Schema.Types.ObjectId,
                error: String,
              },
            ],
          },
        ],
        default: [],
      },
    },
    documentDownloadV3: {
      status: { type: String, enum: ['pending', 'in_progress', 'success'], default: 'pending' },
      totalDocuments: { type: Number, default: 0 },
      downloadedDocuments: { type: Number, default: 0 },
      pendingDocuments: { type: Number, default: 0 },
      lastUpdated: { type: Date, default: Date.now },
      completionPercentage: { type: Number, default: 0 },
      markedAsSuccess: { type: Boolean, default: false },
      completedAt: { type: Date },
      totalZipFiles: { type: Number, default: 0 },
      zipFiles: {
        type: [
          {
            filename: String,
            storage_account: String,
            container: String,
            blob_url: String,
            createdAt: Date,
            total_size_bytes: Number,
            successful_files: Number,
            failed_files: [
              {
                doc_id: Schema.Types.ObjectId,
                error: String,
              },
            ],
          },
        ],
        default: [],
      },
    },
  },
  { _id: false }
);

const JobSchema = new Schema<IJob>(
  {
    cin: { type: String, required: true },
    companyName: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    jobStatus: {
      type: String,
      enum: [
        'pending',
        'challan_skipped',
        'no_docs_found',
        'challan_paid',
        'downloading_docs',
        'documents_downloaded',
      ],
      default: 'pending',
    },
    processingStages: { type: ProcessingStagesSchema, required: true },
  },
  { timestamps: true } // Automatically add `createdAt` and `updatedAt` fields
);

export const UnlockedCompanyModel = model<IUnlockedCompany>(
  'Unlocked_Company',
  UnlockedCompanySchema
);

export const JobModel = model<IJob>('Job', JobSchema);
