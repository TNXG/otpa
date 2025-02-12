import process from "node:process";
import { db_find } from "@/lib/db";
import { createToken } from "@/lib/jwt";
import { compare } from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// 数据库名称和集合名称
const DB_NAME = "otpa";
const COLLECTION_NAME = "users";

export async function POST(request: Request) {
	try {
		const { username, password } = await request.json();

		// 查找用户
		const user = await db_find(DB_NAME, COLLECTION_NAME, { username });

		if (!user || !(await compare(password, user.password))) {
			return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
		}

		const token = await createToken({ id: user._id, username: user.username });
		(await cookies()).set("token", token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 60 * 60 * 24 * 3, // 3 days
		});

		return NextResponse.json({ success: true });
	} catch {
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
