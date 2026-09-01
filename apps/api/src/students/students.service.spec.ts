/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { StudentsService } from './students.service';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from '../i18n/i18n.service';
import { JwtPayload } from '@workspace/types';

describe('StudentsService', () => {
  let service: StudentsService;
  let prismaService: any;
  let i18nService: any;

  const mockAdmin: JwtPayload = {
    sub: 'admin-id',
    phone: '09121111111',
    role: 'ADMIN',
    instituteId: 'inst-1',
  };

  const mockClerk: JwtPayload = {
    sub: 'clerk-id',
    phone: '09122222222',
    role: 'CLERK',
    instituteId: 'inst-1',
  };

  const mockStudentUser: JwtPayload = {
    sub: 'student-id',
    phone: '09123333333',
    role: 'STUDENT',
    instituteId: 'inst-1',
  };

  beforeEach(async () => {
    prismaService = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      studentProfile: {
        create: jest.fn(),
        upsert: jest.fn(),
        findUnique: jest.fn(),
      },
      studentNote: {
        create: jest.fn(),
      },
      $transaction: jest.fn((cb) => {
        return cb(prismaService);
      }),
    };

    i18nService = {
      t: jest.fn((key: string) => key),
      extractLocale: jest.fn().mockReturnValue('fa'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        { provide: PrismaService, useValue: prismaService },
        { provide: I18nService, useValue: i18nService },
      ],
    }).compile();

    service = module.get<StudentsService>(StudentsService);
  });

  describe('create', () => {
    it('should create a student with studentProfile successfully', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);
      prismaService.user.create.mockResolvedValue({
        id: 'new-student-id',
        instituteId: 'inst-1',
        role: 'STUDENT',
        firstName: 'Ali',
        lastName: 'Rezaei',
        phone: '09129999999',
        nationalCode: '0012345678',
        avatarUrl: null,
        isActive: true,
        currentAllowedCourseId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      prismaService.studentProfile.create.mockResolvedValue({
        id: 'profile-id',
        userId: 'new-student-id',
        fatherName: 'Reza',
        birthDate: null,
        gender: 'MALE',
        emergencyPhone: '09121112233',
        address: 'Tehran',
      });
      prismaService.studentProfile.findUnique.mockResolvedValue({
        id: 'profile-id',
        userId: 'new-student-id',
        fatherName: 'Reza',
        birthDate: null,
        gender: 'MALE',
        emergencyPhone: '09121112233',
        address: 'Tehran',
        notes: [],
      });

      const result = await service.create(mockAdmin, {
        firstName: 'Ali',
        lastName: 'Rezaei',
        phone: '09129999999',
        fatherName: 'Reza',
        gender: 'MALE',
        emergencyPhone: '09121112233',
        address: 'Tehran',
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('new-student-id');
      expect(result.studentProfile?.fatherName).toBe('Reza');
    });

    it('should throw ConflictException if phone is already registered in institute', async () => {
      prismaService.user.findUnique.mockResolvedValue({ id: 'existing-id' });

      await expect(
        service.create(mockClerk, {
          firstName: 'Ali',
          lastName: 'Rezaei',
          phone: '09129999999',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ForbiddenException if user has STUDENT role', async () => {
      await expect(
        service.create(mockStudentUser, {
          firstName: 'Ali',
          lastName: 'Rezaei',
          phone: '09129999999',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAll', () => {
    it('should return students list with enrollments count', async () => {
      prismaService.user.findMany.mockResolvedValue([
        {
          id: 'student-1',
          instituteId: 'inst-1',
          role: 'STUDENT',
          firstName: 'Ali',
          lastName: 'Rezaei',
          phone: '09129999999',
          studentProfile: { fatherName: 'Reza' },
          currentAllowedCourse: null,
          _count: { enrollments: 2 },
          password: 'hashed-password',
        },
      ]);

      const result = await service.findAll(mockAdmin, { search: 'Ali' });

      expect(result).toHaveLength(1);
      expect(result[0].enrollmentsCount).toBe(2);
      expect(result[0]).not.toHaveProperty('password');
    });
  });

  describe('findOne', () => {
    it('should return student details by id', async () => {
      prismaService.user.findFirst.mockResolvedValue({
        id: 'student-1',
        instituteId: 'inst-1',
        role: 'STUDENT',
        firstName: 'Ali',
        lastName: 'Rezaei',
        phone: '09129999999',
        studentProfile: { fatherName: 'Reza' },
        currentAllowedCourse: null,
        enrollments: [],
        transactions: [],
        password: 'hashed-password',
      });

      const result = await service.findOne(mockAdmin, 'student-1');

      expect(result).toBeDefined();
      expect(result.id).toBe('student-1');
      expect(result).not.toHaveProperty('password');
    });

    it('should throw NotFoundException if student does not exist', async () => {
      prismaService.user.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne(mockAdmin, 'non-existing-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('lookup', () => {
    it('should return found=false if both nationalCode and phone are empty', async () => {
      const result = await service.lookup(mockAdmin, '', '');
      expect(result).toEqual({ found: false, student: null });
      expect(prismaService.user.findMany).not.toHaveBeenCalled();
    });

    it('should return found=true with student details when matched by nationalCode', async () => {
      prismaService.user.findMany.mockResolvedValue([
        {
          id: 's-1',
          instituteId: 'inst-1',
          firstName: 'Sina',
          lastName: 'Rad',
          phone: '09121112233',
          nationalCode: '0012345678',
          avatarUrl: null,
          currentAllowedCourseId: 'c-1',
          studentProfile: {
            fatherName: 'Hossein',
            birthDate: new Date('2000-01-01'),
            gender: 'MALE',
            emergencyPhone: '09129998877',
            address: 'Tehran',
          },
        },
      ]);

      const result = await service.lookup(mockAdmin, '0012345678');
      expect(result.found).toBe(true);
      expect(result.student).toBeDefined();
      expect(result.student?.firstName).toBe('Sina');
      expect(result.student?.fatherName).toBe('Hossein');
    });

    it('should return found=false if no user matches query', async () => {
      prismaService.user.findMany.mockResolvedValue([]);

      const result = await service.lookup(mockAdmin, '9999999999');
      expect(result.found).toBe(false);
      expect(result.student).toBeNull();
    });
  });

  describe('addNote', () => {
    it('should create note and return updated student', async () => {
      prismaService.user.findFirst
        .mockResolvedValueOnce({
          id: 'student-1',
          instituteId: 'inst-1',
          role: 'STUDENT',
          studentProfile: { id: 'profile-1' },
        })
        .mockResolvedValueOnce({
          id: 'student-1',
          instituteId: 'inst-1',
          role: 'STUDENT',
          firstName: 'Ali',
          lastName: 'Rezaei',
          studentProfile: {
            id: 'profile-1',
            notes: [
              {
                id: 'note-1',
                content: 'Excellent progress',
                createdBy: {
                  id: 'admin-1',
                  firstName: 'Admin',
                  lastName: 'User',
                },
              },
            ],
          },
          currentAllowedCourse: null,
          enrollments: [],
          transactions: [],
          password: 'hashed-password',
        });

      prismaService.studentNote.create.mockResolvedValue({
        id: 'note-1',
        studentProfileId: 'profile-1',
        createdByUserId: mockAdmin.sub,
        content: 'Excellent progress',
      });

      const result = await service.addNote(mockAdmin, 'student-1', {
        content: 'Excellent progress',
      });

      expect(prismaService.studentNote.create).toHaveBeenCalledWith({
        data: {
          studentProfileId: 'profile-1',
          createdByUserId: mockAdmin.sub,
          content: 'Excellent progress',
        },
      });
      expect(result).toBeDefined();
      expect(result.id).toBe('student-1');
      expect(result).not.toHaveProperty('password');
    });

    it('should throw NotFoundException if student is not found', async () => {
      prismaService.user.findFirst.mockResolvedValue(null);

      await expect(
        service.addNote(mockAdmin, 'non-existent', {
          content: 'Some note',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
