import "next-auth";

declare module "next-auth" {
  interface Session {
    user: { id: string; alias: string; role: "ADMIN" | "PLAYER" };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    role?: "ADMIN" | "PLAYER";
    alias?: string;
  }
}
