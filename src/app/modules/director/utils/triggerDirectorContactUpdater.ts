import { SQSClient, SendMessageCommand, SendMessageCommandOutput } from '@aws-sdk/client-sqs';
import config from '../../../config';
const sqsClient = new SQSClient({
  region: config.region_name,
  credentials: {
    accessKeyId: config.aws_access_key_id as string,
    secretAccessKey: config.aws_secret_access_key as string,
  },
});

async function triggerDirectorContactUpdater(
  DINPAN: string
): Promise<SendMessageCommandOutput | Error> {
  const queueUrl: string = config.director_mobile_updater_queue_url as string;
  // 'https://sqs.ap-south-1.amazonaws.com/228945573538/directorMobileUpdater';
  if (!queueUrl) {
    throw new Error('Queue URL must be defined');
  }
  const messageBody = JSON.stringify({ DINPAN }); // Convert the DIN to a JSON string
  const params = {
    QueueUrl: queueUrl,
    MessageBody: messageBody,
  };

  try {
    const response = await sqsClient.send(new SendMessageCommand(params));
    return response;
  } catch (err) {
    console.log(err);
    throw new Error('Failed to push message to Director Contact Updater');
  }
}

export default triggerDirectorContactUpdater;
