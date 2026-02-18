/**
 * 개발모드 인증 컨트롤러
 *
 * AUTH_DEV_MODE=true일 때 이메일+비밀번호 기반의
 * 회원가입/로그인 엔드포인트를 제공합니다.
 * 프로덕션 환경에서는 404를 반환합니다.
 *
 * @module auth
 */

import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { DevSignupDto, DevLoginDto } from './dto/dev-auth.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoggerService } from '../core/logger/logger.service';

/**
 * 개발모드 전용 인증 API 컨트롤러
 *
 * @description
 * 엔드포인트:
 * - POST /auth/dev/signup: 이메일+비밀번호 회원가입
 * - POST /auth/dev/login: 이메일+비밀번호 로그인
 *
 * AUTH_DEV_MODE 환경변수가 'true'가 아니면 모든 엔드포인트에서 404를 반환합니다.
 */
@Controller('auth/dev')
export class DevAuthController {
  private readonly logger: LoggerService;
  private readonly isDevMode: boolean;

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    logger: LoggerService,
  ) {
    this.logger = logger;
    this.logger.setContext('DevAuthController');
    this.isDevMode = this.configService.get<string>('AUTH_DEV_MODE') === 'true';
  }

  /**
   * 개발모드 환경변수를 확인합니다
   *
   * @throws NotFoundException AUTH_DEV_MODE가 활성화되지 않은 경우
   */
  private checkDevMode(): void {
    if (!this.isDevMode) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'NOT_001',
          message: 'Dev auth endpoints are not available',
        },
      });
    }
  }

  /**
   * 개발모드 회원가입을 처리합니다
   *
   * @description
   * 이메일+비밀번호로 유저를 생성하고 JWT 토큰을 발급합니다.
   * googleId 없이 유저가 생성되며, 비밀번호는 SHA-256 해시로 저장됩니다.
   *
   * @param dto - 이메일, 비밀번호, 이름을 포함하는 요청 바디
   * @returns 유저 정보와 JWT 토큰 페어를 포함하는 AuthResponseDto
   */
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() dto: DevSignupDto): Promise<{ success: boolean; data: AuthResponseDto }> {
    this.checkDevMode();

    this.logger.info('개발모드 회원가입 요청', { email: dto.email });

    const result = await this.authService.handleDevSignup(
      dto.email,
      dto.password,
      dto.name,
    );

    return { success: true, data: result };
  }

  /**
   * 개발모드 로그인을 처리합니다
   *
   * @description
   * 이메일로 유저를 조회하고 비밀번호를 검증한 후 JWT 토큰을 발급합니다.
   * 기존 세션은 무효화되며 새 세션이 생성됩니다.
   *
   * @param dto - 이메일, 비밀번호를 포함하는 요청 바디
   * @returns 유저 정보와 JWT 토큰 페어를 포함하는 AuthResponseDto
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: DevLoginDto): Promise<{ success: boolean; data: AuthResponseDto }> {
    this.checkDevMode();

    this.logger.info('개발모드 로그인 요청', { email: dto.email });

    const result = await this.authService.handleDevLogin(dto.email, dto.password);

    return { success: true, data: result };
  }
}
