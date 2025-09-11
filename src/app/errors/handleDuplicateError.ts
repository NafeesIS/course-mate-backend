type TErrorSources = {
  path: string | number;
  message: string;
}[];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handleDuplicateError = (err: any) => {
  //extract value from message to get path
  const match = err?.message?.match(/"([^"]+)"/);
  const extractedMessage = match && match[1];

  const errorSources: TErrorSources = [{ path: '', message: `${extractedMessage} already exists` }];
  const statusCode = 400;

  return {
    statusCode,
    message: 'Failed to create document due to duplicate value.',
    errorSources,
  };
};

export default handleDuplicateError;
