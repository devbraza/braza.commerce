export class AuthResponseDto {
  id: string;
  email: string | null;
  name: string | null;
  facebookId: string | null;
  timezone: string;
  createdAt: Date;
}
