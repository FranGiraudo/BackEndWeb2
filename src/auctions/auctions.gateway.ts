import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class AuctionsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinAuction')
  handleJoinAuction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { auctionId: number },
  ) {
    if (data && data.auctionId) {
      const room = `auction_${data.auctionId}`;
      client.join(room);
      console.log(`Client ${client.id} joined room: ${room}`);
      return { event: 'joined', data: room };
    }
    return { event: 'error', data: 'No auctionId provided' };
  }

  @SubscribeMessage('leaveAuction')
  handleLeaveAuction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { auctionId: number },
  ) {
    if (data && data.auctionId) {
      const room = `auction_${data.auctionId}`;
      client.leave(room);
      console.log(`Client ${client.id} left room: ${room}`);
    }
  }

  /**
   * Called by the AuctionsService to notify all clients in a specific auction room
   * that a new bid has been placed.
   */
  emitNewBid(auctionId: number, currentPrice: number, bidderId: number) {
    const room = `auction_${auctionId}`;
    this.server.to(room).emit('newBid', {
      auctionId,
      currentPrice,
      bidderId,
    });
  }

  /**
   * Called by the AuctionsService to notify all clients in a specific auction room
   * that the auction has ended.
   */
  emitAuctionEnded(auctionId: number, finalPrice: number, winnerId: number | null) {
    const room = `auction_${auctionId}`;
    this.server.to(room).emit('auctionEnded', {
      auctionId,
      finalPrice,
      winnerId,
    });
  }
}
