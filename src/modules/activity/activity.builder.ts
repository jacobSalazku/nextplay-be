import { Injectable } from '@nestjs/common';
import { ActivityType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateFeedbackInput,
  CreateFilmInput,
  CreateGameInput,
  CreateMeetingInput,
  CreatePracticeInput,
} from './dto/create';
import {
  UpdateFeedbackInput,
  UpdateFilmInput,
  UpdateGameInput,
  UpdateMeetingInput,
  UpdatePracticeInput,
} from './dto/update';

export type ActivityTypes =
  | CreateGameInput
  | CreatePracticeInput
  | CreateFilmInput
  | CreateMeetingInput
  | CreateFeedbackInput;

export type UpdateActivityTypes =
  | UpdateGameInput
  | UpdatePracticeInput
  | UpdateFilmInput
  | UpdateMeetingInput
  | UpdateFeedbackInput;

function clean<T extends object>(obj: T): Partial<T> {
  const out: Partial<T> = {};

  for (const [k, v] of Object.entries(obj) as [keyof T, T[keyof T]][]) {
    if (v !== undefined) {
      out[k] = v;
    }
  }

  return out;
}

@Injectable()
export class ActivityBuilder {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: ActivityTypes, teamId: string) {
    const base = this.buildCreateBase(input, teamId);
    const extra = this.buildExtra(input);

    return await this.prisma.activity.create({
      data: {
        ...base,
        ...extra,
      },
    });
  }

  async update(activityId: string, input: UpdateActivityTypes) {
    const base = this.buildUpdateBase(input);
    const extra = this.updateExtra(input);

    return await this.prisma.activity.update({
      where: { id: activityId },
      data: {
        ...base,
        ...extra,
      },
    });
  }

  private buildExtra(input: ActivityTypes) {
    switch (input.type) {
      case ActivityType.GAME: {
        const { location } = input as CreateGameInput;
        return {
          game: {
            create: { location },
          },
        };
      }

      case ActivityType.PRACTICE: {
        const { facility, practiceType } = input as CreatePracticeInput;
        return {
          practice: {
            create: {
              facility,
              practicetype: practiceType,
            },
          },
        };
      }

      case ActivityType.FILM: {
        const { notes } = input as CreateFilmInput;
        return {
          film: {
            create: { notes },
          },
        };
      }

      case ActivityType.MEETING: {
        const { notes } = input as CreateMeetingInput;
        return {
          meeting: {
            create: { notes },
          },
        };
      }

      case ActivityType.FEEDBACK: {
        const { coach, notes } = input as CreateFeedbackInput;
        return {
          feedback: {
            create: { coach, notes },
          },
        };
      }

      default:
        throw new Error(`Unsupported activity `);
    }
  }

  private updateExtra(input: UpdateActivityTypes) {
    switch (input.type) {
      case ActivityType.GAME: {
        const { location } = input as UpdateGameInput;

        if (location === undefined) return {};

        const data = clean({ location });
        return {
          game: {
            upsert: {
              update: data,
              create: { location },
            },
          },
        };
      }

      case ActivityType.PRACTICE: {
        const { facility, practiceType } = input as UpdatePracticeInput;

        return {
          practice: {
            ...(facility !== undefined && practiceType !== undefined
              ? {
                  upsert: {
                    update: clean({
                      facility,
                      practicetype: practiceType,
                    }),
                    create: { facility, practicetype: practiceType },
                  },
                }
              : {
                  update: clean({
                    facility,
                    practicetype: practiceType,
                  }),
                }),
          },
        };
      }

      case ActivityType.FILM: {
        const { notes } = input as UpdateFilmInput;

        const data = clean({ notes });
        if (Object.keys(data).length === 0) return {};

        return {
          film: {
            upsert: {
              update: data,
              create: data as { notes: string },
            },
          },
        };
      }

      case ActivityType.MEETING: {
        const { notes } = input as UpdateMeetingInput;

        const data = clean({ notes });
        if (Object.keys(data).length === 0) return {};

        return {
          meeting: {
            upsert: {
              update: data,
              create: data as { notes: string },
            },
          },
        };
      }

      case ActivityType.FEEDBACK: {
        const { coach, notes } = input as UpdateFeedbackInput;

        const data = clean({ coach, notes });
        if (Object.keys(data).length === 0) return {};

        return {
          feedback: {
            upsert: {
              update: data,
              create: data as { coach: string; notes: string },
            },
          },
        };
      }
      default:
        throw new Error(`Unsupported activity`);
    }
  }

  private buildCreateBase(input: ActivityTypes, teamId: string) {
    return {
      title: input.title,
      time: input.time,
      date: input.date,
      duration: input.duration,
      team: { connect: { id: teamId } },
      type: input.type,
    };
  }

  private buildUpdateBase(input: UpdateActivityTypes) {
    return {
      title: input.title,
      time: input.time,
      date: input.date,
      duration: input.duration,
      type: input.type,
    };
  }
}
