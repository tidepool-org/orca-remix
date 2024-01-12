export type Clinic = {
  shareCode: string;
  id: string;
  name: string;
  createdTime: string;
  canMigrate: boolean;
  tier: string;
};

export type RecentClinic = Pick<Clinic, 'shareCode' | 'id' | 'name'>;
