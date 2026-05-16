import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ActivityType, AttendanceStatus, Role, Status } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  StatsPerGameInput,
  SubmitStatlinesInput,
  TeamStatlineInput,
} from './dto';

@Injectable()
export class StatlineService {
  private readonly logger = new Logger(StatlineService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getStatlineAverages(input: TeamStatlineInput, userId: string) {
    const team = await this.resolveTeam(input.teamRef);
    await this.assertActiveMembership(team.id, userId);

    const startOfTomorrow = this.getStartOfTomorrow();
    const teamMembers = await this.prisma.member.findMany({
      where: {
        teamId: team.id,
        role: Role.PLAYER,
        status: Status.ACTIVE,
      },
      select: {
        id: true,
        user: { select: { name: true } },
      },
    });

    if (teamMembers.length === 0) {
      return [];
    }

    const gameIds = await this.prisma.activity.findMany({
      where: {
        teamId: team.id,
        type: ActivityType.GAME,
        date: { lt: startOfTomorrow },
      },
      select: { id: true },
    });

    if (gameIds.length === 0) {
      return teamMembers.map((member) => ({
        memberId: member.id,
        name: member.user.name ?? undefined,
        totalPoints: 0,
        gamesPlayed: 0,
        averages: {
          pointsPerGame: 0,
          fieldGoalPercentage: 0,
          threePointPercentage: 0,
          freeThrowPercentage: 0,
          assists: 0,
          offensiveRebound: 0,
          defensiveRebound: 0,
          blocks: 0,
          steals: 0,
          turnovers: 0,
        },
      }));
    }

    return Promise.all(
      teamMembers.map(async (member) => {
        const stats = await this.prisma.statline.aggregate({
          where: {
            memberId: member.id,
            gameId: { in: gameIds.map((game) => game.id) },
            Game: {
              is: {
                activity: {
                  teamId: team.id,
                  type: ActivityType.GAME,
                  date: { lt: startOfTomorrow },
                  attendees: {
                    some: {
                      memberId: member.id,
                      attendanceStatus: AttendanceStatus.ATTENDING,
                    },
                  },
                },
              },
            },
          },
          _sum: {
            fieldGoalsMade: true,
            fieldGoalsMissed: true,
            threePointersMade: true,
            threePointersMissed: true,
            freeThrows: true,
            freeThrowsMissed: true,
            assists: true,
            offensiveRebounds: true,
            defensiveRebounds: true,
            blocks: true,
            steals: true,
            turnovers: true,
          },
          _count: { id: true },
        });

        const madeFG = this.safe(stats._sum.fieldGoalsMade);
        const missedFG = this.safe(stats._sum.fieldGoalsMissed);
        const made3P = this.safe(stats._sum.threePointersMade);
        const missed3P = this.safe(stats._sum.threePointersMissed);
        const madeFT = this.safe(stats._sum.freeThrows);
        const missedFT = this.safe(stats._sum.freeThrowsMissed);
        const totalPoints = this.calculateTotalPoints({
          fieldGoalsMade: madeFG,
          threePointersMade: made3P,
          freeThrows: madeFT,
        });
        const gamesPlayed = stats._count.id ?? 0;

        return {
          memberId: member.id,
          name: member.user.name ?? undefined,
          totalPoints: this.round(totalPoints),
          gamesPlayed,
          averages: {
            pointsPerGame: this.round(
              gamesPlayed === 0 ? 0 : totalPoints / gamesPlayed,
            ),
            fieldGoalPercentage: this.round(
              this.calculatePercentage(madeFG, missedFG),
            ),
            threePointPercentage: this.round(
              this.calculatePercentage(made3P, missed3P),
            ),
            freeThrowPercentage: this.round(
              this.calculatePercentage(madeFT, missedFT),
            ),
            assists: this.round(
              gamesPlayed === 0
                ? 0
                : this.safe(stats._sum.assists) / gamesPlayed,
            ),
            offensiveRebound: this.round(
              gamesPlayed === 0
                ? 0
                : this.safe(stats._sum.offensiveRebounds) / gamesPlayed,
            ),
            defensiveRebound: this.round(
              gamesPlayed === 0
                ? 0
                : this.safe(stats._sum.defensiveRebounds) / gamesPlayed,
            ),
            blocks: this.round(
              gamesPlayed === 0
                ? 0
                : this.safe(stats._sum.blocks) / gamesPlayed,
            ),
            steals: this.round(
              gamesPlayed === 0
                ? 0
                : this.safe(stats._sum.steals) / gamesPlayed,
            ),
            turnovers: this.round(
              gamesPlayed === 0
                ? 0
                : this.safe(stats._sum.turnovers) / gamesPlayed,
            ),
          },
        };
      }),
    );
  }

  async getWeeklyTeamAverages(input: TeamStatlineInput, userId: string) {
    const team = await this.resolveTeam(input.teamRef);
    await this.assertActiveMembership(team.id, userId);

    const startOfTomorrow = this.getStartOfTomorrow();
    const games = await this.prisma.activity.findMany({
      where: {
        teamId: team.id,
        type: ActivityType.GAME,
        date: { lt: startOfTomorrow },
        game: {
          is: {
            statlines: { some: {} },
          },
        },
      },
      select: {
        id: true,
        date: true,
      },
      orderBy: { date: 'asc' },
    });

    const gamesByWeek: Record<string, string[]> = {};

    for (const game of games) {
      const date = new Date(game.date);
      const startOfWeek = new Date(date);
      startOfWeek.setUTCDate(date.getUTCDate() - date.getUTCDay());
      const weekKey = startOfWeek.toISOString().split('T')[0] ?? '';

      gamesByWeek[weekKey] ??= [];
      gamesByWeek[weekKey]?.push(game.id);
    }

    const weeklyStats: Array<Record<string, unknown>> = [];

    for (const [weekStart, gameIds] of Object.entries(gamesByWeek)) {
      const totals = await this.prisma.statline.aggregate({
        where: { gameId: { in: gameIds } },
        _sum: {
          fieldGoalsMade: true,
          fieldGoalsMissed: true,
          threePointersMade: true,
          threePointersMissed: true,
          freeThrows: true,
          freeThrowsMissed: true,
          assists: true,
          offensiveRebounds: true,
          defensiveRebounds: true,
          steals: true,
          blocks: true,
          turnovers: true,
        },
      });

      const totalFG = this.safe(totals._sum.fieldGoalsMade);
      const totalMissedFG = this.safe(totals._sum.fieldGoalsMissed);
      const total3P = this.safe(totals._sum.threePointersMade);
      const totalMissed3P = this.safe(totals._sum.threePointersMissed);
      const totalFT = this.safe(totals._sum.freeThrows);
      const totalMissedFT = this.safe(totals._sum.freeThrowsMissed);
      const totalPoints = this.calculateTotalPoints({
        fieldGoalsMade: totalFG,
        threePointersMade: total3P,
        freeThrows: totalFT,
      });
      const gamesPlayed = gameIds.length;
      const totalRebounds =
        this.safe(totals._sum.offensiveRebounds) +
        this.safe(totals._sum.defensiveRebounds);

      weeklyStats.push({
        weekStart,
        gamesPlayed,
        totalPoints: this.round(totalPoints),
        fieldGoalsMade: this.round(totalFG),
        fieldGoalsMissed: this.round(totalMissedFG),
        threePointersMade: this.round(total3P),
        threePointersMissed: this.round(totalMissed3P),
        freeThrows: this.round(totalFT),
        freeThrowsMissed: this.round(totalMissedFT),
        assists: this.round(this.safe(totals._sum.assists)),
        rebounds: this.round(totalRebounds),
        steals: this.round(this.safe(totals._sum.steals)),
        blocks: this.round(this.safe(totals._sum.blocks)),
        turnovers: this.round(this.safe(totals._sum.turnovers)),
        averages: {
          pointsPerGame: this.round(
            gamesPlayed === 0 ? 0 : totalPoints / gamesPlayed,
          ),
          assistsPerGame: this.round(
            gamesPlayed === 0
              ? 0
              : this.safe(totals._sum.assists) / gamesPlayed,
          ),
          reboundsPerGame: this.round(
            gamesPlayed === 0 ? 0 : totalRebounds / gamesPlayed,
          ),
          blocksPerGame: this.round(
            gamesPlayed === 0 ? 0 : this.safe(totals._sum.blocks) / gamesPlayed,
          ),
          stealsPerGame: this.round(
            gamesPlayed === 0 ? 0 : this.safe(totals._sum.steals) / gamesPlayed,
          ),
          turnoversPerGame: this.round(
            gamesPlayed === 0
              ? 0
              : this.safe(totals._sum.turnovers) / gamesPlayed,
          ),
        },
      });
    }

    return weeklyStats;
  }

  async getTeamStats(input: TeamStatlineInput, userId: string) {
    const team = await this.resolveTeam(input.teamRef);
    await this.assertActiveMembership(team.id, userId);

    const startOfTomorrow = this.getStartOfTomorrow();
    const totals = await this.prisma.statline.aggregate({
      where: {
        Game: {
          is: {
            activity: {
              teamId: team.id,
              type: ActivityType.GAME,
              date: { lt: startOfTomorrow },
            },
          },
        },
      },
      _sum: {
        fieldGoalsMade: true,
        fieldGoalsMissed: true,
        threePointersMade: true,
        threePointersMissed: true,
        freeThrows: true,
        freeThrowsMissed: true,
        assists: true,
        offensiveRebounds: true,
        defensiveRebounds: true,
        steals: true,
        blocks: true,
        turnovers: true,
      },
    });

    const distinctGames = await this.prisma.statline.findMany({
      where: {
        Game: {
          is: {
            activity: {
              teamId: team.id,
              type: ActivityType.GAME,
              date: { lt: startOfTomorrow },
            },
          },
        },
      },
      select: { gameId: true },
      distinct: ['gameId'],
    });

    const gamesPlayed = distinctGames.length;
    const opponentTotals = await this.prisma.opponentStatline.aggregate({
      where: {
        game: {
          is: {
            activity: {
              teamId: team.id,
              type: ActivityType.GAME,
              date: { lt: startOfTomorrow },
            },
          },
        },
      },
      _sum: {
        fieldGoalsMade: true,
        threePointersMade: true,
        freeThrowsMade: true,
      },
    });

    if (gamesPlayed === 0) {
      return this.buildEmptyTeamStats();
    }

    const totalFG = this.safe(totals._sum.fieldGoalsMade);
    const totalMissedFG = this.safe(totals._sum.fieldGoalsMissed);
    const total3P = this.safe(totals._sum.threePointersMade);
    const totalMissed3P = this.safe(totals._sum.threePointersMissed);
    const totalFT = this.safe(totals._sum.freeThrows);
    const totalMissedFT = this.safe(totals._sum.freeThrowsMissed);
    const totalAssists = this.safe(totals._sum.assists);
    const totalOffensiveRebounds = this.safe(totals._sum.offensiveRebounds);
    const totalDefensiveRebounds = this.safe(totals._sum.defensiveRebounds);
    const totalSteals = this.safe(totals._sum.steals);
    const totalBlocks = this.safe(totals._sum.blocks);
    const totalTurnovers = this.safe(totals._sum.turnovers);

    const totalPoints = this.calculateTotalPoints({
      fieldGoalsMade: totalFG,
      threePointersMade: total3P,
      freeThrows: totalFT,
    });
    const totalRebounds = totalOffensiveRebounds + totalDefensiveRebounds;
    const totalOpponentPoints = this.calculateTotalOpponentPoints(
      opponentTotals._sum.fieldGoalsMade,
      opponentTotals._sum.threePointersMade,
      opponentTotals._sum.freeThrowsMade,
    );
    const fieldGoalAttempts = totalFG + totalMissedFG;
    const freeThrowAttempts = totalFT + totalMissedFT;

    return {
      totalGames: gamesPlayed,
      totalFieldGoalsMade: this.round(totalFG),
      totalFieldGoalsMissed: this.round(totalMissedFG),
      totalThreePointersMade: this.round(total3P),
      totalThreePointersMissed: this.round(totalMissed3P),
      totalFreeThrows: this.round(totalFT),
      totalFreeThrowsMissed: this.round(totalMissedFT),
      totalAssists: this.round(totalAssists),
      totalRebounds: this.round(totalRebounds),
      totalSteals: this.round(totalSteals),
      totalBlocks: this.round(totalBlocks),
      totalTurnovers: this.round(totalTurnovers),
      totalPoints: this.round(totalPoints),
      totalOpponentPoints: this.round(totalOpponentPoints),
      averages: {
        pointsPerGame: this.round(totalPoints / gamesPlayed),
        fieldGoalPercentage: this.round(
          this.calculatePercentage(totalFG, totalMissedFG),
        ),
        threePointPercentage: this.round(
          this.calculatePercentage(total3P, totalMissed3P),
        ),
        freeThrowPercentage: this.round(
          this.calculatePercentage(totalFT, totalMissedFT),
        ),
        assists: this.round(totalAssists / gamesPlayed),
        rebounds: this.round(totalRebounds / gamesPlayed),
        steals: this.round(totalSteals / gamesPlayed),
        blocks: this.round(totalBlocks / gamesPlayed),
        turnovers: this.round(totalTurnovers / gamesPlayed),
      },
      advanced: {
        offensiveRating: this.round(
          this.calculateOffensiveRating({
            points: totalPoints,
            fieldGoalAttempts,
            freeThrowAttempts,
            turnovers: totalTurnovers,
            offensiveRebounds: totalOffensiveRebounds,
          }),
        ),
        trueShootingPercentage: this.round(
          this.calculateTrueShootingPercentage({
            points: totalPoints,
            fieldGoalsAttempted: fieldGoalAttempts,
            freeThrowsAttempted: freeThrowAttempts,
          }),
        ),
        assistToTurnoverRatio: this.round(
          this.calculateAssistToTurnoverRatio({
            assists: totalAssists,
            turnovers: totalTurnovers,
          }),
        ),
        netRating: this.round(
          this.calculateNetRating({
            pointsScored: totalPoints,
            pointsAllowed: totalOpponentPoints,
            fieldGoalAttempts,
            offensiveRebounds: totalOffensiveRebounds,
            turnovers: totalTurnovers,
            freeThrowAttempts,
          }),
        ),
        effectiveFieldGoalPercentage: this.round(
          this.calculateEffectiveFieldGoalPercentage({
            fieldGoalsMade: totalFG,
            threePointersMade: total3P,
            fieldGoalsAttempted: fieldGoalAttempts,
          }),
        ),
      },
    };
  }

  async getStatsPerGame(input: StatsPerGameInput, userId: string) {
    const team = await this.resolveTeam(input.teamRef);
    await this.assertActiveMembership(team.id, userId);

    const targetMember = await this.prisma.member.findFirst({
      where: {
        id: input.memberId,
        teamId: team.id,
      },
      select: { id: true },
    });

    if (!targetMember) {
      throw new NotFoundException('Member not found in this team');
    }

    const startDate = new Date(input.year, input.month - 1, 1);
    const endDate = new Date(input.year, input.month, 0, 23, 59, 59, 999);
    const currentDate = new Date();

    const statlines = await this.prisma.statline.findMany({
      where: {
        memberId: input.memberId,
        Game: {
          is: {
            activity: {
              teamId: team.id,
              type: ActivityType.GAME,
              date: {
                gte: startDate,
                lte: endDate,
                lt: currentDate,
              },
              attendees: {
                some: {
                  memberId: input.memberId,
                  attendanceStatus: AttendanceStatus.ATTENDING,
                },
              },
            },
          },
        },
      },
      select: {
        fieldGoalsMade: true,
        threePointersMade: true,
        freeThrows: true,
        assists: true,
        offensiveRebounds: true,
        defensiveRebounds: true,
        steals: true,
        Game: {
          select: {
            activity: {
              select: {
                title: true,
                date: true,
              },
            },
          },
        },
      },
      orderBy: {
        Game: {
          activity: {
            date: 'asc',
          },
        },
      },
    });

    return statlines.map((entry) => {
      const points = this.calculateTotalPoints({
        fieldGoalsMade: this.safe(entry.fieldGoalsMade),
        threePointersMade: this.safe(entry.threePointersMade),
        freeThrows: this.safe(entry.freeThrows),
      });

      return {
        gameTitle: entry.Game.activity.title ?? 'Untitled Game',
        date: entry.Game.activity.date ?? undefined,
        points: this.round(points),
        assists: this.safe(entry.assists),
        rebounds:
          this.safe(entry.offensiveRebounds) +
          this.safe(entry.defensiveRebounds),
        steals: this.safe(entry.steals),
      };
    });
  }

  async getGamesWithBoxScores(input: TeamStatlineInput, userId: string) {
    const team = await this.resolveTeam(input.teamRef);
    await this.assertActiveMembership(team.id, userId);

    const opponentStatlines = await this.prisma.opponentStatline.findMany({
      where: {
        game: {
          is: {
            activity: {
              type: ActivityType.GAME,
              teamId: team.id,
            },
          },
        },
      },
      select: {
        gameId: true,
        name: true,
        fieldGoalsMade: true,
        threePointersMade: true,
        freeThrowsMade: true,
        game: {
          select: {
            activity: {
              select: {
                date: true,
                title: true,
              },
            },
          },
        },
      },
    });

    const statlines = await this.prisma.statline.findMany({
      where: {
        Game: {
          is: {
            activity: {
              type: ActivityType.GAME,
              teamId: team.id,
            },
          },
        },
      },
      select: {
        memberId: true,
        fieldGoalsMade: true,
        threePointersMade: true,
        freeThrows: true,
        assists: true,
        offensiveRebounds: true,
        defensiveRebounds: true,
        steals: true,
        blocks: true,
        turnovers: true,
        gameId: true,
        Game: {
          select: {
            activity: {
              select: {
                date: true,
                title: true,
              },
            },
          },
        },
        Member: {
          select: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    type GameMapValue = {
      activityId: string;
      title: string;
      date: Date;
      playerStats: {
        memberId: string;
        name?: string;
        fieldGoalsMade: number;
        threePointersMade: number;
        freeThrows: number;
        assists: number;
        offensiveRebounds: number;
        defensiveRebounds: number;
        steals: number;
        blocks: number;
        turnovers: number;
        points: number;
      }[];
      teamTotals: {
        fieldGoalsMade: number;
        threePointersMade: number;
        freeThrows: number;
        assists: number;
        offensiveRebounds: number;
        defensiveRebounds: number;
        steals: number;
        blocks: number;
        turnovers: number;
        points: number;
      };
      opponentName: string;
      opponentStats: {
        fieldGoalsMade: number;
        threePointersMade: number;
        freeThrowsMade: number;
        points: number;
      };
    };

    const gamesMap = new Map<string, GameMapValue>();

    for (const opponent of opponentStatlines) {
      gamesMap.set(opponent.gameId, {
        activityId: opponent.gameId,
        title: opponent.game.activity.title,
        date: opponent.game.activity.date,
        playerStats: [],
        teamTotals: {
          fieldGoalsMade: 0,
          threePointersMade: 0,
          freeThrows: 0,
          assists: 0,
          offensiveRebounds: 0,
          defensiveRebounds: 0,
          steals: 0,
          blocks: 0,
          turnovers: 0,
          points: 0,
        },
        opponentName: opponent.name ?? 'Opponent',
        opponentStats: {
          fieldGoalsMade: this.safe(opponent.fieldGoalsMade),
          threePointersMade: this.safe(opponent.threePointersMade),
          freeThrowsMade: this.safe(opponent.freeThrowsMade),
          points: this.calculateTotalOpponentPoints(
            opponent.fieldGoalsMade,
            opponent.threePointersMade,
            opponent.freeThrowsMade,
          ),
        },
      });
    }

    for (const statline of statlines) {
      const points = this.calculateTotalPoints({
        fieldGoalsMade: this.safe(statline.fieldGoalsMade),
        threePointersMade: this.safe(statline.threePointersMade),
        freeThrows: this.safe(statline.freeThrows),
      });

      const playerStat = {
        memberId: statline.memberId,
        name: statline.Member.user.name ?? undefined,
        fieldGoalsMade: this.safe(statline.fieldGoalsMade),
        threePointersMade: this.safe(statline.threePointersMade),
        freeThrows: this.safe(statline.freeThrows),
        assists: this.safe(statline.assists),
        offensiveRebounds: this.safe(statline.offensiveRebounds),
        defensiveRebounds: this.safe(statline.defensiveRebounds),
        steals: this.safe(statline.steals),
        blocks: this.safe(statline.blocks),
        turnovers: this.safe(statline.turnovers),
        points: this.round(points),
      };

      const existing = gamesMap.get(statline.gameId);

      if (!existing) {
        gamesMap.set(statline.gameId, {
          activityId: statline.gameId,
          title: statline.Game.activity.title,
          date: statline.Game.activity.date,
          playerStats: [playerStat],
          teamTotals: {
            fieldGoalsMade: playerStat.fieldGoalsMade,
            threePointersMade: playerStat.threePointersMade,
            freeThrows: playerStat.freeThrows,
            assists: playerStat.assists,
            offensiveRebounds: playerStat.offensiveRebounds,
            defensiveRebounds: playerStat.defensiveRebounds,
            steals: playerStat.steals,
            blocks: playerStat.blocks,
            turnovers: playerStat.turnovers,
            points: playerStat.points,
          },
          opponentName: 'Opponent',
          opponentStats: {
            fieldGoalsMade: 0,
            threePointersMade: 0,
            freeThrowsMade: 0,
            points: 0,
          },
        });
        continue;
      }

      existing.playerStats.push(playerStat);
      existing.teamTotals.fieldGoalsMade += playerStat.fieldGoalsMade;
      existing.teamTotals.threePointersMade += playerStat.threePointersMade;
      existing.teamTotals.freeThrows += playerStat.freeThrows;
      existing.teamTotals.assists += playerStat.assists;
      existing.teamTotals.offensiveRebounds += playerStat.offensiveRebounds;
      existing.teamTotals.defensiveRebounds += playerStat.defensiveRebounds;
      existing.teamTotals.steals += playerStat.steals;
      existing.teamTotals.blocks += playerStat.blocks;
      existing.teamTotals.turnovers += playerStat.turnovers;
      existing.teamTotals.points += playerStat.points;
    }

    return Array.from(gamesMap.values()).sort(
      (a, b) => b.date.getTime() - a.date.getTime(),
    );
  }

  async submitStatlines(input: SubmitStatlinesInput, userId: string) {
    this.logger.log(
      `submitStatlines received: teamRef=${input.teamRef}, userId=${userId}, players=${input.players.length}, opponentStatline=${Boolean(input.opponentStatline)}`,
    );

    const team = await this.resolveTeam(input.teamRef);
    await this.assertActiveMembership(team.id, userId, Role.COACH);

    const requestedActivityIds = [
      ...new Set([
        ...input.players.map((player) => player.activityId),
        ...(input.opponentStatline ? [input.opponentStatline.activityId] : []),
      ]),
    ];

    const activities = await this.prisma.activity.findMany({
      where: {
        id: { in: requestedActivityIds },
        teamId: team.id,
        type: ActivityType.GAME,
      },
      select: { id: true },
    });

    if (activities.length !== requestedActivityIds.length) {
      throw new NotFoundException(
        'One or more game activities were not found for this team',
      );
    }

    const requestedMemberIds = [
      ...new Set(input.players.map((player) => player.memberId)),
    ];
    const members = await this.prisma.member.findMany({
      where: {
        id: { in: requestedMemberIds },
        teamId: team.id,
      },
      select: { id: true },
    });

    if (members.length !== requestedMemberIds.length) {
      throw new NotFoundException('One or more team members were not found');
    }

    const upsertMap = new Map<
      string,
      {
        gameId: string;
        memberId: string;
        fieldGoalsMade: number;
        fieldGoalsMissed: number;
        threePointersMade: number;
        threePointersMissed: number;
        freeThrows: number;
        freeThrowsMissed: number;
        assists: number;
        steals: number;
        turnovers: number;
        offensiveRebounds: number;
        defensiveRebounds: number;
        blocks: number;
      }
    >();

    for (const player of input.players) {
      for (const statline of player.statlines) {
        upsertMap.set(`${player.memberId}:${player.activityId}`, {
          gameId: player.activityId,
          memberId: player.memberId,
          fieldGoalsMade: statline.fieldGoalsMade ?? 0,
          fieldGoalsMissed: statline.fieldGoalsMissed ?? 0,
          threePointersMade: statline.threePointersMade ?? 0,
          threePointersMissed: statline.threePointersMissed ?? 0,
          freeThrows: statline.freeThrows ?? 0,
          freeThrowsMissed: statline.freeThrowsMissed ?? 0,
          assists: statline.assists ?? 0,
          steals: statline.steals ?? 0,
          turnovers: statline.turnovers ?? 0,
          offensiveRebounds: statline.offensiveRebounds ?? 0,
          defensiveRebounds: statline.defensiveRebounds ?? 0,
          blocks: statline.blocks ?? 0,
        });
      }
    }

    const upsertPayloads = [...upsertMap.values()];
    let savedOpponentStatline:
      | {
          gameId: string;
          name: string;
          fieldGoalsMade: number;
          threePointersMade: number;
          freeThrowsMade: number;
        }
      | undefined;

    await this.prisma.$transaction(async (tx) => {
      if (input.opponentStatline) {
        const saved = await tx.opponentStatline.upsert({
          where: { gameId: input.opponentStatline.activityId },
          update: {
            name: input.opponentStatline.name,
            fieldGoalsMade: input.opponentStatline.fieldGoalsMade,
            threePointersMade: input.opponentStatline.threePointersMade,
            freeThrowsMade: input.opponentStatline.freeThrowsMade,
          },
          create: {
            gameId: input.opponentStatline.activityId,
            name: input.opponentStatline.name,
            fieldGoalsMade: input.opponentStatline.fieldGoalsMade,
            threePointersMade: input.opponentStatline.threePointersMade,
            freeThrowsMade: input.opponentStatline.freeThrowsMade,
          },
        });

        savedOpponentStatline = {
          gameId: saved.gameId,
          name: saved.name,
          fieldGoalsMade: saved.fieldGoalsMade,
          threePointersMade: saved.threePointersMade,
          freeThrowsMade: saved.freeThrowsMade,
        };
      }

      await Promise.all(
        upsertPayloads.map((payload) =>
          tx.statline.upsert({
            where: {
              memberId_gameId: {
                memberId: payload.memberId,
                gameId: payload.gameId,
              },
            },
            update: {
              fieldGoalsMade: payload.fieldGoalsMade,
              fieldGoalsMissed: payload.fieldGoalsMissed,
              threePointersMade: payload.threePointersMade,
              threePointersMissed: payload.threePointersMissed,
              freeThrows: payload.freeThrows,
              freeThrowsMissed: payload.freeThrowsMissed,
              assists: payload.assists,
              steals: payload.steals,
              turnovers: payload.turnovers,
              offensiveRebounds: payload.offensiveRebounds,
              defensiveRebounds: payload.defensiveRebounds,
              blocks: payload.blocks,
            },
            create: payload,
          }),
        ),
      );
    });

    this.logger.log(
      `submitStatlines saved: teamId=${team.id}, userId=${userId}, upserts=${upsertPayloads.length}, opponentStatlineSaved=${Boolean(savedOpponentStatline)}`,
    );

    return {
      success: true,
      count: upsertPayloads.length,
      opponentStatline: savedOpponentStatline,
    };
  }

  private getStartOfTomorrow() {
    const startOfTomorrow = new Date();
    startOfTomorrow.setHours(24, 0, 0, 0);
    return startOfTomorrow;
  }

  private safe(value: number | null | undefined): number {
    return value ?? 0;
  }

  private round(value: number, decimals = 1) {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
  }

  private calculatePercentage(made: number, missed: number) {
    const attempted = made + missed;
    return attempted > 0 ? (made / attempted) * 100 : 0;
  }

  private calculateTotalPoints(params: {
    fieldGoalsMade: number;
    threePointersMade: number;
    freeThrows: number;
  }) {
    const twoPointersMade = params.fieldGoalsMade - params.threePointersMade;
    return (
      twoPointersMade * 2 + params.threePointersMade * 3 + params.freeThrows
    );
  }

  private calculateTotalOpponentPoints(
    fieldGoalsMade: number | null,
    threePointersMade: number | null,
    freeThrowsMade: number | null,
  ) {
    const twos = (fieldGoalsMade ?? 0) - (threePointersMade ?? 0);
    const threes = threePointersMade ?? 0;
    const freeThrows = freeThrowsMade ?? 0;

    return twos * 2 + threes * 3 + freeThrows;
  }

  private calculateTrueShootingPercentage(params: {
    points: number;
    fieldGoalsAttempted: number;
    freeThrowsAttempted: number;
  }) {
    const totalAttempts =
      params.fieldGoalsAttempted + 0.44 * params.freeThrowsAttempted;
    return totalAttempts > 0 ? (params.points / (2 * totalAttempts)) * 100 : 0;
  }

  private calculateAssistToTurnoverRatio(params: {
    assists: number;
    turnovers: number;
  }) {
    return params.turnovers > 0 ? params.assists / params.turnovers : 0;
  }

  private calculateOffensiveRating(params: {
    points: number;
    fieldGoalAttempts: number;
    freeThrowAttempts: number;
    turnovers: number;
    offensiveRebounds: number;
  }) {
    const possessions =
      params.fieldGoalAttempts -
      params.offensiveRebounds +
      params.turnovers +
      0.4 * params.freeThrowAttempts;

    return possessions > 0 ? (params.points / possessions) * 100 : 0;
  }

  private calculateNetRating(params: {
    pointsScored: number;
    pointsAllowed: number;
    fieldGoalAttempts: number;
    offensiveRebounds: number;
    turnovers: number;
    freeThrowAttempts: number;
  }) {
    const possessions =
      params.fieldGoalAttempts -
      params.offensiveRebounds +
      params.turnovers +
      0.44 * params.freeThrowAttempts;

    if (possessions === 0) return 0;

    return ((params.pointsScored - params.pointsAllowed) / possessions) * 100;
  }

  private calculateEffectiveFieldGoalPercentage(params: {
    fieldGoalsMade: number;
    threePointersMade: number;
    fieldGoalsAttempted: number;
  }) {
    if (params.fieldGoalsAttempted === 0) {
      return 0;
    }

    return (
      ((params.fieldGoalsMade + 0.5 * params.threePointersMade) /
        params.fieldGoalsAttempted) *
      100
    );
  }

  private buildEmptyTeamStats() {
    return {
      totalGames: 0,
      totalFieldGoalsMade: 0,
      totalFieldGoalsMissed: 0,
      totalThreePointersMade: 0,
      totalThreePointersMissed: 0,
      totalFreeThrows: 0,
      totalFreeThrowsMissed: 0,
      totalAssists: 0,
      totalRebounds: 0,
      totalSteals: 0,
      totalBlocks: 0,
      totalTurnovers: 0,
      totalPoints: 0,
      totalOpponentPoints: 0,
      averages: {
        pointsPerGame: 0,
        fieldGoalPercentage: 0,
        threePointPercentage: 0,
        freeThrowPercentage: 0,
        assists: 0,
        rebounds: 0,
        steals: 0,
        blocks: 0,
        turnovers: 0,
      },
      advanced: {
        offensiveRating: 0,
        trueShootingPercentage: 0,
        assistToTurnoverRatio: 0,
        netRating: 0,
        effectiveFieldGoalPercentage: 0,
      },
    };
  }

  private async resolveTeam(teamRef: string) {
    const normalizedRef = teamRef.trim();

    if (!normalizedRef) {
      throw new NotFoundException('Team not found');
    }

    const team = await this.prisma.team.findFirst({
      where: {
        OR: [
          { id: normalizedRef },
          { shortId: normalizedRef },
          { routeKey: normalizedRef },
          { code: normalizedRef },
          { slug: normalizedRef },
        ],
      },
      select: { id: true },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    return team;
  }

  private async assertActiveMembership(
    teamId: string,
    userId: string,
    requiredRole?: Role,
  ) {
    const membership = await this.prisma.member.findFirst({
      where: {
        teamId,
        userId,
        status: Status.ACTIVE,
      },
      select: {
        role: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException('Not allowed for this team');
    }

    if (requiredRole && membership.role !== requiredRole) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }
}
