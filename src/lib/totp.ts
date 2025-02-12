import { Buffer } from "node:buffer";
import { decode as base32Decode } from "hi-base32";
import { totp } from "otplib";

interface TOTPConfig {
	secret: string;
	algorithm?: "SHA1" | "SHA256" | "SHA512";
	digits?: number;
	period?: number;
}

interface ParsedOTPAuthURL {
	type: string;
	issuer: string;
	account: string;
	secret: string;
	algorithm: string;
	digits: number;
	period: number;
}

export function generateTOTP({
	secret,
	algorithm = "SHA1",
	digits = 6,
	period = 30,
}: TOTPConfig): string {
	totp.options = {
		algorithm,
		digits,
		step: period,
		encoding: "base32",
	};

	// 标准化密钥并解码
	const cleanSecret = secret.replace(/\s+/g, "").toUpperCase();
	const decodedSecret = base32Decode(cleanSecret, false);
	const secretBuffer = Buffer.from(decodedSecret);

	return totp.generate(secretBuffer.toString("base32"));
}

export function parseOTPAuthURL(url: string): ParsedOTPAuthURL {
	const parsedUrl = new URL(url);

	if (parsedUrl.protocol !== "otpauth:") {
		throw new Error("Invalid OTP URL protocol");
	}

	const type = parsedUrl.hostname;
	const params = parsedUrl.searchParams;

	// 解码并解析路径中的label
	const decodedPath = decodeURIComponent(parsedUrl.pathname);
	const [, label] = decodedPath.split(/\/+(.+)/);
	const [issuerFromPath, account] = label?.split(/:(.+)/) || ["", ""];

	// 参数优先级：查询参数 > 路径参数
	const issuer = params.get("issuer") || issuerFromPath;
	const secret = params.get("secret");

	if (!secret) {
		throw new Error("Missing required secret parameter");
	}

	return {
		type,
		issuer,
		account,
		secret,
		algorithm: (params.get("algorithm") || "SHA1").toUpperCase(),
		digits: Number(params.get("digits") || "6"),
		period: Number(params.get("period") || "30"),
	};
}
