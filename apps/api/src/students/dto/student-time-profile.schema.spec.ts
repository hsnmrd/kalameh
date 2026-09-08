import {
  ReplaceStudentTimeProfileSchema,
  StudentProfileSchema,
  createReplaceStudentTimeProfileSchema,
} from '@workspace/types';

describe('Student time profile schemas', () => {
  const unavailable = {
    kind: 'UNAVAILABLE' as const,
    source: 'SCHOOL' as const,
    dayOfWeek: 'SATURDAY' as const,
    startTime: '08:00',
    endTime: '14:00',
    effectiveFrom: '2026-09-01',
    effectiveUntil: '2027-06-30',
  };

  it('keeps legacy student profiles compatible with safe defaults', () => {
    const result = StudentProfileSchema.parse({});

    expect(result.scheduleStatus).toBe('INCOMPLETE');
    expect(result.timeConstraints).toEqual([]);
  });

  it('accepts a complete profile without constraints as fully known availability', () => {
    const result = ReplaceStudentTimeProfileSchema.safeParse({
      scheduleStatus: 'COMPLETE',
      constraints: [],
    });

    expect(result.success).toBe(true);
  });

  it('parses constraints from multipart JSON and defaults the source', () => {
    const result = ReplaceStudentTimeProfileSchema.parse({
      scheduleStatus: 'INCOMPLETE',
      constraints: JSON.stringify([
        {
          kind: 'PREFERRED',
          dayOfWeek: 'SUNDAY',
          startTime: '16:00',
          endTime: '18:00',
        },
      ]),
    });

    expect(result.constraints).toHaveLength(1);
    expect(result.constraints[0]?.source).toBe('OTHER');
  });

  it('treats an empty multipart value as an explicit clear operation', () => {
    const result = ReplaceStudentTimeProfileSchema.parse({
      scheduleStatus: 'COMPLETE',
      constraints: '',
    });

    expect(result.constraints).toEqual([]);
  });

  it('supports a localized invalid multipart payload message', () => {
    const schema = createReplaceStudentTimeProfileSchema({
      invalidConstraintsPayload: 'invalid-constraints-payload',
    });
    const result = schema.safeParse({
      scheduleStatus: 'COMPLETE',
      constraints: '{invalid-json}',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        'invalid-constraints-payload',
      );
    }
  });

  it('rejects invalid time formats and zero-length ranges', () => {
    expect(
      ReplaceStudentTimeProfileSchema.safeParse({
        scheduleStatus: 'COMPLETE',
        constraints: [{ ...unavailable, startTime: '8:00' }],
      }).success,
    ).toBe(false);

    expect(
      ReplaceStudentTimeProfileSchema.safeParse({
        scheduleStatus: 'COMPLETE',
        constraints: [{ ...unavailable, startTime: '14:00', endTime: '14:00' }],
      }).success,
    ).toBe(false);
  });

  it('rejects invalid calendar dates and reversed effective ranges', () => {
    expect(
      ReplaceStudentTimeProfileSchema.safeParse({
        scheduleStatus: 'COMPLETE',
        constraints: [{ ...unavailable, effectiveFrom: '2026-02-31' }],
      }).success,
    ).toBe(false);

    expect(
      ReplaceStudentTimeProfileSchema.safeParse({
        scheduleStatus: 'COMPLETE',
        constraints: [
          {
            ...unavailable,
            effectiveFrom: '2027-01-01',
            effectiveUntil: '2026-01-01',
          },
        ],
      }).success,
    ).toBe(false);
  });

  it('allows adjacent windows and constraints active in separate periods', () => {
    const result = ReplaceStudentTimeProfileSchema.safeParse({
      scheduleStatus: 'COMPLETE',
      constraints: [
        unavailable,
        {
          ...unavailable,
          startTime: '14:00',
          endTime: '16:00',
        },
        {
          ...unavailable,
          startTime: '10:00',
          endTime: '12:00',
          effectiveFrom: '2027-07-01',
          effectiveUntil: '2027-08-31',
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('rejects overlapping constraints of the same kind', () => {
    const schema = createReplaceStudentTimeProfileSchema({
      overlappingConstraints: 'overlapping-constraints',
    });
    const result = schema.safeParse({
      scheduleStatus: 'COMPLETE',
      constraints: [
        unavailable,
        { ...unavailable, startTime: '12:00', endTime: '15:00' },
      ],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ message: 'overlapping-constraints' }),
        ]),
      );
    }
  });

  it('rejects a preference that overlaps hard unavailability', () => {
    const schema = createReplaceStudentTimeProfileSchema({
      preferenceOverlapsUnavailable: 'preference-is-unavailable',
    });
    const result = schema.safeParse({
      scheduleStatus: 'COMPLETE',
      constraints: [
        unavailable,
        {
          ...unavailable,
          kind: 'PREFERRED',
          startTime: '12:00',
          endTime: '13:00',
        },
      ],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('preference-is-unavailable');
    }
  });
});
