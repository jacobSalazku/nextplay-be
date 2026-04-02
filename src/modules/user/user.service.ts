import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateUserInput } from './dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

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
}
