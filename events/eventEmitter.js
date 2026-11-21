const EventEmitter = require('events');

/**
 * Custom EventEmitter for handling platform domain events
 */
class PlatformEventEmitter extends EventEmitter {}

const appEventEmitter = new PlatformEventEmitter();

// Event Listener: User Registration
appEventEmitter.on('user_registered', (userData) => {
  const timestamp = new Date().toISOString();
  console.log(
    `\n[EVENT: USER_REGISTERED] [${timestamp}] New user account registered:\n` +
    `  - User ID  : ${userData.id}\n` +
    `  - Username : ${userData.username}\n` +
    `  - Email    : ${userData.email}\n` +
    `  - Role     : ${userData.role}`
  );
});

// Event Listener: User Login
appEventEmitter.on('user_logged_in', (userData) => {
  const timestamp = new Date().toISOString();
  console.log(
    `\n[EVENT: USER_LOGGED_IN] [${timestamp}] User logged in successfully:\n` +
    `  - User ID  : ${userData.id}\n` +
    `  - Username : ${userData.username}\n` +
    `  - Email    : ${userData.email}\n` +
    `  - Role     : ${userData.role}`
  );
});

// Event Listener: Note Creation
appEventEmitter.on('note_created', (noteData) => {
  const timestamp = new Date().toISOString();
  console.log(
    `\n[EVENT: NOTE_CREATED] [${timestamp}] New secure note created:\n` +
    `  - Note ID  : ${noteData._id}\n` +
    `  - Title    : "${noteData.title}"\n` +
    `  - Owner ID : ${noteData.owner}`
  );
});

// Event Listener: Note Deletion
appEventEmitter.on('note_deleted', (noteData) => {
  const timestamp = new Date().toISOString();
  console.log(
    `\n[EVENT: NOTE_DELETED] [${timestamp}] Secure note deleted:\n` +
    `  - Note ID  : ${noteData._id}\n` +
    `  - Title    : "${noteData.title}"\n` +
    `  - Owner ID : ${noteData.owner}`
  );
});

module.exports = appEventEmitter;

