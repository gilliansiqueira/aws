import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "VENDEDOR";
    } & DefaultSession["user"];
  }

  interface User {
    role?: "ADMIN" | "VENDEDOR";
  }
}
