import { getSession } from "@/lib/jwt";
import { redirect } from "next/navigation";

export default async function HomePage() {
	const session = await getSession();
	redirect(session ? "/dashboard" : "/login");
}
