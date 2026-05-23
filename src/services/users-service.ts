import { db } from "../db";
import { users, sessions } from "../db/schema";
import { eq } from "drizzle-orm";

interface RegisterUserData {
  name: string;
  email: string;
  password: string;
}

interface LoginUserData {
  email: string;
  password: string;
}

export const registerUser = async (data: RegisterUserData) => {
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

export const loginUser = async (data: LoginUserData) => {
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
  // 1. Cek apakah session dengan token tersebut ada
  const existingSession = await db
    .select()
    .from(sessions)
    .where(eq(sessions.token, token));

  if (existingSession.length === 0) {
    throw new Error("Invalid or expired token");
  }

  // 2. Hapus session dari database
  await db.delete(sessions).where(eq(sessions.token, token));

  // 3. Return response sukses
  return { data: "OK" };
};
