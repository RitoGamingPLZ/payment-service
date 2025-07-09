import { IsString, IsOptional, IsObject, IsInt, Min, Length } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreatePaymentIntentDto {
  @IsString()
  customer_id: string;

  @IsInt()
  @Min(1)
  amount: number;

  @IsString()
  @Length(3, 3)
  currency: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class RefundPaymentDto {
  @IsString()
  payment_id: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  amount?: number;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class GetPaymentsQueryDto {
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