# Issue: Implementasi Fitur Login Pengguna (User Login)

## Deskripsi Tugas
Tugas ini bertujuan untuk mengimplementasikan fitur login bagi pengguna yang sudah terdaftar. Aplikasi ini dibangun menggunakan **Bun**, **ElysiaJS**, dan **Drizzle ORM**.

## Spesifikasi Kebutuhan

### 1. Database (Tabel `sessions`)
Buat skema tabel `sessions` pada database dengan spesifikasi berikut:
- `id`: integer, auto increment, primary key
- `token`: varchar(255), not null (berisi UUID unik untuk token sesi user)
- `user_id`: integer, not null (foreign key yang mereferensi ke kolom `id` di tabel `users`)
- `created_at`: timestamp, default current_timestamp

### 2. API Endpoint
Buat endpoint API untuk login pengguna:
- **Endpoint**: `POST /api/users/login`
- **Request Body (JSON)**:
  ```json
  {
      "email": "anggih@localhost",
      "password": "rahasia"
  }
  ```
- **Response Body (Success)**:
  ```json
  {
      "data": "token_uuid_disini"
  }
  ```
- **Response Body (Failed - Email atau password salah)**:
  ```json
  {
      "error": "Email atau password salah"
  }
  ```

### 3. Struktur Folder dan Penamaan File
- **Routes**: Terletak di direktori `src/routes/`. Gunakan (atau modifikasi) file `users-routes.ts`.
- **Services**: Terletak di direktori `src/services/`. Gunakan (atau modifikasi) file `users-service.ts`.

---

## Tahapan Implementasi (Langkah-demi-Langkah)

Berikut adalah tahapan implementasi mendetail beserta contoh kode untuk memandu pembuatan fitur:

### Tahap 1: Menambahkan Skema Tabel `sessions` (Drizzle ORM)
1. Buka file skema database di `src/db/schema.ts`.
2. Tambahkan definisi tabel `sessions` yang memiliki relasi foreign key ke tabel `users`.
**Code Sample (`src/db/schema.ts`):**
```typescript
import { mysqlTable, serial, varchar, timestamp, int } from 'drizzle-orm/mysql-core';

// (Asumsi tabel users sudah ada)
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tambahkan tabel sessions
export const sessions = mysqlTable("sessions", {
  id: serial("id").primaryKey(),
  token: varchar("token", { length: 255 }).notNull(), // Menyimpan UUID
  userId: int("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});
```

### Tahap 2: Membuat Business Logic Login di `users-service.ts`
1. Buka file `src/services/users-service.ts`.
2. Buat fungsi `loginUser` yang menerima input email dan password.
3. Cari user berdasarkan email. Jika tidak ditemukan, kembalikan (throw) error.
4. Verifikasi kecocokan password menggunakan `Bun.password.verify`. Jika tidak cocok, kembalikan error.
5. Buat token berupa UUID menggunakan `crypto.randomUUID()`.
6. Simpan token tersebut ke dalam tabel `sessions` beserta ID milik user tersebut.
**Code Sample (`src/services/users-service.ts`):**
```typescript
import { db } from '../db';
import { users, sessions } from '../db/schema';
import { eq } from 'drizzle-orm';

export const loginUser = async (data: any) => {
  const { email, password } = data;

  // 1. Cari user berdasarkan email
  const userRecords = await db.select().from(users).where(eq(users.email, email));
  if (userRecords.length === 0) {
    throw new Error('Email atau password salah');
  }

  const user = userRecords[0];

  // 2. Verifikasi kecocokan password
  const isMatch = await Bun.password.verify(password, user.password);
  if (!isMatch) {
    throw new Error('Email atau password salah');
  }

  // 3. Generate UUID untuk token sesi
  const token = crypto.randomUUID();

  // 4. Simpan token sesi ke database
  await db.insert(sessions).values({
    token,
    userId: user.id,
  });

  return { data: token };
};
```

### Tahap 3: Menambahkan Route Login di `users-routes.ts`
1. Buka file `src/routes/users-routes.ts`.
2. Tambahkan endpoint `POST /login` di dalam rangkaian (chain) Elysia yang menangani `/api/users`.
**Code Sample (`src/routes/users-routes.ts`):**
```typescript
import { Elysia, t } from 'elysia';
import { loginUser } from '../services/users-service';

// Sesuaikan prefix jika sebelumnya sudah di-set
export const usersRoutes = new Elysia({ prefix: '/api/users' })
  // .post('/', ...) <-- (contoh: route registrasi yang sudah ada)

  // Tambahkan endpoint login
  .post('/login', async ({ body, set }) => {
    try {
      const response = await loginUser(body);
      return response;
    } catch (error: any) {
      set.status = 401; // Unauthorized
      return {
        error: "Email atau password salah"
      };
    }
  }, {
    body: t.Object({
      email: t.String(),
      password: t.String()
    })
  });
```

### Tahap 4: Mengaplikasikan Skema Database
Pastikan tabel `sessions` yang baru saja ditambahkan di dalam skema berhasil di-push ke database MySQL:
```bash
bun run db:push
```

## Checklist Penyelesaian (DoD - Definition of Done)
- [ ] Tabel `sessions` telah terbuat di dalam database MySQL dengan relasi Foreign Key yang benar.
- [ ] Logic `loginUser` diimplementasikan dengan benar (termasuk verifikasi hash bcrypt dan pembuatan token UUID).
- [ ] Endpoint `POST /api/users/login` berhasil memberikan respon `{"data": "<token>"}` ketika login sukses.
- [ ] Endpoint `POST /api/users/login` mengembalikan `{ "error": "Email atau password salah" }` ketika login gagal (karena salah password atau email tak terdaftar).
