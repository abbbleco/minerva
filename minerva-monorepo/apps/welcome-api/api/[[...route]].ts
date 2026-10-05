import { handle } from "hono/vercel";
import { app } from "../src/app.js";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const GET = handle(app);
export const POST = handle(app);
export const OPTIONS = handle(app);
