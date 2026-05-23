import { db } from "../db";
import { users, sessions } from "../db/schema";
import { eq } from "drizzle-orm";

export const registerUser = async (data: any) => {
  const { name, email, password } = data;

  // 1. Cek apakah email sudah terdaftar
  const existingUser = await db.select().from(users).where(eq(users.email, email));
  if (existingUser.length > 0) {
    throw new Error("Email sudah terdaftar");
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

export const loginUser = async (data: any) => {
  const { email, password } = data;

  // 1. Cari user berdasarkan email
  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user) {
    throw new Error("Email atau password salah");
  }

  // 2. Verifikasi kecocokan password
  const isMatch = await Bun.password.verify(password, user.password);
  if (!isMatch) {
    throw new Error("Email atau password salah");
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

export const logoutUser = async (token: string) => {
  // 1. Hapus session dari database berdasarkan token
  await db.delete(sessions).where(eq(sessions.token, token));

  // 2. Return response sukses
  return { data: "OK" };
};
