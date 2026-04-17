export class UserDetailsResponse {
  id!: string;
  email!: string;
  name!: string;
  role!: {
    id: string | null;
    name: string | null;
  };
  isActive!: boolean;
  mustChangePassword!: boolean;
  createdAt!: Date;
  profile!: {
    fullName: string | null;
    avatarUrl: string | null;
    bio: string | null;
  } | null;
  wallet!: {
    balance: number;
  } | null;
  creatorStats?: {
    totalEarned: number;
    netBalance: number;
    contentCount: number;
  };
}
