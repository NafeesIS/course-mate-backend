export const createJobPayload = (
  companyId: string,
  companyName: string,
  userId: string,
  jobStatus: string = 'pending',
  challanStatus: string = 'pending',
  documentDownloadStatus: string = 'pending',
  documentDownloadV3Status: string = 'pending'
) => ({
  cin: companyId,
  companyName: companyName,
  userId: userId,
  jobStatus: jobStatus,
  processingStages: {
    challanPayment: { status: challanStatus, totalAttempts: 0, attempts: [] },
    documentDownload: {
      status: documentDownloadStatus,
      totalDocuments: 0,
      downloadedDocuments: 0,
      pendingDocuments: 0,
      lastUpdated: new Date(),
    },
    documentDownloadV3: {
      status: documentDownloadV3Status,
      totalDocuments: 0,
      downloadedDocuments: 0,
      pendingDocuments: 0,
      lastUpdated: new Date(),
    },
  },
});
