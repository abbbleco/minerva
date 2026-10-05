import type { Metadata } from "next";
import AuthCard from "../components/auth-card";

export const metadata: Metadata = { title: "Sign in | ABBBLE Portal" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  return <AuthCard mode="login" authError={error} next={next} />;
}
