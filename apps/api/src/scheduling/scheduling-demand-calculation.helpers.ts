import type {
  CourseDemandSummaryDto,
  StudentDayPreference,
  StudentSchoolShift,
} from '@workspace/types';

export type StudentPreferences = {
  schoolShift?: StudentSchoolShift | null;
  dayPreference?: StudentDayPreference | null;
};

type PreferenceCounts = Pick<
  CourseDemandSummaryDto,
  | 'morningShiftCount'
  | 'afternoonShiftCount'
  | 'flexibleShiftCount'
  | 'evenDaysPreferenceCount'
  | 'oddDaysPreferenceCount'
  | 'anyDayPreferenceCount'
>;

export function summarizeStudentPreferences(
  preferences: StudentPreferences[],
): PreferenceCounts {
  return preferences.reduce<PreferenceCounts>(
    (counts, preference) => {
      if (preference.schoolShift === 'MORNING') counts.morningShiftCount += 1;
      else if (preference.schoolShift === 'AFTERNOON') {
        counts.afternoonShiftCount += 1;
      } else counts.flexibleShiftCount += 1;

      if (preference.dayPreference === 'EVEN_DAYS') {
        counts.evenDaysPreferenceCount += 1;
      } else if (preference.dayPreference === 'ODD_DAYS') {
        counts.oddDaysPreferenceCount += 1;
      } else counts.anyDayPreferenceCount += 1;
      return counts;
    },
    {
      morningShiftCount: 0,
      afternoonShiftCount: 0,
      flexibleShiftCount: 0,
      evenDaysPreferenceCount: 0,
      oddDaysPreferenceCount: 0,
      anyDayPreferenceCount: 0,
    },
  );
}
