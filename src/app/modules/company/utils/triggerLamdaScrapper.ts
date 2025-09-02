import { SQSClient, SendMessageCommand, SendMessageCommandOutput } from '@aws-sdk/client-sqs';
import { ServiceBusClient, ServiceBusMessage } from '@azure/service-bus';
import { differenceInHours } from 'date-fns';
import config from '../../../config';
import { UpdateLogModel } from '../company.model';

// interface TSQSResponse extends SendMessageCommandOutput {
//   MD5OfMessageBody: string;
//   MessageId: string;
// }
type TResult = {
  sqsScrapperResponse?: string;
  sqsCompanyScrapperResponse?: string;
  sqsGstScrapperResponse?: string;
  sqsLLPVpdScrapperResponse?: string;
  companyVpdV3ScrapperResponse?: string;
};

const sqsClient = new SQSClient({
  region: config.region_name,
  credentials: {
    accessKeyId: config.aws_access_key_id as string,
    secretAccessKey: config.aws_secret_access_key as string,
  },
});

// Initialize Azure Service Bus client
const serviceBusClient = new ServiceBusClient(config.azure_service_bus_connection_string as string);

// async function pushToSrnSqs(cin: string): Promise<SendMessageCommandOutput | Error> {
//   const queueUrl: string = config.srn_queue_url as string; // Example, but better to validate it's not empty
//   if (!queueUrl) {
//     throw new Error('Queue URL must be defined');
//   }
//   const messageBody = JSON.stringify({ cin }); // Convert the CIN to a JSON string
//   const params = {
//     QueueUrl: queueUrl,
//     MessageBody: messageBody,
//   };

//   try {
//     const response = await sqsClient.send(new SendMessageCommand(params));
//     return response;
//   } catch (err) {
//     console.log(err);
//     throw new Error('Failed to push message to SRN SQS');
//   }
// }

async function pushToCompanySqs(cin: string): Promise<{ messageId: string } | Error> {
  const queueName: string = config.company_update_queue_name as string; // Azure Service Bus queue name
  if (!queueName) {
    throw new Error('Queue name must be defined');
  }

  try {
    // Create a sender for the queue
    const sender = serviceBusClient.createSender(queueName);

    // Send the message with the body as a plain object, not stringified
    const message: ServiceBusMessage = {
      body: { cin }, // Send as object directly, not stringified
      contentType: 'application/json',
    };

    await sender.sendMessages(message);
    await sender.close();

    // Since we can't get the message ID directly from the response,
    // we'll generate a unique ID based on the CIN and timestamp
    const messageId = `${cin}-${Date.now()}-${queueName}`;
    return { messageId };
  } catch (err) {
    console.log(err);
    throw new Error('Failed to push message to Company Azure Service Bus');
  }
}

async function pushToGSTSqs(
  cin: string,
  incorporationDate: string
): Promise<SendMessageCommandOutput | Error> {
  const queueUrl: string = config.gst_update_queue_url as string; // Example, but better to validate it's not empty
  if (!queueUrl) {
    throw new Error('Queue URL must be defined');
  }
  const messageBody = JSON.stringify({ cin, incorporationDate }); // Convert the CIN to a JSON string
  const params = {
    QueueUrl: queueUrl,
    MessageBody: messageBody,
  };

  try {
    const response = await sqsClient.send(new SendMessageCommand(params));
    return response;
  } catch (err) {
    console.log(err);
    throw new Error('Failed to push message to Company SQS');
  }
}

async function pushToLLPVpdSqs(cin: string): Promise<SendMessageCommandOutput | Error> {
  const queueUrl: string = config.llp_vpd_update_queue_url as string; // Example, but better to validate it's not empty
  if (!queueUrl) {
    throw new Error('Queue URL must be defined');
  }
  const messageBody = JSON.stringify({ cin }); // Convert the CIN to a JSON string
  const params = {
    QueueUrl: queueUrl,
    MessageBody: messageBody,
  };

  try {
    const response = await sqsClient.send(new SendMessageCommand(params));
    return response;
  } catch (err) {
    console.log(err);
    throw new Error('Failed to push message to Company SQS');
  }
}

