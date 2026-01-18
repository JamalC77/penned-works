import { NextRequest, NextResponse } from "next/server";
import { ensureEnvLoaded } from "@/lib/env";

ensureEnvLoaded();

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !username.trim()) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    // Check if user exists
    const trimmedUsername = username.trim().toLowerCase();
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.username, trimmedUsername))
      .limit(1);

    if (existingUsers.length === 0) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    const user = existingUsers[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    const session = await getSession();
    session.isLoggedIn = true;
    session.userId = user.id;
    session.username = user.displayName || user.username;
    await session.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
