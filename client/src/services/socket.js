import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect(token) {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinGroup(groupId) {
    if (this.socket?.connected) {
      this.socket.emit('join_group', groupId);
    }
  }

  leaveGroup(groupId) {
    if (this.socket?.connected) {
      this.socket.emit('leave_group', groupId);
    }
  }

  onExpenseAdded(callback) {
    if (this.socket) {
      this.socket.on('expense_added', callback);
    }
    return () => this.socket?.off('expense_added', callback);
  }

  onSettlementExecuted(callback) {
    if (this.socket) {
      this.socket.on('settlement_executed', callback);
    }
    return () => this.socket?.off('settlement_executed', callback);
  }

  onMemberAdded(callback) {
    if (this.socket) {
      this.socket.on('member_added', callback);
    }
    return () => this.socket?.off('member_added', callback);
  }

  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }
}

export const socketService = new SocketService();
export default socketService;
