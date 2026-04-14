import type { Context } from "https://edge.netlify.com";

const COOKIE_NAME = "aud_ab_id";
const MAX_ID = 100000;
const ONE_YEAR = 60 * 60 * 24 * 365;

export default async function cohort(request: Request, context: Context) {
  const cookies = request.headers.get("cookie") ?? "";
  const hasId = cookies
    .split(";")
    .some((c) => c.trim().startsWith(`${COOKIE_NAME}=`));

  const response = await context.next();

  if (!hasId) {
    const id = Math.floor(Math.random() * MAX_ID);
    response.headers.append(
      "set-cookie",
      `${COOKIE_NAME}=${id}; Path=/; Max-Age=${ONE_YEAR}; SameSite=Lax`,
    );
  }

  return response;
}
