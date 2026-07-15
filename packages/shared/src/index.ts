export function hello(name: string): string {
  return `(from shared): Hello, ${name}!`;
}

export const USERNAME_PATTERN = "^[a-z0-9_-]{3,20}$";

export interface User {
  id: string;
  username: string;
  email?: string;
  createdAt: string;
}
