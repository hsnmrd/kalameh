import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import {
  calculateUncoveredStudents,
  type ApplyTermDemandInput,
  type ApplyTermDemandResult,
  type JwtPayload,
} from '@workspace/types';
import { PrismaService } from '../prisma/prisma.service';
import { SchedulingDemandCalculationService } from './scheduling-demand-calculation.service';

@Injectable()
export class SchedulingDemandApplicationService {
  private readonly logger = new Logger(SchedulingDemandApplicationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly calculationService: SchedulingDemandCalculationService,
  ) {}

  async applyDemand(
    currentUser: JwtPayload,
    input: ApplyTermDemandInput,
  ): Promise<ApplyTermDemandResult> {
    const { instituteId } =
      await this.calculationService.resolveInstituteForTerm(
        currentUser,
        input.termId,
        input.instituteId,
      );
    const activeBranches = await this.prisma.branch.findMany({
      where: { instituteId, isActive: true },
      select: { id: true },
    });
    const targetBranchId =
      input.branchId ??
      (activeBranches.length === 1 ? (activeBranches[0]?.id ?? null) : null);
    const demand = await this.calculationService.calculateDemand(currentUser, {
      termId: input.termId,
      branchId: targetBranchId,
      instituteId,
      maxStudentsPerClass: 100,
    });
    const demandByCourse = new Map(
      demand.courses.map((course) => [course.courseId, course]),
    );
    const itemByCourse = new Map(
      input.items.map((item) => [item.courseId, item]),
    );

    if (input.items.some((item) => !demandByCourse.has(item.courseId))) {
      throw new BadRequestException(
        'A submitted course is outside this institute.',
      );
    }
    if (
      demand.maxAvailableRoomCapacity !== null &&
      input.items.some(
        (item) =>
          item.deliveryMode === 'IN_PERSON' &&
          item.classes.some(
            (suggestedClass) =>
              suggestedClass.capacity > demand.maxAvailableRoomCapacity!,
          ),
      )
    ) {
      throw new BadRequestException(
        'A submitted class exceeds the available classroom ceiling.',
      );
    }

    const uncoveredStudents = demand.courses.reduce((total, course) => {
      const capacities =
        itemByCourse
          .get(course.courseId)
          ?.classes.map((item) => item.capacity) ?? [];
      return (
        total +
        calculateUncoveredStudents(course.eligibleStudentsCount, capacities)
      );
    }, 0);
    if (uncoveredStudents > 0 && !input.acknowledgeShortfall) {
      throw new BadRequestException(
        'Uncovered students must be acknowledged before applying demand.',
      );
    }

    const creationScope = {
      instituteId,
      termId: input.termId,
      branchId: targetBranchId,
    };
    const replacementScope = {
      instituteId,
      termId: input.termId,
      ...(targetBranchId
        ? { OR: [{ branchId: targetBranchId }, { branchId: null }] }
        : { branchId: null }),
    };
    const previousRequirements = await this.prisma.classRequirement.findMany({
      where: { ...replacementScope, isActive: true },
    });
    const result = await this.prisma.$transaction(async (tx) => {
      const deactivated = await tx.classRequirement.updateMany({
        where: { ...replacementScope, isActive: true },
        data: { isActive: false },
      });
      const requirementIds: string[] = [];

      for (const item of input.items) {
        const previous = previousRequirements.find(
          (requirement) => requirement.courseId === item.courseId,
        );
        const sessionsPerWeek =
          item.sessionsPerWeek ??
          previous?.sessionsPerWeek ??
          (item.totalSessions || previous?.totalSessions ? null : 3);
        const totalSessions =
          item.totalSessions ??
          (sessionsPerWeek ? null : (previous?.totalSessions ?? null));

        for (const suggestedClass of item.classes) {
          const requirement = await tx.classRequirement.create({
            data: {
              ...creationScope,
              courseId: item.courseId,
              requiredClassCount: 1,
              capacity: suggestedClass.capacity,
              deliveryMode: item.deliveryMode,
              sessionDurationMinutes: item.sessionDurationMinutes,
              sessionsPerWeek,
              totalSessions,
              isActive: true,
            },
            select: { id: true },
          });
          requirementIds.push(requirement.id);
        }
      }

      return { deactivatedCount: deactivated.count, requirementIds };
    });
    const totalRequirements = await this.prisma.classRequirement.count({
      where: { ...replacementScope, isActive: true },
    });

    this.logger.log(
      `Applied term demand for term ${input.termId}: ${result.requirementIds.length} created, ${result.deactivatedCount} deactivated`,
    );
    return {
      createdCount: result.requirementIds.length,
      deactivatedCount: result.deactivatedCount,
      totalRequirements,
      requirementIds: result.requirementIds,
    };
  }
}
