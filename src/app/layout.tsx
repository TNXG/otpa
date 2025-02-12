import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { Favicon } from "@/components/ui/favicon";
import { Toaster } from "@/components/ui/toaster";
import { NextIntlClientProvider } from "next-intl";

import { getLocale, getMessages } from "next-intl/server";

import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
	return {
		title: "OTPA - OTP Authenticator",
		description: "Secure OTP authentication management",
	};
}

export async function RootLayout({ children }: { children: React.ReactNode }) {
	const locale = await getLocale();
	const messages = await getMessages();

	return (
		<html lang={locale} suppressHydrationWarning>
			<head>
				<Favicon />
			</head>
			<body>
				<ThemeProvider attribute={["class", "data-theme"]} defaultTheme="system" enableSystem storageKey="theme" disableTransitionOnChange={true}>
					<NextIntlClientProvider messages={messages}>
						{children}
					</NextIntlClientProvider>
				</ThemeProvider>
				<Toaster />
			</body>
		</html>
	);
}

export default RootLayout;
