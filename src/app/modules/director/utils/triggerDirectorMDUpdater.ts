import { ServiceBusClient, ServiceBusMessage } from '@azure/service-bus';
import config from '../../../config';

// Initialize Azure Service Bus client
const serviceBusClient = new ServiceBusClient(config.azure_service_bus_connection_string as string);

async function triggerDirectorMDUpdater(din: string): Promise<{ messageId: string } | Error> {
  const queueName: string = config.director_updater_queue_name as string;
  if (!queueName) {
    throw new Error('Queue name must be defined');
  }

  try {
    // Create a sender for the queue
    const sender = serviceBusClient.createSender(queueName);

    // Send the message with the body as a plain object
    const message: ServiceBusMessage = {
      body: { din }, // Send as object directly, not stringified
      contentType: 'application/json',
    };

    await sender.sendMessages(message);
    await sender.close();

    // Generate a unique message ID based on the DIN and timestamp
    const messageId = `${din}-${Date.now()}`;
    return { messageId };
  } catch (err) {
    console.log(err);
    throw new Error('Failed to push message to Director Contact Updater');
  }
}

export default triggerDirectorMDUpdater;
