import { IsString, IsOptional, IsISO8601 } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetAuditLogsQueryDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 50;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  offset?: number = 0;

  @IsOptional()
  @IsString()
  action_type?: string;

  @IsOptional()
  @IsString()
  target_type?: string;

  @IsOptional()
  @IsString()
  target_id?: string;

  @IsOptional()
  @IsISO8601()
  start_date?: string;

  @IsOptional()
  @IsISO8601()
  end_date?: string;
}

export class GetAuditSummaryQueryDto {
  @IsOptional()
  @IsISO8601()
  start_date?: string;

  @IsOptional()
  @IsISO8601()
  end_date?: string;
}