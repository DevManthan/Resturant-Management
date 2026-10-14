let ioInstance = null;

export const initSocket = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Join specific room (e.g. 'kitchen', 'table-102', 'admin')
    socket.on('join_room', (room) => {
      socket.join(room);
      console.log(`[Socket.io] Socket ${socket.id} joined room "${room}"`);
    });

    // Customer calling waiter from FAB button
    socket.on('call_waiter', (payload) => {
      console.log(`[Socket.io] Waiter called at table ${payload.table_id}`);
      io.emit('waiter_called', {
        ...payload,
        timestamp: new Date()
      });
    });

    // Waiter acknowledged call
    socket.on('acknowledge_waiter_call', (payload) => {
      io.emit('waiter_call_resolved', payload);
    });

    // Live kitchen ticket state change
    socket.on('update_ticket_status', (payload) => {
      io.emit('kds_ticket_updated', payload);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const broadcastKdsUpdate = (data) => {
  if (ioInstance) {
    ioInstance.emit('kds_ticket_updated', data);
  }
};

export const broadcastTableUpdate = (data) => {
  if (ioInstance) {
    ioInstance.emit('table_status_updated', data);
  }
};

export const broadcastWaiterCall = (data) => {
  if (ioInstance) {
    ioInstance.emit('waiter_called', data);
  }
};
