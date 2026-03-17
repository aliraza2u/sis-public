import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { RawValueParser } from './raw-import-strategy.interface';
import {
  ValidationResult,
  ValidatedRow,
  BatchImportResult,
  ImportError,
} from './import-strategy.interface';
import { RawImportStrategy } from './raw-import-strategy.interface';
import { ImportEntityType } from '@/common/enums/import-entity-type.enum';
import { GradeSource, GradeResult } from '@/infrastructure/prisma/client/client';
import { t_ } from '@/common/helpers/i18n.helper';

/** CSV row shape after normalization (one row per module item) */
interface NormalizedGradeRow {
  tenantId: string;
  userId: string;
  courseId: string;
  courseName: string;
  courseProgressPct: number | null;
  coursePassed: 'pass' | 'fail';
  moduleItemTitle: string;
  itemType: string;
  score: number;
  maxScore: number | null;
}

/** Expected CSV headers (order: required first, last one optional for validation) */
const EXPECTED_HEADERS = [
  'Tenant ID',
  'Student ID',
  'Course ID',
  'Course Name',
  'Course Progress %',
  'Course Passed',
  'Module_Item Title',
  'Item Type',
  'Score',
  'Roll Number', // optional
];

/** Aliases for CSV columns (LMS exports may use different names) */
const HEADER_ALIASES: Record<string, string[]> = {
  'Tenant ID': ['Tenant ID', 'Tenant Id', 'tenant_id', 'TenantID'],
  'Student ID': ['Student ID', 'Student Id', 'student_id', 'StudentID'],
  'Course ID': ['Course ID', 'Course Id', 'course_id', 'CourseID'],
  'Course Name': ['Course Name', 'Course name', 'course_name'],
  'Course Progress %': ['Course Progress %', 'Course Progress', 'course_progress'],
  'Course Passed': ['Course Passed', 'course_passed'],
  // LMS exports often use "Module" + "Item Title" as separate columns; we use Item Title for the grade item name
  'Module_Item Title': ['Module_Item Title', 'Module Item Title', 'module_item_title', 'Item Title'],
  'Item Type': ['Item Type', 'item_type'],
  'Score': ['Score', 'score'],
  'Roll Number': ['Roll Number', 'roll_number', 'Student Roll Number'],
  'Max Score': ['Max Score', 'max_score'],
};

@Injectable()
export class StudentGradesRawImportStrategy implements RawImportStrategy {
  private readonly logger = new Logger(StudentGradesRawImportStrategy.name);

  constructor(private readonly prisma: PrismaService) {}

  getEntityType(): string {
    return ImportEntityType.STUDENT_GRADES;
  }

  getDependencyOrder(): number {
    return 10; // After courses, applications, etc.
  }

  isRawImport(): boolean {
    return true;
  }

  /**
   * Student grades CSV has multiple rows per student per course; we must process the full file and group.
   */
  requiresFullFile(): boolean {
    return true;
  }

  getExpectedHeaders(): string[] {
    return [...EXPECTED_HEADERS];
  }

  getHeaderAliases(): Record<string, string[]> {
    return { ...HEADER_ALIASES };
  }

  getSampleRow(): Record<string, string> {
    return {
      'Tenant ID': 'TNT-7301032-915b-4140-9d87-xxxx',
      'Student ID': 'USR-0131d34-5Bxx',
      'Course ID': '73530514b44',
      'Course Name': 'Advanced Web Development',
      'Course Progress %': '55',
      'Course Passed': 'Yes',
      'Module_Item Title': 'Pop Quiz',
      'Item Type': 'quiz',
      'Score': '8',
      'Roll Number': 'STU-AM-WEB201-01-001',
    };
  }

