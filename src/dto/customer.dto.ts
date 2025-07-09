import { IsEmail, IsString, IsOptional, IsObject, Length } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCustomerDto {
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @IsString()
  stripe_customer_id: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateCustomerDto {
  @IsOptional()
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class GetCustomersQueryDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 50;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => parseInt(value, 10))
  offset?: number = 0;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  name?: string;
}