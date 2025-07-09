import { Request, Response, NextFunction } from 'express';
import { plainToClass } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';

export function validateDto(dtoClass: any, source: 'body' | 'query' | 'params' = 'body') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = plainToClass(dtoClass, req[source]);
      const errors = await validate(dto);

      if (errors.length > 0) {
        const errorMessages = errors.map((error: ValidationError) => ({
          property: error.property,
          value: error.value,
          constraints: error.constraints,
        }));

        return res.status(400).json({
          error: 'Validation failed',
          details: errorMessages,
        });
      }

      // Replace the original request data with the validated and transformed DTO
      req[source] = dto;
      next();
    } catch (error) {
      console.error('Validation middleware error:', error);
      return res.status(500).json({
        error: 'Internal server error during validation',
      });
    }
  };
}