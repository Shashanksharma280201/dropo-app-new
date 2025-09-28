export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string | null;
    phoneNumber: string;
  };
  tokens: AuthTokens;
  onboardingComplete: boolean;
}
