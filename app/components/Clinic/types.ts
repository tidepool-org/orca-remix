export type Clinic = {
  shareCode: string;
  id: string;
};

export type RecentClinic = Pick<Clinic, 'shareCode' | 'id'>;
