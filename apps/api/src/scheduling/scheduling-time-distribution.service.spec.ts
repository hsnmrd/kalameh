import { SchedulingTimeDistributionService } from './scheduling-time-distribution.service';

describe('MVP-020 SchedulingTimeDistributionService', () => {
  const requirementId = '00000000-0000-4000-8000-000000000001';
  let service: SchedulingTimeDistributionService;

  beforeEach(() => {
    service = new SchedulingTimeDistributionService();
  });

  it('does not penalize one class selected by best coverage', () => {
    const score = service.score({
      requirementId,
      requiredClassCount: 1,
      selectedTimeGroups: ['NEUTRAL_EVENING'],
    });

    expect(score.criterion.normalizedScore).toBe(1);
    expect(score.criterion.weightedPoints).toBe(25);
    expect(score.warnings.map((warning) => warning.code)).toEqual([
      'NEUTRAL_TIME_GROUP_USED',
    ]);
  });

  it('awards full score to two diagonal day/time groups', () => {
    const score = service.score({
      requirementId,
      requiredClassCount: 2,
      selectedTimeGroups: ['ODD_MORNING', 'EVEN_EVENING'],
    });

    expect(score).toMatchObject({
      dayAxisScore: 1,
      timeAxisScore: 1,
      groupDiversityScore: 1,
      distinctPrimaryGroupCount: 2,
    });
    expect(score.criterion.normalizedScore).toBe(1);
  });

  it('partially scores two classes that only diversify the time axis', () => {
    const score = service.score({
      requirementId,
      requiredClassCount: 2,
      selectedTimeGroups: ['ODD_MORNING', 'ODD_EVENING'],
    });

    expect(score.dayAxisScore).toBe(0.5);
    expect(score.timeAxisScore).toBe(1);
    expect(score.criterion.normalizedScore).toBe(0.7);
    expect(score.warnings.map((warning) => warning.code)).toContain(
      'TIME_PATTERN_NOT_DIVERSE',
    );
  });

  it('awards full score to three distinct primary groups', () => {
    const score = service.score({
      requirementId,
      requiredClassCount: 3,
      selectedTimeGroups: ['ODD_MORNING', 'ODD_EVENING', 'EVEN_MORNING'],
    });

    expect(score.distinctPrimaryGroupCount).toBe(3);
    expect(score.criterion.normalizedScore).toBe(1);
  });

  it('requires all four primary cells for full four-class diversity', () => {
    const complete = service.score({
      requirementId,
      requiredClassCount: 4,
      selectedTimeGroups: [
        'ODD_MORNING',
        'ODD_EVENING',
        'EVEN_MORNING',
        'EVEN_EVENING',
      ],
    });
    const diagonalOnly = service.score({
      requirementId,
      requiredClassCount: 4,
      selectedTimeGroups: [
        'ODD_MORNING',
        'ODD_MORNING',
        'EVEN_EVENING',
        'EVEN_EVENING',
      ],
    });

    expect(complete.criterion.normalizedScore).toBe(1);
    expect(diagonalOnly.criterion.normalizedScore).toBe(0.5);
  });

  it('rewards balanced distribution when more than four classes are needed', () => {
    const balanced = service.score({
      requirementId,
      requiredClassCount: 6,
      selectedTimeGroups: [
        'ODD_MORNING',
        'ODD_MORNING',
        'ODD_EVENING',
        'ODD_EVENING',
        'EVEN_MORNING',
        'EVEN_EVENING',
      ],
    });
    const imbalanced = service.score({
      requirementId,
      requiredClassCount: 6,
      selectedTimeGroups: [
        'ODD_MORNING',
        'ODD_MORNING',
        'ODD_MORNING',
        'ODD_EVENING',
        'EVEN_MORNING',
        'EVEN_EVENING',
      ],
    });

    expect(balanced.balanceScore).toBe(1);
    expect(balanced.criterion.normalizedScore).toBe(1);
    expect(imbalanced.balanceScore).toBeLessThan(1);
    expect(imbalanced.warnings.map((warning) => warning.code)).toContain(
      'TIME_GROUP_IMBALANCED',
    );
  });

  it('reports missing scheduled classes and applies institute weight', () => {
    const score = service.score({
      requirementId,
      requiredClassCount: 2,
      selectedTimeGroups: ['ODD_MORNING'],
      weight: 40,
    });

    expect(score.criterion.weight).toBe(40);
    expect(score.criterion.weightedPoints).toBe(10);
    expect(score.warnings.map((warning) => warning.code)).toContain(
      'MISSING_SCHEDULED_CLASSES',
    );
  });

  it('rejects impossible counts and invalid weights', () => {
    expect(() =>
      service.score({
        requirementId,
        requiredClassCount: 1,
        selectedTimeGroups: ['ODD_MORNING', 'EVEN_EVENING'],
      }),
    ).toThrow(RangeError);
    expect(() =>
      service.score({
        requirementId,
        requiredClassCount: 1,
        selectedTimeGroups: ['ODD_MORNING'],
        weight: 25.5,
      }),
    ).toThrow(RangeError);
  });
});
