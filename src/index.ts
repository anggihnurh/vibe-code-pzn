import { Elysia } from "elysia";
import { db } from "./db";
import { users } from "./db/schema";
import { usersRoutes } from "./routes/users-routes";

const app = new Elysia()
  .get("/", () => ({
    message: "Hello Elysia with Bun, Drizzle, and MySQL!",
    timestamp: new Date().toISOString()
  }))
  .get("/users", async ({ set }) => {
    try {
      const allUsers = await db.select().from(users);
      return allUsers;
    } catch (error: any) {
      set.status = 500;
      return {
        error: "Gagal mengambil data user dari database. Pastikan database MySQL Anda menyala dan konfigurasinya benar.",
        details: error.message || error
      };
    }
  })
  .use(usersRoutes)
  .listen(3000);

console.log(
  `🦊 Server is running at http://${app.server?.hostname}:${app.server?.port}`
);
