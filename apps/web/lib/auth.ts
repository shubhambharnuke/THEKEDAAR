import { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || "default-development-secret-minimum-32-characters-long",
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  plugins: [
    jwt({
      jwks: {
        keyPairConfig: {
          alg: "RS256",
        },
      },
    }),
  ],
});
