"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { generateTOTP, parseOTPAuthURL } from "@/lib/totp";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardPage() {
	const router = useRouter();
	const [codes, setCodes] = useState<
		Array<{
			name: string;
			issuer: string;
			code: string;
			timeRemaining: number;
		}>
	>([]);
	const [showAddModal, setShowAddModal] = useState(false);
	const [otpUrl, setOtpUrl] = useState("");
	const t = useTranslations();

	useEffect(() => {
		const fetchCodes = async () => {
			const res = await fetch("/api/codes");
			const data = await res.json();

			setCodes(
				data.codes.map((code: any) => ({
					...code,
					code: generateTOTP(code.secret, code.algorithm, code.digits, code.period),
					timeRemaining: code.period - (Math.floor(Date.now() / 1000) % code.period),
				})),
			);
		};

		fetchCodes();
		const interval = setInterval(fetchCodes, 1000);
		return () => clearInterval(interval);
	}, []);

	async function handleAddCode(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		try {
			const parsed = parseOTPAuthURL(otpUrl);
			await fetch("/api/codes", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(parsed),
			});
			setOtpUrl("");
			setShowAddModal(false);
		} catch (err) {
			console.error(err);
		}
	}

	async function handleLogout() {
		await fetch("/api/auth/logout", { method: "POST" });
		router.push("/login");
	}

	return (
		<div className="min-h-screen bg-background">
			<header className="bg-card shadow">
				<div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
					<h1 className="text-3xl font-bold text-card-foreground">{t("dashboard")}</h1>
					<div className="flex items-center space-x-4">
						<Dialog open={showAddModal} onOpenChange={setShowAddModal}>
							<DialogTrigger asChild>
								<Button>
									<Icon icon="mingcute:add-line" className="mr-2 h-4 w-4" />
									{t("addCode")}
								</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>{t("addNewCode")}</DialogTitle>
									<DialogDescription>Enter the OTP URL to add a new code.</DialogDescription>
								</DialogHeader>
								<form onSubmit={handleAddCode}>
									<Input
										value={otpUrl}
										onChange={e => setOtpUrl(e.target.value)}
										placeholder="otpauth:// URL"
										className="w-full mt-4"
									/>
									<DialogFooter className="mt-4">
										<Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
											{t("cancel")}
										</Button>
										<Button type="submit">{t("add")}</Button>
									</DialogFooter>
								</form>
							</DialogContent>
						</Dialog>
						<Button variant="destructive" onClick={handleLogout}>
							<Icon icon="mingcute:logout-line" className="mr-2 h-4 w-4" />
							{t("logout")}
						</Button>
					</div>
				</div>
			</header>

			<main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{codes.map(code => (
						<Card key={code.name}>
							<CardHeader>
								<CardTitle>{code.name}</CardTitle>
								<CardDescription>{code.issuer}</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="text-3xl font-mono tracking-wider">{code.code}</div>
								<div className="mt-2 h-1 bg-secondary rounded">
									<div
										className="h-1 bg-primary rounded transition-all duration-1000"
										style={{
											width: `${(code.timeRemaining / 30) * 100}%`,
										}}
									/>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</main>
		</div>
	);
}
