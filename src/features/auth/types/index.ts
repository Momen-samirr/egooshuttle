// Placeholder — auth-specific types
// Full types are in src/types/index.ts

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends AuthCredentials {
  name: string;
  phone: string;
  confirmPassword: string;
  role: "customer" | "driver";
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
}
