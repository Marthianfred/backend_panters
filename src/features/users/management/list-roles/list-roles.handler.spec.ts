import { Test, TestingModule } from '@nestjs/testing';
import { ListRolesHandler } from './list-roles.handler';
import { PostgresUsersManagementRepository } from '../infrastructure/postgres.users-management.repository';

describe('ListRolesHandler', () => {
  let handler: ListRolesHandler;
  let repository: PostgresUsersManagementRepository;

  const mockRepository = {
    listRoles: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListRolesHandler,
        {
          provide: PostgresUsersManagementRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    handler = module.get<ListRolesHandler>(ListRolesHandler);
    repository = module.get<PostgresUsersManagementRepository>(
      PostgresUsersManagementRepository,
    );
  });

  it('debe estar definido', () => {
    expect(handler).toBeDefined();
  });

  it('debe devolver la lista de roles del repositorio mapeada correctamente', async () => {
    const mockRoles = [
      { id: 'uuid-1', name: 'admin', description: 'desc 1' },
      { id: 'uuid-2', name: 'subscriber', description: 'desc 2' },
    ];

    mockRepository.listRoles.mockResolvedValue(mockRoles);

    const result = await handler.handle();

    expect(repository.listRoles).toHaveBeenCalled();
    expect(result.roles).toHaveLength(2);
    expect(result.roles[0]).toEqual({
      id: 'uuid-1',
      name: 'admin',
      description: 'desc 1',
    });
    expect(result.roles[1]).toEqual({
      id: 'uuid-2',
      name: 'subscriber',
      description: 'desc 2',
    });
  });

  it('debe devolver una lista vacía si no hay roles', async () => {
    mockRepository.listRoles.mockResolvedValue([]);

    const result = await handler.handle();

    expect(result.roles).toHaveLength(0);
  });
});
