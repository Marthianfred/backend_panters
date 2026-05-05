import { PtcPackageEntity } from './ptc-package.entity';

export interface IPtcPackageRepository {
  create(
    data: Omit<PtcPackageEntity, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<PtcPackageEntity>;
  update(
    id: string,
    data: Partial<Omit<PtcPackageEntity, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<PtcPackageEntity>;
  deactivate(id: string): Promise<void>;
  activate(id: string): Promise<void>;
  findById(id: string): Promise<PtcPackageEntity | null>;
  findAll(): Promise<PtcPackageEntity[]>;
}

export const PTC_PACKAGE_REPOSITORY = 'IPtcPackageRepository';
