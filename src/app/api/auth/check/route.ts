import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  try {
    const session = await getSession();
    return NextResponse.json({
      authenticated: session.isLoggedIn === true,
      username: session.username || null
    });
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json({ authenticated: false, username: null });
  }
}
