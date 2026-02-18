/**
 * 개발모드 인증 DTO
 *
 * AUTH_DEV_MODE=true일 때 이메일+비밀번호 기반
 * 회원가입/로그인에 사용되는 요청 데이터 검증 구조를 정의합니다.
 *
 * @module auth/dto
 */

import { IsString, IsEmail, MinLength, MaxLength } from 'class-validator';

/**
 * 개발모드 회원가입 요청 DTO
 *
 * @description
 * Google OAuth 없이 이메일+비밀번호로 회원가입합니다.
 * AUTH_DEV_MODE=true일 때만 사용 가능합니다.
 */
export class DevSignupDto {
  /** 이메일 주소 */
  @IsEmail()
  email: string;

  /** 비밀번호 (최소 6자) */
  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password: string;

  /** 사용자 이름 */
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name: string;
}

/**
 * 개발모드 로그인 요청 DTO
 *
 * @description
 * 이메일+비밀번호로 로그인합니다.
 * AUTH_DEV_MODE=true일 때만 사용 가능합니다.
 */
export class DevLoginDto {
  /** 이메일 주소 */
  @IsEmail()
  email: string;

  /** 비밀번호 */
  @IsString()
  @MinLength(1)
  password: string;
}
