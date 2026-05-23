import { Elysia, t } from "elysia";
import { registerUser, loginUser, logoutUser } from "../services/users-service";

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
  })
  .delete("/users/logout", async ({ headers, set }) => {
    try {
      // Ambil header Authorization
      const authHeader = headers.authorization;
      
      // Validasi apakah header ada
      if (!authHeader) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      // Extract token (hapus "Bearer " dari depan)
      const token = authHeader.replace("Bearer ", "");

      // Panggil service untuk logout
      const response = await logoutUser(token);
      return response;
    } catch (error: any) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
  });
