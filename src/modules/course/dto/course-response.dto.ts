import { ApiProperty } from '@nestjs/swagger';
import { CourseEntity } from '../entities/course.entity';

export class CourseListResponseDto {
  @ApiProperty({ type: [CourseEntity] })
  courses: CourseEntity[];

  @ApiProperty({ example: 10 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;
}
