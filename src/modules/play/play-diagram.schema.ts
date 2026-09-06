import { z } from 'zod';
import { CourtType, PlayActionType, PlayObjectKind } from './play.enums';

const point = z.object({ x: z.number(), y: z.number() });

const placedObject = z.object({
  id: z.string().min(1).max(8),
  kind: z.enum(PlayObjectKind),
  label: z.string().min(1).max(4),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  facing: z.number().optional(),
});

const action = z
  .object({
    id: z.string().min(1).max(12),
    type: z.enum(PlayActionType),
    fromId: z.string(),
    toId: z.string().optional(),
    toPoint: point.optional(),
    bend: point.optional(),
  })
  .refine((a) => (a.toId != null) !== (a.toPoint != null), {
    message: 'action needs exactly one of toId / toPoint',
  });

const phase = z.object({
  id: z.string().min(1).max(12),
  note: z.string().trim().max(2000).optional(),
  ballHolderId: z.string().optional(),
  objects: placedObject.array().max(12),
  actions: action.array().max(30),
});

const step = z.object({
  id: z.string().min(1).max(12),
  actionIds: z.string().array().min(1),
  durationMs: z.number().int().min(100).max(10_000),
});

export const playDiagramSchema = z
  .object({
    version: z.literal(1),
    court: z.enum(CourtType),
    phases: phase.array().min(1).max(15),
    timeline: step.array().max(60),
  })
  .superRefine((diagram, ctx) => {
    const knownActionIds = new Set(
      diagram.phases.flatMap((p) => p.actions.map((a) => a.id)),
    );

    diagram.phases.forEach((p, index) => {
      const objectIds = new Set(p.objects.map((o) => o.id));
      for (const a of p.actions) {
        if (!objectIds.has(a.fromId)) {
          ctx.addIssue({
            code: 'custom',
            message: `action ${a.id}: fromId not on court in phase ${index + 1}`,
          });
        }
        if (a.toId != null && !objectIds.has(a.toId)) {
          ctx.addIssue({
            code: 'custom',
            message: `action ${a.id}: toId not on court in phase ${index + 1}`,
          });
        }
      }
    });

    for (const s of diagram.timeline) {
      for (const id of s.actionIds) {
        if (!knownActionIds.has(id)) {
          ctx.addIssue({
            code: 'custom',
            message: `step ${s.id}: unknown actionId ${id}`,
          });
        }
      }
    }
  });

export type PlayDiagram = z.infer<typeof playDiagramSchema>;
export type PlacedObject = z.infer<typeof placedObject>;

export const MAX_DIAGRAM_BYTES = 128 * 1024;
