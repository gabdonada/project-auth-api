import { IsInt } from 'class-validator';

export class UpdateUserRoleDto {
  @IsInt()
  roleKey: number;
}