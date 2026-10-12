import type { PrismaService } from '../prisma/prisma.service';
import type { SupportedLocale } from '@workspace/types';

export async function createDefaultOperatingPhases(
  prisma: PrismaService,
  instituteId: string,
  locale: SupportedLocale = 'fa',
): Promise<void> {
  const isFa = locale === 'fa';

  await prisma.instituteOperatingPhase.createMany({
    data: [
      {
        instituteId,
        title: isFa ? 'فاز سال تحصیلی' : 'Academic Year Phase',
        months: [7, 8, 9, 10, 11, 12, 1, 2, 3],
        startTime: '08:00',
        endTime: '20:30',
        slotDurationMinutes: 90,
        daysOfWeek: [
          'SATURDAY',
          'SUNDAY',
          'MONDAY',
          'TUESDAY',
          'WEDNESDAY',
          'THURSDAY',
        ],
        hasBreak: false,
        isSchoolCalendarAware: true,
        isActive: true,
        order: 0,
      },
      {
        instituteId,
        title: isFa ? 'فاز تابستان' : 'Summer Phase',
        months: [4, 5, 6],
        startTime: '08:00',
        endTime: '20:30',
        slotDurationMinutes: 90,
        daysOfWeek: [
          'SATURDAY',
          'SUNDAY',
          'MONDAY',
          'TUESDAY',
          'WEDNESDAY',
          'THURSDAY',
        ],
        hasBreak: false,
        isSchoolCalendarAware: false,
        isActive: true,
        order: 1,
      },
    ],
  });
}
