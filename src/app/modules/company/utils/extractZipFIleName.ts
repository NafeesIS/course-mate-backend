export const extractZipFileName = (fileName: string): string => {
  // This regex matches the last part of the filename that contains batch_X.zip
  const regex = /batch_(\d+)\.zip$/;
  const match = fileName.match(regex);

  if (match) {
    return `batch_${match[1]}.zip`;
  }

  return fileName; // Return original filename if no match found
};
