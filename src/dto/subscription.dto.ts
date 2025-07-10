import { IsString, IsOptional, IsObject, IsInt, IsBoolean, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateSubscriptionDto {
  @IsString()
  customer_id: string;

  @IsOptional()
  @IsString()
  subscription_plan_id?: string;

  @IsString()
  price_id: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(0)
  trial_period_days?: number;

  @IsOptional()
  @IsString()
  quota_plan_id?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateSubscriptionDto {
  @IsOptional()
  @IsString()
  price_id?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsString()
  quota_plan_id?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class CancelSubscriptionDto {
  @IsOptional()
  @IsBoolean()
  cancel_at_period_end?: boolean = false;
}

export class GetSubscriptionsQueryDto {
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
  status?: string;
}