  async validate(
    row: Record<string, unknown>,
    rowIndex: number,
    _existingKeys?: Set<string>,
  ): Promise<ValidationResult> {
    const errors: { field: string; message: string }[] = [];

    const tenantId = RawValueParser.parseString(row['Tenant ID']);
    const userId = RawValueParser.parseString(row['Student ID']);
    const courseId = RawValueParser.parseString(row['Course ID']);
    const courseName = RawValueParser.parseString(row['Course Name']);
    const courseProgressPct = RawValueParser.parseNumber(row['Course Progress %']);
    const coursePassedRaw = RawValueParser.parseString(row['Course Passed']);
    const moduleItemTitle = RawValueParser.parseString(row['Module_Item Title']);
    const itemType = RawValueParser.parseString(row['Item Type']);
    const scoreRaw = RawValueParser.parseNumber(row['Score']);
    const maxScoreRaw = row['Max Score'] != null ? RawValueParser.parseNumber(row['Max Score']) : null;

    if (!tenantId) errors.push({ field: 'Tenant ID', message: 'Tenant ID is required' });
    if (!userId) errors.push({ field: 'Student ID', message: 'Student ID is required' });
    if (!courseId) errors.push({ field: 'Course ID', message: 'Course ID is required' });
    if (!courseName) errors.push({ field: 'Course Name', message: 'Course Name is required' });
    if (moduleItemTitle == null || moduleItemTitle === '')
      errors.push({ field: 'Module_Item Title', message: 'Module_Item Title is required' });
    if (!itemType) errors.push({ field: 'Item Type', message: 'Item Type is required' });
    if (scoreRaw == null || (typeof scoreRaw === 'number' && isNaN(scoreRaw)))
      errors.push({ field: 'Score', message: 'Score is required and must be a number' });

    const coursePassed =
      coursePassedRaw == null
        ? 'fail'
        : String(coursePassedRaw).toLowerCase() === 'yes' || String(coursePassedRaw).toLowerCase() === 'true'
          ? 'pass'
          : 'fail';

    const score = typeof scoreRaw === 'number' && !isNaN(scoreRaw) ? scoreRaw : 0;
    const maxScore =
      maxScoreRaw != null && typeof maxScoreRaw === 'number' && !isNaN(maxScoreRaw)
        ? maxScoreRaw
        : null;

    if (errors.length > 0) {
      return { isValid: false, errors, normalizedData: undefined };
    }

    const normalizedData: NormalizedGradeRow = {
      tenantId: tenantId!,
      userId: userId!,
      courseId: courseId!,
      courseName: courseName!,
      courseProgressPct: courseProgressPct != null && !isNaN(courseProgressPct) ? courseProgressPct : null,
      coursePassed,
      moduleItemTitle: moduleItemTitle ?? '',
      itemType: (itemType ?? '').toLowerCase().replace(/\s+/g, '_'),
      score,
      maxScore,
    };

    return {
      isValid: true,
      errors: [],
      normalizedData: normalizedData as unknown as Record<string, unknown>,
    };
  }

  async importBatch(rows: ValidatedRow[], tenantId: string): Promise<BatchImportResult> {
    if (rows.length === 0) {
      return { successCount: 0, errors: [] };
    }

    const errors: ImportError[] = [];
    const key = (r: NormalizedGradeRow) => `${r.tenantId}:${r.userId}:${r.courseId}`;
    const groups = new Map<string, ValidatedRow[]>();

    for (const row of rows) {
      const data = row.data as unknown as NormalizedGradeRow;
      const k = key(data);
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k)!.push(row);
    }

    let successCount = 0;

    for (const [, groupRows] of groups) {
      const first = groupRows[0].data as unknown as NormalizedGradeRow;
      const breakdown: { type: string; name: string; score: number; maxScore: number | null }[] = [];

      for (const r of groupRows) {
        const d = r.data as unknown as NormalizedGradeRow;
        breakdown.push({
          type: d.itemType,
          name: d.moduleItemTitle,
          score: d.score,
          maxScore: d.maxScore,
        });
      }

      const finalScore =
        first.courseProgressPct != null && !isNaN(first.courseProgressPct)
          ? first.courseProgressPct
          : null;

      try {
        await this.prisma.studentCourseGrade.upsert({
          where: {
            tenantId_userId_courseId: {
              tenantId: first.tenantId,
              userId: first.userId,
              courseId: first.courseId,
            },
          },
          update: {
            source: GradeSource.import,
            finalResult: first.coursePassed === 'pass' ? GradeResult.pass : GradeResult.fail,
            finalScore,
            breakdown: breakdown as unknown as object[],
            updatedAt: new Date(),
          },
          create: {
            tenantId: first.tenantId,
            userId: first.userId,
            courseId: first.courseId,
            source: GradeSource.import,
            finalResult: first.coursePassed === 'pass' ? GradeResult.pass : GradeResult.fail,
            finalScore,
            breakdown: breakdown as unknown as object[],
          },
        });
        successCount++;
      } catch (err) {
        this.logger.warn(`Failed to upsert grade for ${first.userId}/${first.courseId}:`, err);
        const isFk = (err as any)?.code === 'P2003';
        const msg = isFk
          ? t_('messages.prisma.foreignKeyConstraint', { field: 'tenantId/userId/courseId' })
          : (err instanceof Error ? err.message : 'Unknown error');
        errors.push({
          row: groupRows[0].rowIndex,
          field: 'import',
          message: msg,
          data: first as unknown as Record<string, unknown>,
        });
      }
    }

    return { successCount, errors };
  }
}
