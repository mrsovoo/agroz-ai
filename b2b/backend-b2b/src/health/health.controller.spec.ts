import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return health payload with version 0.0.1', () => {
    const result = controller.check();
    expect(result.status).toBe('ok');
    expect(result.version).toBe('0.0.1');
    expect(result.service).toBe('backend-b2b');
    expect(typeof result.timestamp).toBe('string');
  });
});

