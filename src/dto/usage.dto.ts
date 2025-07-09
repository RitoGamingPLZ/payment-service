import { IsString, IsOptional, IsObject, IsInt, IsISO8601, IsArray, ValidateNested, ArrayNotEmpty, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateUsageDto {
  @IsString()
  customer_id: string;

  @IsString()
  metric_name: string;

  @IsInt()
  quantity: number;

  @IsOptional()
  @IsString()
  subscription_id?: string;

  @IsOptional()
  @IsString()
  quota_plan_id?: string;

  @IsOptional()
  @IsISO8601()
  timestamp?: string;

  @IsOptional()
  @IsISO8601()
  period_start?: string;

  @IsOptional()
  @IsISO8601()
  period_end?: string;

  @IsOptional()
  @IsString()
  carried_over_from_period?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UsageRecordDto {
  @IsString()
  customer_id: string;

  @IsString()
  metric_name: string;

  @IsInt()
  quantity: number;

  @IsOptional()
  @IsString()
  subscription_id?: string;

  @IsOptional()
  @IsString()
  quota_plan_id?: string;

  @IsOptional()
  @IsISO8601()
  timestamp?: string;

  @IsOptional()
  @IsISO8601()
  period_start?: string;

  @IsOptional()
  @IsISO8601()
  period_end?: string;

  @IsOptional()
  @IsString()
  carried_over_from_period?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class CreateBatchUsageDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => UsageRecordDto)
  records: UsageRecordDto[];
}

export class CreateCarryOverUsageDto {
  @IsString()
  customer_id: string;

  @IsString()
  metric_name: string;

  @IsInt()
  @Min(1)
  carry_over_quantity: number;

  @IsISO8601()
  new_period_start: string;

  @IsISO8601()
  new_period_end: string;

  @IsString()
  previous_period_id: string;
}

export class GetUsageQueryDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 50;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  offset?: number = 0;

  @IsOptional()
  @IsString()
  customer_id?: string;

  @IsOptional()
  @IsString()
  metric_name?: string;

  @IsOptional()
  @IsString()
  subscription_id?: string;

  @IsOptional()
  @IsString()
  quota_plan_id?: string;

  @IsOptional()
  @IsISO8601()
  start_date?: string;

  @IsOptional()
  @IsISO8601()
  end_date?: string;

  @IsOptional()
  @IsISO8601()
  period_start?: string;

  @IsOptional()
  @IsISO8601()
  period_end?: string;
}

export class GetUsageForPeriodQueryDto {
  @IsString()
  customer_id: string;

  @IsString()
  metric_name: string;

  @IsISO8601()
  period_start: string;

  @IsISO8601()
  period_end: string;
}