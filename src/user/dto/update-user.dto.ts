import { IsEmail, IsIn, IsOptional, MaxLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsIn(['ACTIVE', 'DISABLED'])
  userStatus?: string;
}