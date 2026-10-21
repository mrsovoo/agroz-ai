import { Test, TestingModule } from '@nestjs/testing';
import { AdminBusinessController } from './admin-business.controller';
import { BusinessController } from './business.controller';
import { BusinessService } from './business.service';

describe('BusinessController and AdminBusinessController', () => {
  let businessController: BusinessController;
  let adminBusinessController: AdminBusinessController;
  let service: any;

  beforeEach(async () => {
    service = {
      createBusiness: jest.fn().mockResolvedValue({ id: 'biz-1', name: 'Test Dorixona' }),
      getBusinessProfile: jest.fn().mockResolvedValue({ id: 'biz-1', name: 'Test Dorixona' }),
      updateBusiness: jest.fn().mockResolvedValue({ id: 'biz-1', name: 'Updated Dorixona' }),
      listStaff: jest.fn().mockResolvedValue([{ user_id: 'u-1', role: 'seller' }]),
      addStaff: jest.fn().mockResolvedValue({ user_id: 'u-2', role: 'seller' }),
      updateStaffRole: jest.fn().mockResolvedValue({ role: 'owner' }),
      removeStaff: jest.fn().mockResolvedValue({ success: true }),
      adminListBusinesses: jest.fn().mockResolvedValue({ items: [], total: 0 }),
      adminUpdateBusinessStatus: jest.fn().mockResolvedValue({ id: 'biz-1', is_active: false }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BusinessController, AdminBusinessController],
      providers: [{ provide: BusinessService, useValue: service }],
    })
      .useMocker(() => ({}))
      .compile();

    businessController = module.get<BusinessController>(BusinessController);
    adminBusinessController = module.get<AdminBusinessController>(AdminBusinessController);
  });

  describe('BusinessController', () => {
    it('POST /v1/business calls createBusiness', async () => {
      const res = await businessController.createBusiness(
        'user-1',
        { name: 'Test Dorixona', sector: 'pharmacy' },
        '127.0.0.1',
      );
      expect(service.createBusiness).toHaveBeenCalled();
      expect(res.id).toBe('biz-1');
    });

    it('GET /v1/business calls getBusinessProfile', async () => {
      const res = await businessController.getMyBusiness({ businessId: 'biz-1' });
      expect(service.getBusinessProfile).toHaveBeenCalledWith('biz-1');
      expect(res.name).toBe('Test Dorixona');
    });

    it('GET /v1/business/staff calls listStaff', async () => {
      const res = await businessController.listStaff({ businessId: 'biz-1' });
      expect(service.listStaff).toHaveBeenCalledWith('biz-1');
      expect(res).toHaveLength(1);
    });

    it('POST /v1/business/staff calls addStaff', async () => {
      const res = await businessController.addStaff(
        { businessId: 'biz-1' },
        'user-1',
        { phone: '+998901234567', first_name: 'Jasur' },
        '127.0.0.1',
      );
      expect(service.addStaff).toHaveBeenCalled();
      expect(res.user_id).toBe('u-2');
    });
  });

  describe('AdminBusinessController', () => {
    it('GET /v1/admin/businesses calls adminListBusinesses', async () => {
      const res = await adminBusinessController.listBusinesses(1, 20);
      expect(service.adminListBusinesses).toHaveBeenCalled();
      expect(res.total).toBe(0);
    });

    it('PATCH /v1/admin/businesses/:id/status calls adminUpdateBusinessStatus', async () => {
      const res = await adminBusinessController.updateStatus(
        'biz-1',
        { is_active: false },
        'admin-user',
        '127.0.0.1',
      );
      expect(service.adminUpdateBusinessStatus).toHaveBeenCalledWith('biz-1', false, 'admin-user', '127.0.0.1');
      expect(res.is_active).toBe(false);
    });
  });
});