async function pushToCompanyVpdV3Sqs(cin: string): Promise<{ messageId: string } | Error> {
  const queueName: string = config.company_vpd_v3_update_queue_name as string; // Azure Service Bus queue name
  if (!queueName) {
    throw new Error('Queue name must be defined');
  }

  try {
    // Create a sender for the queue
    const sender = serviceBusClient.createSender(queueName);

    // Send the message with the body as a plain object, not stringified
    const message: ServiceBusMessage = {
      body: { cin }, // Send as object directly, not stringified
      contentType: 'application/json',
    };

    await sender.sendMessages(message);
    await sender.close();

    // Since we can't get the message ID directly from the response,
    // we'll generate a unique ID based on the CIN and timestamp
    const messageId = `${cin}-${Date.now()}-${queueName}`;
    return { messageId };
  } catch (err) {
    console.log(err);
    throw new Error('Failed to push message to Company Azure Service Bus');
  }
}

// async function pushToCompanyVpdV3Sqs(cin: string): Promise<SendMessageCommandOutput | Error> {
//   const queueUrl: string = config.company_vpd_v3_update_queue_name as string; // Example, but better to validate it's not empty
//   if (!queueUrl) {
//     throw new Error('Queue URL must be defined');
//   }
//   const messageBody = JSON.stringify({ cin }); // Convert the CIN to a JSON string
//   const params = {
//     QueueUrl: queueUrl,
//     MessageBody: messageBody,
//   };

//   try {
//     const response = await sqsClient.send(new SendMessageCommand(params));
//     return response;
//   } catch (err) {
//     console.log(err);
//     throw new Error('Failed to push message to Company SQS');
//   }
// }

