import { Elysia, t } from "elysia";
import { registerUser, loginUser } from "../services/users-service";

export const usersRoutes = new Elysia({ prefix: "/api" })
  .post("/users", async ({ body, set }) => {
    try {
      const response = await registerUser(body);
      return response;
    } catch (error: any) {
      set.status = 400;
      return {
        error: error.message || "Terjadi kesalahan saat pendaftaran",
      };
    }
  }, {
    body: t.Object({
      name: t.String(),
      email: t.String(),
      password: t.String(),
    }),
  })
  .post("/users/login", async ({ body, set }) => {
    try {
      const response = await loginUser(body);
      return response;
    } catch (error: any) {
      set.status = 401;
      return {
        error: "Email atau password salah",
      };
    }
  }, {
    body: t.Object({
      email: t.String(),
      password: t.String(),
    }),
  });
