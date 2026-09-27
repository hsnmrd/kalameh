import { SchedulingTeacherCalendarService } from './scheduling-teacher-calendar.service';

describe('SchedulingTeacherCalendarService', () => {
  const service = new SchedulingTeacherCalendarService();
  const uuid = (suffix: number): string =>
    `00000000-0000-4000-8000-${String(suffix).padStart(12, '0')}`;

  it('splits recorded availability into free and occupied calendar blocks', () => {
    const teacherId = uuid(1);
    const existingClassId = uuid(2);
    const calendar = service.build({
      courseId: uuid(3),
      teachers: [{ id: teacherId, firstName: 'Sara', lastName: 'Ahmadi' }],
      qualifications: [
        {
          courseId: uuid(3),
          teacherProfile: {
            userId: teacherId,
            availabilities: [
              {
                id: uuid(4),
                dayOfWeek: 'SUNDAY',
                startTime: '09:00',
                endTime: '13:00',
              },
            ],
          },
        },
      ],
      proposals: [
        {
          id: uuid(5),
          title: 'AME 1',
          teacherId,
          daysOfWeek: ['SUNDAY'],
          startTime: '10:00',
          endTime: '11:00',
        },
      ],
      existingClasses: [
        {
          id: existingClassId,
          teacherId,
          daysOfWeek: ['MONDAY'],
          sessionDates: [],
          startTime: '15:30',
          endTime: '17:00',
        },
      ],
      existingClassTitles: new Map([[existingClassId, 'AME 3']]),
    })[0];

    expect(calendar?.teacher).toEqual({
      id: teacherId,
      firstName: 'Sara',
      lastName: 'Ahmadi',
    });
    expect(calendar?.slots).toEqual(
      expect.arrayContaining([
        {
          dayOfWeek: 'SUNDAY',
          startTime: '09:00',
          endTime: '10:00',
          status: 'FREE',
          title: null,
          source: 'AVAILABILITY',
        },
        {
          dayOfWeek: 'SUNDAY',
          startTime: '10:00',
          endTime: '11:00',
          status: 'BUSY',
          title: 'AME 1',
          source: 'PLAN',
        },
        {
          dayOfWeek: 'SUNDAY',
          startTime: '11:00',
          endTime: '13:00',
          status: 'FREE',
          title: null,
          source: 'AVAILABILITY',
        },
        {
          dayOfWeek: 'MONDAY',
          startTime: '15:30',
          endTime: '17:00',
          status: 'BUSY',
          title: 'AME 3',
          source: 'EXISTING_CLASS',
        },
      ]),
    );
  });

  it('includes a replacement teacher related through a reassignment chain', () => {
    const targetCourseId = uuid(10);
    const blockingCourseId = uuid(11);
    const targetTeacherId = uuid(12);
    const replacementTeacherId = uuid(13);
    const calendars = service.build({
      courseId: targetCourseId,
      additionalTeacherIds: [replacementTeacherId],
      teachers: [
        {
          id: targetTeacherId,
          firstName: 'Target',
          lastName: 'Teacher',
        },
        {
          id: replacementTeacherId,
          firstName: 'Replacement',
          lastName: 'Teacher',
        },
      ],
      qualifications: [
        {
          courseId: targetCourseId,
          teacherProfile: {
            userId: targetTeacherId,
            availabilities: [],
          },
        },
        {
          courseId: blockingCourseId,
          teacherProfile: {
            userId: replacementTeacherId,
            availabilities: [
              {
                id: uuid(14),
                dayOfWeek: 'SUNDAY',
                startTime: '09:00',
                endTime: '12:00',
              },
            ],
          },
        },
      ],
      proposals: [],
      existingClasses: [],
      existingClassTitles: new Map(),
    });

    expect(calendars.map(({ teacher }) => teacher.id)).toEqual(
      expect.arrayContaining([targetTeacherId, replacementTeacherId]),
    );
    expect(
      calendars.find(({ teacher }) => teacher.id === replacementTeacherId)
        ?.slots,
    ).toContainEqual(
      expect.objectContaining({
        dayOfWeek: 'SUNDAY',
        status: 'FREE',
        startTime: '09:00',
        endTime: '12:00',
      }),
    );
  });
});
