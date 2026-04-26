import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateUserInput } from './dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserById(currentUserId: string, teamShortIdOrRef: string) {
    const teamShortId = this.extractTeamShortId(teamShortIdOrRef);

    const user = await this.prisma.user.findUnique({
      where: { id: currentUserId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        dominantHand: true,
        dateOfBirth: true,
        phone: true,
        height: true,
        weight: true,
        createdAt: true,
        updatedAt: true,
        hasOnBoarded: true,
        members: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User is not logged in');
    }

    const team = await this.prisma.team.findUnique({
      where: { shortId: teamShortId },
      select: { id: true },
    });

    if (!team) {
      throw new ForbiddenException('Team not found');
    }

    const member = await this.prisma.member.findFirst({
      where: { teamId: team.id, userId: currentUserId },
      select: {
        id: true,
        userId: true,
        teamId: true,
        status: true,
        role: true,
        number: true,
        position: true,
        attendances: {
          select: {
            attendanceStatus: true,
            reason: true,
            activity: {
              select: { id: true, title: true, time: true, date: true },
            },
          },
        },
      },
    });

    if (!member || member.userId !== currentUserId) {
      throw new ForbiddenException('Not a member of this team');
    }

    return { user, member };
  }

  async updateUser(input: UpdateUserInput, userId: string) {
    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: {
          name: input.name,
          dateOfBirth: new Date(input.dateOfBirth),
          phone: input.phone ?? undefined,
          height: input.height ?? undefined,
          weight: input.weight ?? undefined,
          dominantHand: input.dominantHand ?? undefined,
          hasOnBoarded: true,
        },
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const fields = this.extractUniqueConstraintFields(error);

        if (fields.includes('phone')) {
          throw new ConflictException('Phone number is already in use.');
        }

        if (fields.length > 0) {
          throw new ConflictException(
            `Duplicate value for unique field(s): ${fields.join(', ')}.`,
          );
        }

        throw new ConflictException('A unique value already exists.');
      }

      throw error;
    }
  }

  private extractUniqueConstraintFields(
    error: Prisma.PrismaClientKnownRequestError,
  ): string[] {
    const meta = error.meta as
      | {
          target?: string[] | string;
          driverAdapterError?: {
            cause?: {
              constraint?: {
                fields?: string[];
              };
            };
          };
        }
      | undefined;

    const targetFields = Array.isArray(meta?.target)
      ? meta.target
      : typeof meta?.target === 'string'
        ? [meta.target]
        : [];

    const constraintFields =
      meta?.driverAdapterError?.cause?.constraint?.fields ?? [];

    return [...new Set([...targetFields, ...constraintFields])];
  }

  private extractTeamShortId(teamRef: string): string {
    const normalizedTeamRef = teamRef.trim().toLowerCase();
    const segments = normalizedTeamRef.split('-');
    const possibleShortId = segments.at(-1) ?? normalizedTeamRef;
    const validShortIdPattern = /^[a-z0-9]{6,12}$/;

    if (!validShortIdPattern.test(possibleShortId)) {
      throw new BadRequestException('Invalid team reference');
    }

    return possibleShortId;
  }
}
