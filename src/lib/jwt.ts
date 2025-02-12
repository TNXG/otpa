import process from "node:process";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function createToken(payload: any) {
	return await new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setExpirationTime("3d").sign(JWT_SECRET);
}

export async function verifyToken(token: string) {
	try {
		const { payload } = await jwtVerify(token, JWT_SECRET);
		return payload;
	} catch {
		return null;
	}
}

export async function getSession() {
	const token = (await cookies()).get("token")?.value;
	if (!token)
		return null;
	return await verifyToken(token);
}
