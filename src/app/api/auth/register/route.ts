import { db_find, db_insert } from "@/lib/db";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

// 数据库名称和集合名称
const DB_NAME = "otpa";
const COLLECTION_NAME = "users";

export async function POST(request: Request) {
	try {
		const { username, password } = await request.json();

		// 检查用户是否已存在
		const existingUser = await db_find(DB_NAME, COLLECTION_NAME, { username });
		if (existingUser) {
			return NextResponse.json({ error: "Username already exists" }, { status: 400 });
		}

		// 哈希密码
		const hashedPassword = await hash(password, 12);

		// 创建新用户
		const newUser = {
			username,
			password: hashedPassword,
		};

		// 插入新用户
		const insertSuccess = await db_insert(DB_NAME, COLLECTION_NAME, newUser);
		if (!insertSuccess) {
			return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
		}

		return NextResponse.json({ success: true });
	} catch {
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
