export type Clinic = {
  shareCode: string;
  id: string;
  name: string;
};

export type RecentClinic = Pick<Clinic, 'shareCode' | 'id' | 'name'>;
