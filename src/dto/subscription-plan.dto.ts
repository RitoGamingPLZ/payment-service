import { IsString, IsNumber, IsOptional, IsBoolean, IsIn, IsObject, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateSubscriptionPlanDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  slug: string;

  @IsNumber()
  @Min(0)
  base_price: number;

  @IsOptional()
  @IsString()
  @IsIn(['usd', 'eur', 'gbp', 'cad', 'aud'])
  currency?: string;

  @IsString()
  @IsIn(['monthly', 'yearly', 'weekly', 'daily'])
  billing_period: string;

  @IsOptional()
  @IsString()
  stripe_price_id?: string;

  @IsOptional()
  @IsString()
  stripe_product_id?: string;

  @IsOptional()
  @IsString()
  quota_plan_id?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(365)
  trial_days?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  setup_fee?: number;

  @IsOptional()
  @IsBoolean()
  is_popular?: boolean;

  @IsOptional()
  @IsBoolean()
  is_featured?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  display_order?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateSubscriptionPlanDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  base_price?: number;

  @IsOptional()
  @IsString()
  @IsIn(['usd', 'eur', 'gbp', 'cad', 'aud'])
  currency?: string;

  @IsOptional()
  @IsString()
  @IsIn(['monthly', 'yearly', 'weekly', 'daily'])
  billing_period?: string;

  @IsOptional()
  @IsString()
  stripe_price_id?: string;

  @IsOptional()
  @IsString()
  stripe_product_id?: string;

  @IsOptional()
  @IsString()
  quota_plan_id?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(365)
  trial_days?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  setup_fee?: number;

  @IsOptional()
  @IsBoolean()
  is_popular?: boolean;

  @IsOptional()
  @IsBoolean()
  is_featured?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  display_order?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsBoolean()
  is_public?: boolean;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class GetSubscriptionPlansQueryDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(0)
  offset?: number;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  is_public?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(['monthly', 'yearly', 'weekly', 'daily'])
  billing_period?: string;
}

export class GetPublicPlansQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(['monthly', 'yearly', 'weekly', 'daily'])
  billing_period?: string;
}