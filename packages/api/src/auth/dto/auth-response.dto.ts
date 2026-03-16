export class AuthResponseDto {
  id: string;
  email: string | null;
  name: string | null;
  facebookId: string | null;
  facebookConnected: boolean;
  timezone: string;
  createdAt: Date;
}
