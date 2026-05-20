# Issue: Implementasi Fitur Registrasi Pengguna (User Registration)

## Deskripsi Tugas
Tugas ini bertujuan untuk mengimplementasikan fitur registrasi pengguna baru. Aplikasi ini dibangun menggunakan **Bun**, **ElysiaJS**, dan **Drizzle ORM**.

## Spesifikasi Kebutuhan

### 1. Database (Tabel `users`)
Buat skema tabel `users` pada database dengan spesifikasi berikut:
- `id`: integer, auto increment, primary key
- `name`: varchar(255), not null
- `email`: varchar(255), not null, unique
- `password`: varchar(255), not null (password harus di-hash menggunakan bcrypt)
- `created_at`: timestamp, default current_timestamp

### 2. API Endpoint
Buat endpoint API untuk registrasi pengguna baru:
- **Endpoint**: `POST /api/users`
- **Request Body (JSON)**:
  ```json
  {
      "name": "anggih",
      "email": "anggih@localhost",
      "password": "rahasia"
  }
  ```
- **Response Body (Success)**:
  ```json
  {
      "data" : "OK"
  }
  ```
- **Response Body (Failed - Email sudah terdaftar)**:
  ```json
  {
      "error" : "Email sudah terdaftar"
  }
  ```

### 3. Struktur Folder dan Penamaan File
- **Routes**: Letakkan file route di dalam direktori `src/routes/`. Gunakan penamaan `users-routes.ts`.
- **Services**: Letakkan file business logic di dalam direktori `src/services/`. Gunakan penamaan `users-service.ts`.

---

## Tahapan Implementasi (Langkah-demi-Langkah)

Berikut adalah detail tahapan implementasi yang harus dilakukan beserta contoh kodenya:

### Tahap 1: Mendefinisikan Skema Database (Drizzle ORM)
1. Buka file skema database, misalnya di `src/db/schema.ts` (atau buat jika belum ada).
2. Tambahkan definisi tabel `users`.
**Code Sample (`src/db/schema.ts`):**
```typescript
import { pgTable, serial, varchar, timestamp } from 'drizzle-orm/pg-core';
// Catatan: sesuaikan import dengan dialect database yang digunakan (misal: pg-core, mysql-core, atau sqlite-core)

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(), // Menambahkan unique constraint
  password: varchar('password', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
```

### Tahap 2: Membuat Business Logic di `users-service.ts`
1. Buat file `src/services/users-service.ts`.
2. Buat fungsi `registerUser` yang menerima data dari request, memvalidasi email apakah sudah digunakan, melakukan hash pada password, dan menyimpan data ke database.
**Code Sample (`src/services/users-service.ts`):**
```typescript
import { db } from '../db'; // Sesuaikan path dengan letak inisialisasi Drizzle db
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

export const registerUser = async (data: any) => {
  const { name, email, password } = data;

  // 1. Cek apakah email sudah terdaftar
  const existingUser = await db.select().from(users).where(eq(users.email, email));
  if (existingUser.length > 0) {
    throw new Error('Email sudah terdaftar');
  }

  // 2. Hash password menggunakan bcrypt bawaan Bun
  const hashedPassword = await Bun.password.hash(password, {
    algorithm: "bcrypt",
    cost: 10,
  });

  // 3. Simpan ke database
  await db.insert(users).values({
    name,
    email,
    password: hashedPassword,
  });

  return { data: "OK" };
};
```

### Tahap 3: Membuat Routing di `users-routes.ts`
1. Buat file `src/routes/users-routes.ts`.
2. Definisikan endpoint `POST /api/users` menggunakan instance Elysia.
3. Tangani request body, panggil service `registerUser`, dan kelola format response baik untuk sukses maupun gagal (error).
**Code Sample (`src/routes/users-routes.ts`):**
```typescript
import { Elysia, t } from 'elysia';
import { registerUser } from '../services/users-service';

export const usersRoutes = new Elysia({ prefix: '/api' })
  .post('/users', async ({ body, set }) => {
    try {
      // Panggil service untuk register
      const response = await registerUser(body);
      return response;
    } catch (error: any) {
      // Tangkap error (contoh: email sudah terdaftar)
      set.status = 400; // Bad Request
      return {
        error: error.message
      };
    }
  }, {
    // Opsional: Validasi request body menggunakan Typebox bawaan Elysia
    body: t.Object({
      name: t.String(),
      email: t.String({ format: 'email' }),
      password: t.String()
    })
  });
```

### Tahap 4: Mendaftarkan Route ke Aplikasi Utama (`index.ts`)
1. Buka file utama aplikasi, biasanya `src/index.ts`.
2. Import `usersRoutes` yang telah dibuat dan gunakan (use) pada instance Elysia utama.
**Code Sample (`src/index.ts`):**
```typescript
import { Elysia } from 'elysia';
import { usersRoutes } from './routes/users-routes';

const app = new Elysia()
  .use(usersRoutes)
  .listen(3000);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
```

## Checklist Penyelesaian (DoD - Definition of Done)
- [ ] Tabel `users` telah terbuat dan di-migrate di database.
- [ ] Struktur folder `routes` dan `services` telah dibuat.
- [ ] Endpoint `POST /api/users` berhasil mengembalikan sukses (`{ "data": "OK" }`) dengan data user yang tersimpan di DB.
- [ ] Password di database sudah di-hash menggunakan bcrypt.
- [ ] Endpoint `POST /api/users` berhasil mengembalikan error (`{ "error": "Email sudah terdaftar" }`) jika email yang sama digunakan berulang.
