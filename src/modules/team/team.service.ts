import { Injectable, NotFoundException } from '@nestjs/common';
import { Role, Status } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTeamInput } from './dto';

@Injectable()
export class TeamService {
  constructor(private readonly prisma: PrismaService) {}

  async createTeam(input: CreateTeamInput, creatorId: string) {
    const code = await this.generateUniqueCode();

    return await this.prisma.$transaction(async (prisma) => {
      const team = await prisma.team.create({
        data: {
          name: input.name,
          image: input.image,
          ageGroup: input.ageGroup,
          code,
          creatorId,
          members: {
            create: {
              userId: creatorId,
              role: Role.COACH,
              status: Status.ACTIVE,
            },
          },
        },
      });

      await prisma.user.update({
        where: { id: creatorId },
        data: { hasOnBoarded: true },
      });

      return team;
    });
  }

  async getTeams(userId: string) {
    const teams = await this.prisma.team.findMany({
      where: {
        members: {
          some: {
            userId: userId,
            status: Status.ACTIVE,
          },
        },
      },
      select: {
        id: true,
        name: true,
        code: true,
        ageGroup: true,
        image: true,
        creatorId: true,
        createdAt: true,
        updatedAt: true,
        activities: {
          select: {
            id: true,
            title: true,
            time: true,
            type: true,
            date: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { date: 'desc' },
        },
        members: {
          select: {
            userId: true,
            role: true,
            status: true,
            user: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!teams) {
      throw new NotFoundException('Teams not found');
    }

    return teams;
  }
  async getTeamsForDashboard(userId: string) {
    const teams = await this.prisma.team.findMany({
      where: {
        members: {
          some: {
            userId,
            status: Status.ACTIVE,
          },
        },
      },
      select: {
        id: true,
        name: true,
        ageGroup: true,
        members: {
          select: {
            id: true,
          },
        },
        activities: {
          select: {
            id: true,
            type: true,
            title: true,
            date: true,
            time: true,
          },
          orderBy: {
            date: 'desc',
          },
        },
      },
    });

    return teams;
  }

  async getTeam(teamId: string) {
    const team = await this.prisma.team.findFirst({
      where: {
        id: teamId,
      },
      select: {
        id: true,
        name: true,
        code: true,
        image: true,
        ageGroup: true,
        members: {
          select: {
            userId: true,
            role: true,
            status: true,
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        activities: {
          orderBy: { date: 'desc' },
          select: {
            id: true,
            title: true,
            duration: true,
            date: true,
            time: true,
            type: true,
            attendees: {
              select: {
                id: true,
                activityId: true,
                attendanceStatus: true,
                Member: {
                  select: {
                    id: true,
                    user: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!team) {
      throw new NotFoundException('Team isnot found');
    }

    return team;
  }

  private async generateUniqueCode(): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const code = Math.random().toString(36).slice(2, 8).toUpperCase();
      const existingTeam = await this.prisma.team.findUnique({
        where: { code },
        select: { id: true },
      });

      if (!existingTeam) {
        return code;
      }
    }

    throw new Error('Unable to generate a unique team code');
  }
}
