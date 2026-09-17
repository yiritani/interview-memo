import { app } from "@/server/app";

const handler = (request: Request) => app.fetch(request);

export const GET = handler;
export const POST = handler;
export const DELETE = handler;
