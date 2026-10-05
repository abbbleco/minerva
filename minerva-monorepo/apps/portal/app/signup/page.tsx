import type { Metadata } from "next";
import AuthCard from "../components/auth-card";

export const metadata: Metadata = { title: "Create account | ABBBLE Portal" };

export default function SignupPage() {
  return <AuthCard mode="signup" />;
}
