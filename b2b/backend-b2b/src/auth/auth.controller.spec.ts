import { Test, TestingModule } from '@nestjs/testing';
import { AdminAuthController } from './admin-auth.controller';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController and AdminAuthController', () => {
  let authController: AuthController;
  let adminAuthController: AdminAuthController;
  let authService: any;

  beforeEach(async () => {
    authService = {
      requestOtp: jest.fn().mockResolvedValue({ success: true, message: 'Tasdiqlash kodi yuborildi.' }),
      verifyOtpAndLogin: jest.fn().mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: { id: 'u1', phone: '+998901234567', role: 'seller' },
      }),
      createTelegramLinkToken: jest.fn().mockResolvedValue({
        token: 'link-token',
        linkUrl: 'https://t.me/biznesgo_bot?start=link-token',
      }),
      refreshTokens: jest.fn().mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      }),
      logout: jest.fn().mockResolvedValue({ success: true, message: 'Tizimdan chiqildi' }),
      adminLogin: jest.fn().mockResolvedValue({ requireTotp: true, tempToken: 'temp-token' }),
      adminSetup2Fa: jest.fn().mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: { id: 'admin-id', role: 'super_admin' },
      }),
      adminVerify2Fa: jest.fn().mockResolvedValue({ accessToken: 'admin-access-token' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController, AdminAuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    adminAuthController = module.get<AdminAuthController>(AdminAuthController);
  });

  describe('Merchant Auth Endpoints', () => {
    it('POST /v1/auth/otp/request calls authService.requestOtp', async () => {
      const res = await authController.requestOtp({ phone: '+998901234567' }, '127.0.0.1');
      expect(authService.requestOtp).toHaveBeenCalledWith('+998901234567', '127.0.0.1');
      expect(res.success).toBe(true);
    });

    it('POST /v1/auth/otp/verify calls authService.verifyOtpAndLogin', async () => {
      const res = await authController.verifyOtp(
        { phone: '+998901234567', code: '123456' },
        '127.0.0.1',
        'Mozilla/5.0',
      );
      expect(authService.verifyOtpAndLogin).toHaveBeenCalledWith(
        '+998901234567',
        '123456',
        '127.0.0.1',
        'Mozilla/5.0',
      );
      expect(res.accessToken).toBe('access-token');
    });

    it('POST /v1/auth/telegram/link-token calls authService.createTelegramLinkToken', async () => {
      const res = await authController.createTelegramLinkToken({ phone: '+998901234567' });
      expect(authService.createTelegramLinkToken).toHaveBeenCalledWith('+998901234567');
      expect(res.linkUrl).toBeDefined();
    });

    it('POST /v1/auth/refresh calls authService.refreshTokens', async () => {
      const res = await authController.refreshTokens(
        { refreshToken: 'token-123' },
        '127.0.0.1',
        'Mozilla/5.0',
      );
      expect(authService.refreshTokens).toHaveBeenCalledWith('token-123', '127.0.0.1', 'Mozilla/5.0');
      expect(res.accessToken).toBe('new-access-token');
    });

    it('POST /v1/auth/logout calls authService.logout', async () => {
      const res = await authController.logout({ refreshToken: 'token-123' }, '127.0.0.1');
      expect(authService.logout).toHaveBeenCalledWith('token-123', '127.0.0.1');
      expect(res.success).toBe(true);
    });
  });

  describe('Super Admin Auth Endpoints', () => {
    it('POST /v1/admin/auth/login calls authService.adminLogin', async () => {
      const res = await adminAuthController.login(
        { identifier: 'admin@biznesgo.uz', password: 'Password123' },
        '127.0.0.1',
      );
      expect(authService.adminLogin).toHaveBeenCalled();
      expect(res.requireTotp).toBe(true);
    });

    it('POST /v1/admin/auth/setup-2fa calls authService.adminSetup2Fa', async () => {
      const res = await adminAuthController.setup2Fa(
        { tempToken: 'token', totpCode: '123456' },
        '127.0.0.1',
        'Mozilla/5.0',
      );
      expect(authService.adminSetup2Fa).toHaveBeenCalled();
      expect(res.accessToken).toBe('access-token');
    });

    it('POST /v1/admin/auth/verify-2fa calls authService.adminVerify2Fa', async () => {
      const res = await adminAuthController.verify2Fa(
        { tempToken: 'token', code: '123456' },
        '127.0.0.1',
        'Mozilla/5.0',
      );
      expect(authService.adminVerify2Fa).toHaveBeenCalled();
      expect(res.accessToken).toBe('admin-access-token');
    });
  });
});
