import { DEFAULT_SCHEDULING_SETTINGS } from '@workspace/types';
import { SchedulingCandidateSlotService } from './scheduling-candidate-slot.service';

describe('MVP-017 SchedulingCandidateSlotService', () => {
  const ids = {
    requirement: '00000000-0000-4000-8000-000000000001',
    course: '00000000-0000-4000-8000-000000000002',
    teacher: '00000000-0000-4000-8000-000000000003',
    qualification: '00000000-0000-4000-8000-000000000004',
    availability: '00000000-0000-4000-8000-000000000005',
    secondAvailability: '00000000-0000-4000-8000-000000000006',
  };
  const baseInput = {
    requirements: [
      {
        id: ids.requirement,
        courseId: ids.course,
        branchId: null,
        sessionDurationMinutes: 90,
      },
    ],
    qualifications: [
      {
        id: ids.qualification,
        courseId: ids.course,
        teacherProfile: {
          userId: ids.teacher,
          availabilities: [
            {
              id: ids.availability,
              dayOfWeek: 'SUNDAY',
              startTime: '08:00',
              endTime: '11:00',
            },
          ],
        },
      },
    ],
    timeGroups: DEFAULT_SCHEDULING_SETTINGS.timeGroups,
    stepMinutes: 30,
  };
  let service: SchedulingCandidateSlotService;

  beforeEach(() => {
    service = new SchedulingCandidateSlotService();
  });

  it('creates fixed-step slots fully contained by teacher availability', () => {
    const slots = service.generate(baseInput);

    expect(slots.map(({ startTime, endTime }) => [startTime, endTime])).toEqual(
      [
        ['08:00', '09:30'],
        ['08:30', '10:00'],
        ['09:00', '10:30'],
        ['09:30', '11:00'],
      ],
    );
    expect(slots.every((slot) => slot.timeGroup === 'ODD_MORNING')).toBe(true);
  });

  it('does not emit a slot that exceeds availability', () => {
    const slots = service.generate({
      ...baseInput,
      qualifications: [
        {
          ...baseInput.qualifications[0],
          teacherProfile: {
            ...baseInput.qualifications[0].teacherProfile,
            availabilities: [
              {
                ...baseInput.qualifications[0].teacherProfile.availabilities[0],
                endTime: '09:29',
              },
            ],
          },
        },
      ],
    });

    expect(slots).toEqual([]);
  });

  it('only combines requirements with matching qualifications', () => {
    const slots = service.generate({
      ...baseInput,
      qualifications: [
        {
          ...baseInput.qualifications[0],
          courseId: ids.teacher,
        },
      ],
    });

    expect(slots).toEqual([]);
  });

  it('classifies the evening boundary and neutral days from settings', () => {
    const slots = service.generate({
      ...baseInput,
      requirements: [
        { ...baseInput.requirements[0], sessionDurationMinutes: 60 },
      ],
      qualifications: [
        {
          ...baseInput.qualifications[0],
          teacherProfile: {
            ...baseInput.qualifications[0].teacherProfile,
            availabilities: [
              {
                ...baseInput.qualifications[0].teacherProfile.availabilities[0],
                dayOfWeek: 'THURSDAY',
                startTime: '14:00',
                endTime: '15:00',
              },
            ],
          },
        },
      ],
    });

    expect(slots).toHaveLength(1);
    expect(slots[0]?.timeGroup).toBe('NEUTRAL_EVENING');
  });

  it('deduplicates overlapping availability windows deterministically', () => {
    const availability =
      baseInput.qualifications[0].teacherProfile.availabilities[0];
    const slots = service.generate({
      ...baseInput,
      qualifications: [
        {
          ...baseInput.qualifications[0],
          teacherProfile: {
            ...baseInput.qualifications[0].teacherProfile,
            availabilities: [
              { ...availability, id: ids.secondAvailability },
              availability,
            ],
          },
        },
      ],
    });

    expect(slots).toHaveLength(4);
    expect(
      slots.every((slot) => slot.availabilityId === ids.availability),
    ).toBe(true);
  });

  it('rejects invalid generation step and invalid day partition settings', () => {
    expect(() => service.generate({ ...baseInput, stepMinutes: 0 })).toThrow(
      RangeError,
    );
    expect(() =>
      service.generate({
        ...baseInput,
        timeGroups: {
          ...DEFAULT_SCHEDULING_SETTINGS.timeGroups,
          oddDays: ['SUNDAY'],
        },
      }),
    ).toThrow();
    expect(() =>
      service.generate({
        ...baseInput,
        requirements: [
          { ...baseInput.requirements[0], sessionDurationMinutes: 0 },
        ],
      }),
    ).toThrow(RangeError);
  });
});