const triggerLambdaScrapper = async (
  cin: string,
  incorporationDate: string,
  companyType: string
) => {
  const updateLog = await UpdateLogModel.findOne({ cin: cin }).sort({ createdAt: -1 });

  // Define URLs for the APIs
  // const vpdV3ScrapperURL = 'https://asia-south1-glossy-flow-418503.cloudfunctions.net/function-1'; //google cloud functions
  const promises = [];

  if (!updateLog) {
    const newLogData = {
      isCompanyDataUpdated: 'initiated',
      isGstUpdated: 'initiated',
    };

    if (companyType === 'Company') {
      Object.assign(newLogData, {
        // isSrnDataUpdated: 'initiated',
        isVpdV3Updated: 'initiated',
      });

      // First ensure log is created/updated before proceeding with asynchronous operations
      await UpdateLogModel.findOneAndUpdate(
        { cin },
        { $setOnInsert: newLogData },
        { upsert: true, new: true }
      );

      // After updating the log, execute asynchronous operations
      promises.push(pushToCompanySqs(cin).then(data => ({ type: 'companySqs', data }))); //company update
      promises.push(pushToGSTSqs(cin, incorporationDate).then(data => ({ type: 'gstSqs', data }))); //gst update
      promises.push(pushToCompanyVpdV3Sqs(cin).then(data => ({ type: 'companyVpdV3Sqs', data }))); //v3 update
      // promises.push(pushToSrnSqs(cin).then(data => ({ type: 'srnSqs', data }))); //srn update
    } else if (companyType === 'LLP') {
      Object.assign(newLogData, {
        isLLPVpdUpdated: 'initiated',
      });

      // Update the log first
      await UpdateLogModel.findOneAndUpdate(
        { cin },
        { $setOnInsert: newLogData },
        { upsert: true, new: true }
      );

      // After updating, queue promises
      promises.push(pushToCompanySqs(cin).then(data => ({ type: 'companySqs', data }))); //company update
      promises.push(pushToGSTSqs(cin, incorporationDate).then(data => ({ type: 'gstSqs', data }))); //gst update
      promises.push(pushToLLPVpdSqs(cin).then(data => ({ type: 'llpVpdSqs', data }))); //llp vpd update
    }

    // // Create a new update log with all statuses set to 'initiated'
    // updateLog = await UpdateLogModel.findOneAndUpdate(
    //   { cin },
    //   {
    //     $setOnInsert: {
    //       cin,
    //       isCompanyDataUpdated: 'initiated',
    //       isSrnDataUpdated: 'initiated',
    //       isVpdV3Updated: 'initiated',
    //       isGstUpdated: 'initiated',
    //       isLLPVpdUpdated: 'initiated',
    //     },
    //   },
    //   { upsert: true, new: true }
    // );
    // promises.push(axios.post(vpdV3ScrapperURL, { cin }).then(data => ({ type: 'vpdV3', data }))); //v3 update
    // promises.push(pushToSrnSqs(cin).then(data => ({ type: 'srnSqs', data }))); //srn update
    // promises.push(pushToCompanySqs(cin).then(data => ({ type: 'companySqs', data }))); //company update
    // promises.push(pushToGSTSqs(cin, incorporationDate).then(data => ({ type: 'gstSqs', data }))); //gst update
    // promises.push(pushToLLPVpdSqs(cin).then(data => ({ type: 'llpVpdSqs', data }))); //company update
  } else {
    const hoursDiff = differenceInHours(new Date(), new Date(updateLog.lastUpdatedOn));
    const updateFields: { [key: string]: string } = {};

    if (updateLog.isCompanyDataUpdated !== 'completed' || hoursDiff >= 24) {
      updateFields['isCompanyDataUpdated'] = 'initiated';
      promises.push(pushToCompanySqs(cin).then(data => ({ type: 'companySqs', data })));
    }
    if (updateLog.isGstUpdated !== 'completed' || hoursDiff >= 24) {
      updateFields['isGstUpdated'] = 'initiated';
      promises.push(pushToGSTSqs(cin, incorporationDate).then(data => ({ type: 'gstSqs', data })));
    }

    if (companyType === 'Company') {
      if (updateLog.isVpdV3Updated !== 'completed' || hoursDiff >= 24) {
        updateFields['isVpdV3Updated'] = 'initiated';
        promises.push(pushToCompanyVpdV3Sqs(cin).then(data => ({ type: 'companyVpdV3Sqs', data })));
      }
      // if (updateLog.isSrnDataUpdated !== 'completed' || hoursDiff >= 24) {
      //   updateFields['isSrnDataUpdated'] = 'initiated';
      //   // promises.push(pushToSrnSqs(cin).then(data => ({ type: 'srnSqs', data })));
      // }
    } else if (companyType === 'LLP') {
      if (updateLog.isLLPVpdUpdated !== 'completed' || hoursDiff >= 24) {
        updateFields['isLLPVpdUpdated'] = 'initiated';
        promises.push(pushToLLPVpdSqs(cin).then(data => ({ type: 'llpVpdSqs', data })));
      }
    }

    //update al field together in database
    if (Object.keys(updateFields).length > 0) {
      await UpdateLogModel.updateOne({ cin }, { $set: updateFields });
    }
  }

  try {
    const responses = await Promise.all(promises);
    // console.log('responses', responses);`
    const result: TResult = {};
    responses.forEach(response => {
      if (response.type === 'companyVpdV3Sqs' && 'MessageId' in response.data) {
        result.companyVpdV3ScrapperResponse = response.data.MessageId;
        // } else if (response.type === 'srnSqs' && 'MessageId' in response.data) {
        //   result.sqsScrapperResponse = response.data.MessageId;
      } else if (response.type === 'companySqs' && 'MessageId' in response.data) {
        result.sqsCompanyScrapperResponse = response.data.MessageId;
      } else if (response.type === 'gstSqs' && 'MessageId' in response.data) {
        result.sqsGstScrapperResponse = response.data.MessageId;
      } else if (response.type === 'llpVpdSqs' && 'MessageId' in response.data) {
        result.sqsLLPVpdScrapperResponse = response.data.MessageId;
      }
    });

    return result;
  } catch (error) {
    console.error('Error triggering Lambda functions:', error);
    throw new Error('Failed to trigger Lambda scrapper');
  }
};

export default triggerLambdaScrapper;
