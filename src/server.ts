import { Server } from 'http';
import mongoose from 'mongoose';
import app from './app';
import config from './app/config';

let server: Server;

async function main() {
  try {
    // Connect to the database
    await mongoose.connect(config.database_url as string);
    // If the database connection is successful, log a message
    console.log('Connected to the database');

    // Start the application server
    server = app.listen(config.port, () => {
      console.log(`Filesure server listening on port ${config.port}`);
    });
  } catch (err) {
    console.error(err);
  }
}

main();

process.on('unhandledRejection', err => {
  console.log('😈 Unhandled rejection is detected. Exiting...', err);
  // Attempt to gracefully shut down the server if it's running
  if (server) {
    console.log('🚪 Server shut down successfully.');
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1); // Exit immediately if the server isn't running
  }
});

process.on('uncaughtException', err => {
  console.log('😈 Uncaught exception is detected. Shutting down ...', err);
  console.log('🚪 Server shut down successfully.');
  process.exit(1);
});
