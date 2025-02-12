"use client";

import type React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginForm() {
	const router = useRouter();
	const [error, setError] = useState("");
	const t = useTranslations();

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);

		try {
			const res = await fetch("/api/auth/login", {
				method: "POST",
				body: JSON.stringify({
					username: formData.get("username"),
					password: formData.get("password"),
				}),
				headers: {
					"Content-Type": "application/json",
				},
			});

			if (!res.ok)
				throw new Error(t("invalidCredentials"));

			router.push("/dashboard");
		} catch {
			setError(t("invalidCredentials"));
		}
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-background">
			<Card className="w-[350px]">
				<CardHeader>
					<div className="flex justify-between items-center">
						<CardTitle>{t("signIn")}</CardTitle>
					</div>
					<CardDescription>
						{t("needAccount")}
						{" "}
						<Link href="/register" className="text-primary hover:underline">
							{t("register")}
						</Link>
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit}>
						<div className="grid w-full items-center gap-4">
							<div className="flex flex-col space-y-1.5">
								<Label htmlFor="username">{t("username")}</Label>
								<Input id="username" name="username" placeholder={t("username")} required />
							</div>
							<div className="flex flex-col space-y-1.5">
								<Label htmlFor="password">{t("password")}</Label>
								<Input id="password" name="password" type="password" placeholder={t("password")} required />
							</div>
						</div>
						{error && <p className="text-sm text-destructive mt-2">{error}</p>}
						<Button className="w-full mt-4" type="submit">
							<Icon icon="mingcute:user-lock-line" className="mr-2 h-4 w-4" />
							{" "}
							{t("login")}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
