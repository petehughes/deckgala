import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = process.env.MYCLUB_ACCESS_TOKEN;
  if (!token) {
    return new Response("MYCLUB_ACCESS_TOKEN is not configured", { status: 503 });
  }

  const expectedAuthorization = `Basic ${btoa(`admin:${token}`)}`;
  if (request.headers.get("authorization") !== expectedAuthorization) {
    return new Response("Authentication required", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="DeckGala MyClub"' },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
