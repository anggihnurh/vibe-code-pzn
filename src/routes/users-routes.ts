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
      name: t.String({ minLength: 1, maxLength: 255 }),
      email: t.String({ format: "email", minLength: 1, maxLength: 255 }),
      password: t.String({ minLength: 6, maxLength: 255 }),
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
      email: t.String({ format: "email", minLength: 1, maxLength: 255 }),
      password: t.String({ minLength: 6, maxLength: 255 }),
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

      // Validasi format Bearer token
      if (!authHeader.startsWith("Bearer ")) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      // Extract token (ambil setelah "Bearer " = 7 karakter)
      const token = authHeader.substring(7).trim();

      // Validasi token tidak kosong
      if (!token) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      // Panggil service untuk logout
      const response = await logoutUser(token);
      return response;
    } catch (error: any) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
  });
