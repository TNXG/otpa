import { db_find, db_insert, db_read } from "@/lib/db";
import { getSession } from "@/lib/jwt";
import { NextResponse } from "next/server";
import * as otpauth from "otpauth";

const DB_NAME = "otpa";

export async function GET() {
	try {
		const session = await getSession();
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const otpRecords = await db_read(DB_NAME, "OTPS", { username: session.username }, { projection: { data: 1, _id: 0 } });

		// 直接提取 data 字段的值
		const dataValues = otpRecords.map(record => record.data);

		return NextResponse.json(dataValues);
	} catch (error) {
		console.error("GET请求出错:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

export async function POST(request: Request) {
	try {
		const session = await getSession();
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const data = await request.json();

		// 确保用户存在
		const user = await db_find(DB_NAME, "users", { username: session.username });

		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		// 检验otpUrl是否有效
		const otpUrl = otpauth.URI.parse(data.otpUrl);
		if (!otpUrl) {
			return NextResponse.json({ error: "Invalid OTP URL" }, { status: 403 });
		}

		// 插入新的 OTP 记录
		const insertSuccess = await db_insert(DB_NAME, "OTPS", { username: session.username, data });

		if (!insertSuccess) {
			return NextResponse.json({ error: "Failed to save OTP information" }, { status: 500 });
		}

		return NextResponse.json({ success: true });
	} catch {
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
