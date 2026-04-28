import { IsEmail, IsInt, IsNotEmpty, IsString, Min, MinLength } from 'class-validator';


export class RegisterClientRequest {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  username!: string;

  @IsString()
  @IsNotEmpty()
  birthDate!: string;

  @IsString()
  @IsNotEmpty()
  gender!: string;

  @IsInt()
  @Min(18)
  age!: number;
}


export class RegisterClientResponse {
  success!: boolean;
  message!: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
}


export class VerifyEmailRequest {
  @IsString()
  @IsNotEmpty()
  token!: string;
}
