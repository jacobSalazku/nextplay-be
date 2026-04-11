import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Role, Status } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import { PrismaService } from 'src/prisma/prisma.service';

const SOCKET_CORS_ORIGINS = (process.env.SOCKET_CORS_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

export type JoinRequestSocketEvent = {
  teamId: string;
  teamCode: string;
  userId: string;
  memberId: string;
  number?: string | null;
  position?: string | null;
  requestedAt: string | Date;
};

export type JoinRequestModerationSocketEvent = {
  memberId: string;
  teamId: string;
  status: Status;
};

type AccessTokenPayload = {
  sub: string;
  ver: number;
  iat?: number;
  exp?: number;
};

function readSocketToken(client: Socket): string | null {
  const auth = client.handshake.auth as { token?: unknown } | undefined;
  const token = auth?.token;
  return typeof token === 'string' && token.length > 0 ? token : null;
}

function isAccessTokenPayload(payload: unknown): payload is AccessTokenPayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'sub' in payload &&
    'ver' in payload &&
    typeof payload.sub === 'string' &&
    typeof payload.ver === 'number'
  );
}

@WebSocketGateway({
  namespace: '/team',
  cors: {
    origin: SOCKET_CORS_ORIGINS.length > 0 ? SOCKET_CORS_ORIGINS : true,
    credentials: true,
  },
})
@Injectable()
export class TeamGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
  ) {}

  @WebSocketServer()
  server: Server;

  // Maps socket connection ids to authenticated user ids.
  private readonly socketUsers = new Map<string, string>();

  async handleConnection(client: Socket) {
    // 1) Read token from socket handshake.
    const token = readSocketToken(client);
    if (!token) {
      this.rejectClient(client);
      return;
    }

    // 2) Validate JWT + user state and resolve user id for this socket.
    const userId = await this.resolveSocketUserId(token);
    if (!userId) {
      this.rejectClient(client);
      return;
    }

    this.socketUsers.set(client.id, userId);
  }

  handleDisconnect(client: Socket) {
    this.socketUsers.delete(client.id);
  }

  @SubscribeMessage('subscribe-team')
  async subscribeTeam(
    @MessageBody() body: { teamId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const teamId = body?.teamId?.trim();
    if (!teamId) {
      throw new WsException('Missing teamId');
    }

    const userId = this.socketUsers.get(client.id);
    if (!userId) {
      throw new WsException('Unauthorized');
    }

    // 3) Authorize room subscription: only active coaches can listen.
    const allowed = await this.canSubscribeToTeam(userId, teamId);
    if (!allowed) {
      throw new WsException('Forbidden');
    }

    await client.join(this.teamRoom(teamId));

    return { ok: true };
  }

  emitJoinRequest(teamId: string, payload: JoinRequestSocketEvent) {
    // Emit only to sockets that subscribed to this team's room.
    this.server.to(this.teamRoom(teamId)).emit('join-request', payload);
  }

  emitJoinRequestApproved(
    teamId: string,
    payload: JoinRequestModerationSocketEvent,
  ) {
    this.server
      .to(this.teamRoom(teamId))
      .emit('join-request-approved', payload);
  }

  emitJoinRequestRejected(
    teamId: string,
    payload: JoinRequestModerationSocketEvent,
  ) {
    this.server
      .to(this.teamRoom(teamId))
      .emit('join-request-rejected', payload);
  }

  private async resolveSocketUserId(token: string): Promise<string | null> {
    const publicKeyBase64 = this.config.get<string>('JWT_PUBLIC_KEY_BASE64');
    if (!publicKeyBase64) {
      return null;
    }

    try {
      const decoded = this.jwt.verify<AccessTokenPayload>(token, {
        publicKey: Buffer.from(publicKeyBase64, 'base64'),
        algorithms: ['RS256'],
      });

      if (!isAccessTokenPayload(decoded)) {
        return null;
      }

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
        select: {
          id: true,
          tokenVersion: true,
          isBlocked: true,
        },
      });

      if (!user || user.isBlocked || user.tokenVersion !== decoded.ver) {
        return null;
      }

      return user.id;
    } catch {
      return null;
    }
  }

  private async canSubscribeToTeam(
    userId: string,
    teamId: string,
  ): Promise<boolean> {
    const member = await this.prisma.member.findFirst({
      where: {
        teamId,
        userId,
        status: Status.ACTIVE,
        role: Role.COACH,
      },
      select: { id: true },
    });

    return Boolean(member);
  }

  private teamRoom(teamId: string): string {
    return `team:${teamId}`;
  }

  private rejectClient(client: Socket) {
    this.socketUsers.delete(client.id);
    client.disconnect();
  }
}
