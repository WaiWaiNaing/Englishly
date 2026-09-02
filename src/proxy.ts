import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  if (!req.auth) {
    return NextResponse.redirect(new URL("/signin", req.nextUrl.origin));
  }
});

export const config = {
  matcher: ["/", "/history"],
};
