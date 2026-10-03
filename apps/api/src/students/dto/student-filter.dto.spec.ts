import { StudentFilterDto } from './student-filter.dto';

describe('StudentFilterDto', () => {
  it.each([
    ['true', true],
    ['ACTIVE', true],
    ['false', false],
    ['INACTIVE', false],
  ])('normalizes the %s status query value', (value, expected) => {
    const result = StudentFilterDto.schema.parse({ isActive: value });

    expect(result.isActive).toBe(expected);
  });

  it('normalizes an ALL status query value to an omitted filter', () => {
    const result = StudentFilterDto.schema.parse({ isActive: 'ALL' });

    expect(result.isActive).toBeUndefined();
  });

  it('rejects malformed UUID and status query values', () => {
    expect(() =>
      StudentFilterDto.schema.parse({
        instituteId: 'not-a-uuid',
        isActive: 'sometimes',
      }),
    ).toThrow();
  });
});
