/**
 * Real-Time Chat using Socket.IO
 *
 * Implements bidirectional real-time communication:
 * - join_room: joins a user to a specific chat room
 * - send_message: broadcasts a message to everyone in the room
 * - receive_message: event received by clients containing message data
 * - disconnect: logs client disconnection and leaves room
 */
const initChatSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`\n[Socket.IO] New client connected: ${socket.id}`);

    /**
     * Event: join_room
     * Payload: { username: string, room: string }
     */
    socket.on('join_room', (data) => {
      try {
        const username = data?.username || 'Anonymous';
        const room = data?.room || 'general';

        socket.join(room);
        socket.data.username = username;
        socket.data.room = room;

        console.log(
          `[Socket.IO] User "${username}" (${socket.id}) successfully joined room: "${room}"`
        );

        // Notify other members of the room that a new user joined
        socket.to(room).emit('receive_message', {
          sender: 'System',
          message: `${username} has joined the room.`,
          room,
          timestamp: new Date().toISOString()
        });

        // Acknowledge the user joining
        socket.emit('joined_room_ack', {
          status: 'success',
          room,
          message: `You joined room: ${room}`
        });
      } catch (error) {
        console.error(`[Socket.IO Error in join_room]: ${error.message}`);
      }
    });

    /**
     * Event: send_message
     * Payload: { room: string, message: string, sender: string }
     */
    socket.on('send_message', (data) => {
      try {
        const room = data?.room || socket.data.room || 'general';
        const sender = data?.sender || socket.data.username || 'Anonymous';
        const message = data?.message || '';

        if (!message.trim()) {
          return;
        }

        const messagePayload = {
          sender,
          message: message.trim(),
          room,
          timestamp: new Date().toISOString()
        };

        console.log(
          `[Socket.IO] [Room: "${room}"] Message from "${sender}": "${messagePayload.message}"`
        );

        // Broadcast the message to EVERY client in the room (including sender)
        io.to(room).emit('receive_message', messagePayload);
      } catch (error) {
        console.error(`[Socket.IO Error in send_message]: ${error.message}`);
      }
    });

    /**
     * Event: disconnect
     */
    socket.on('disconnect', (reason) => {
      const username = socket.data.username || socket.id;
      const room = socket.data.room;

      console.log(`[Socket.IO] Client disconnected: ${socket.id} (Reason: ${reason})`);

      if (room) {
        socket.to(room).emit('receive_message', {
          sender: 'System',
          message: `${username} has left the room.`,
          room,
          timestamp: new Date().toISOString()
        });
      }
    });
  });
};

module.exports = initChatSocket;

