import { db_find, db_update } from "@/lib/db";
import { getSession } from "@/lib/jwt";
import { NextResponse } from "next/server";

const DB_NAME = "otpa";

export async function GET() {
	try {
		const session = await getSession();
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		// 查找用户
		const user = await db_find(DB_NAME, "users", { username: session.username });
		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		return NextResponse.json({ codes: user.otpSecrets });
	} catch {
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

		// 查找用户
		const user = await db_find(DB_NAME, "users", { id: session.id });
		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		// 新的 OTP 信息
		const newOtpSecret = {
			name: data.account,
			issuer: data.issuer,
			secret: data.secret,
			algorithm: data.algorithm,
			digits: data.digits,
			period: data.period,
		};

		// 更新用户的 OTP 信息
		const updateSuccess = await db_update(DB_NAME, "users", { id: session.id }, {
			$push: {
				otpSecrets: newOtpSecret,
			},
		});

		if (!updateSuccess) {
			return NextResponse.json({ error: "Failed to update OTP information" }, { status: 500 });
		}

		return NextResponse.json({ success: true });
	} catch {
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
