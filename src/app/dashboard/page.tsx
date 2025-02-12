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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import * as otpauth from "otpauth";
import { useEffect, useState } from "react";

const containerVariants = {
	hidden: { opacity: 0 },
	show: {
		opacity: 1,
		transition: {
			staggerChildren: 0.1,
		},
	},
};

const cardVariants = {
	hidden: { opacity: 0, y: 20 },
	show: {
		opacity: 1,
		y: 0,
		transition: {
			type: "spring",
			stiffness: 100,
			damping: 15,
		},
	},
	exit: {
		opacity: 0,
		y: -20,
		transition: {
			duration: 0.2,
		},
	},
};

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
	const [otpType, setOtpType] = useState<"totp" | "hotp">("totp");
	const [error, setError] = useState<string | null>(null); // 新增状态
	const t = useTranslations();

	useEffect(() => {
		const fetchCodes = async () => {
			try {
				const res = await fetch("/api/codes");
				const data = await res.json();

				const processedCodes = data.map((item: { otpUrl: string; type: "totp" | "hotp" }) => {
					const otp = otpauth.URI.parse(item.otpUrl);
					const code = otp.generate();

					return {
						name: otp.label,
						issuer: otp.issuer,
						code,
						timeRemaining: 30 - Math.floor(Date.now() / 1000) % 30,
					};
				});

				setCodes(processedCodes);
			} catch (err) {
				console.error(t("failedToFetchCodes"), err);
			}
		};

		fetchCodes();
		const interval = setInterval(fetchCodes, 1000);
		return () => clearInterval(interval);
	}, [t]);

	const handleCopyCode = (code: string) => {
		navigator.clipboard.writeText(code).then(() => {
			toast({
				title: t("codeCopied"),
				duration: 2000,
			});
		});
	};

	async function handleAddCode(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError(null);

		try {
			const res = await fetch("/api/codes", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					type: otpType,
					otpUrl,
				}),
			});

			if (!res.ok) {
				throw new Error(t("networkRequestFailed", { statusText: res.statusText }));
			}
			setOtpUrl("");
			setShowAddModal(false);
			toast({
				title: t("codeAdded"),
			});
		} catch (err) {
			if (err instanceof Error) {
				switch (err.message) {
					case "Invalid OTPAuth URL":
						setError(t("invalidOtpUrl"));
						break;
					default:
						setError(t("errorOccurred", { message: err.message }));
				}
			} else {
				setError(t("unknownError"));
			}
			console.error(err);
		}
	}

	async function handleLogout() {
		try {
			const res = await fetch("/api/auth/logout", { method: "POST" });
			if (!res.ok) {
				throw new Error(t("logoutFailed", { statusText: res.statusText }));
			}
			router.push("/login");
		} catch (err) {
			setError(t("logoutError"));
			console.error(err);
		}
	}

	return (
		<div className="min-h-screen bg-background dark:bg-slate-900 transition-colors duration-200">
			<header className="bg-card dark:bg-slate-800 shadow-md transition-colors duration-200">
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4"
				>
					<h1 className="text-3xl font-bold text-card-foreground dark:text-white">
						{t("dashboard")}
					</h1>
					<div className="flex items-center space-x-4">
						<Dialog open={showAddModal} onOpenChange={setShowAddModal}>
							<DialogTrigger asChild>
								<Button className="shadow-lg hover:shadow-xl transition-shadow">
									<Icon icon="mingcute:add-line" className="mr-2 h-4 w-4" />
									{t("addCode")}
								</Button>
							</DialogTrigger>
							<DialogContent className="dark:bg-slate-800">
								<DialogHeader>
									<DialogTitle className="dark:text-white">{t("addNewCode")}</DialogTitle>
									<DialogDescription className="dark:text-slate-300">{t("enterOtpUrl")}</DialogDescription>
								</DialogHeader>
								<form onSubmit={handleAddCode}>
									{error && (
										<motion.div
											initial={{ opacity: 0, y: -10 }}
											animate={{ opacity: 1, y: 0 }}
											className="text-red-500 text-sm mb-4"
										>
											{error}
										</motion.div>
									)}
									<div className="mt-4">
										<Label htmlFor="otpType" className="dark:text-white">{t("otpType")}</Label>
										<div className="mt-1">
											<Select
												value={otpType}
												onValueChange={(value: string) => setOtpType(value as "totp" | "hotp")}
											>
												<SelectTrigger className="dark:bg-slate-700 dark:text-white">
													<SelectValue placeholder={t("selectOtpType")} />
												</SelectTrigger>
												<SelectContent className="dark:bg-slate-700">
													<SelectItem value="totp">TOTP</SelectItem>
													<SelectItem value="hotp">HOTP</SelectItem>
												</SelectContent>
											</Select>
										</div>
									</div>
									<div className="mt-4">
										<Label htmlFor="otpUrl" className="dark:text-white">{t("otpLinks")}</Label>
										<Input
											value={otpUrl}
											onChange={e => setOtpUrl(e.target.value)}
											placeholder={t("otpUrlPlaceholder")}
											className="w-full mt-1 dark:bg-slate-700 dark:text-white"
										/>
									</div>
									<DialogFooter className="mt-4">
										<Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
											{t("cancel")}
										</Button>
										<Button type="submit">{t("add")}</Button>
									</DialogFooter>
								</form>
							</DialogContent>
						</Dialog>
						<Button
							variant="destructive"
							onClick={handleLogout}
							className="shadow-lg hover:shadow-xl transition-shadow"
						>
							<Icon icon="mingcute:logout-line" className="mr-2 h-4 w-4" />
							{t("logout")}
						</Button>
					</div>
				</motion.div>
			</header>

			<main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
				<motion.div
					variants={containerVariants}
					initial="hidden"
					animate="show"
					className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
				>
					<AnimatePresence>
						{codes.map(code => (
							<motion.div
								key={code.name}
								variants={cardVariants}
								layout
							>
								<Card className="h-full dark:bg-slate-800 dark:text-white shadow-lg hover:shadow-xl transition-shadow">
									<CardHeader>
										<CardTitle>{code.name}</CardTitle>
										<CardDescription className="dark:text-slate-300">{code.issuer}</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="flex items-center justify-between">
											<div className="text-3xl font-mono tracking-wider">{code.code}</div>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleCopyCode(code.code)}
												className="ml-2"
											>
												<Icon icon="mingcute:copy-line" className="h-4 w-4" />
											</Button>
										</div>
										<div className="mt-4 h-1 bg-secondary dark:bg-slate-700 rounded overflow-hidden">
											<motion.div
												className="h-1 bg-primary rounded"
												initial={{ width: "100%" }}
												animate={{
													width: `${(code.timeRemaining / 30) * 100}%`,
												}}
												transition={{ duration: 1, ease: "linear" }}
											/>
										</div>
									</CardContent>
								</Card>
							</motion.div>
						))}
					</AnimatePresence>
				</motion.div>
			</main>
		</div>
	);
}
