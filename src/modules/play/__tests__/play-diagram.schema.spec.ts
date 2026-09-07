import { playDiagramSchema } from '../play-diagram.schema';

function makeDiagram(overrides: Record<string, unknown> = {}) {
  return {
    version: 1,
    court: 'half',
    phases: [
      {
        id: 'p1',
        objects: [
          { id: 'o1', kind: 'offense', label: '1', x: 50, y: 80 },
          { id: 'o5', kind: 'offense', label: '5', x: 70, y: 20 },
        ],
        actions: [{ id: 'a1', type: 'pass', fromId: 'o1', toId: 'o5' }],
      },
    ],
    timeline: [{ id: 's1', actionIds: ['a1'], durationMs: 800 }],
    ...overrides,
  };
}

describe('playDiagramSchema', () => {
  it('accepts a well-formed diagram', () => {
    // Arrange
    const diagram = makeDiagram();

    // Act
    const result = playDiagramSchema.safeParse(diagram);

    // Assert
    expect(result.success).toBe(true);
  });

  it('rejects an unknown action type', () => {
    // Arrange
    const diagram = makeDiagram({
      phases: [
        {
          id: 'p1',
          objects: [{ id: 'o1', kind: 'offense', label: '1', x: 50, y: 80 }],
          actions: [{ id: 'a1', type: 'teleport', fromId: 'o1', toId: 'o1' }],
        },
      ],
    });

    // Act
    const result = playDiagramSchema.safeParse(diagram);

    // Assert
    expect(result.success).toBe(false);
  });

  it('rejects an action that has both a target player and a target point', () => {
    // Arrange
    const diagram = makeDiagram({
      phases: [
        {
          id: 'p1',
          objects: [{ id: 'o1', kind: 'offense', label: '1', x: 50, y: 80 }],
          actions: [
            {
              id: 'a1',
              type: 'pass',
              fromId: 'o1',
              toId: 'o1',
              toPoint: { x: 10, y: 10 },
            },
          ],
        },
      ],
    });

    // Act
    const result = playDiagramSchema.safeParse(diagram);

    // Assert
    expect(result.success).toBe(false);
  });

  it('rejects an action whose fromId is not on court in that phase', () => {
    // Arrange
    const diagram = makeDiagram({
      phases: [
        {
          id: 'p1',
          objects: [{ id: 'o1', kind: 'offense', label: '1', x: 50, y: 80 }],
          actions: [
            { id: 'a1', type: 'cut', fromId: 'ghost', toPoint: { x: 1, y: 1 } },
          ],
        },
      ],
    });

    // Act
    const result = playDiagramSchema.safeParse(diagram);

    // Assert
    expect(result.success).toBe(false);
  });

  it('rejects a timeline step referencing an unknown action', () => {
    // Arrange
    const diagram = makeDiagram({
      timeline: [{ id: 's1', actionIds: ['a1', 'nope'], durationMs: 800 }],
    });

    // Act
    const result = playDiagramSchema.safeParse(diagram);

    // Assert
    expect(result.success).toBe(false);
  });

  it('rejects more than 15 phases', () => {
    // Arrange
    const phase = makeDiagram().phases[0];
    const diagram = makeDiagram({
      phases: Array.from({ length: 16 }, (_, i) => ({ ...phase, id: `p${i}` })),
    });

    // Act
    const result = playDiagramSchema.safeParse(diagram);

    // Assert
    expect(result.success).toBe(false);
  });

  it('trims a phase note', () => {
    // Arrange
    const diagram = makeDiagram({
      phases: [{ ...makeDiagram().phases[0], note: '  drive baseline  ' }],
    });

    // Act
    const result = playDiagramSchema.parse(diagram);

    // Assert
    expect(result.phases[0].note).toBe('drive baseline');
  });

  it('sanitises a phase note, keeping the editor formatting', () => {
    // Arrange
    const diagram = makeDiagram({
      phases: [
        {
          ...makeDiagram().phases[0],
          note: '<p><strong>1 passes</strong></p><script>alert(1)</script><ul><li>space out</li></ul>',
        },
      ],
    });

    // Act
    const result = playDiagramSchema.parse(diagram);

    // Assert — the script is gone, the bold + list survive
    expect(result.phases[0].note).not.toContain('script');
    expect(result.phases[0].note).toContain('<strong>1 passes</strong>');
    expect(result.phases[0].note).toContain('<li>space out</li>');
  });

  it('rejects a note over the length cap', () => {
    // Arrange
    const diagram = makeDiagram({
      phases: [{ ...makeDiagram().phases[0], note: 'x'.repeat(4001) }],
    });

    // Act / Assert
    expect(playDiagramSchema.safeParse(diagram).success).toBe(false);
  });
});
