import type { Metadata } from "next";
import AuthCard from "../components/auth-card";

export const metadata: Metadata = { title: "Create account | ABBBLE Portal" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  return <AuthCard mode="signup" authError={error} next={next} />;
}
