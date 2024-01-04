export type User = {
  emailVerified: boolean;
  emails: string[];
  passwordExists: boolean;
  roles: string[];
  termsAccepted: string;
  userid: string;
  username: string;
};

export type RecentUser = Pick<User, 'username' | 'userid'>;
