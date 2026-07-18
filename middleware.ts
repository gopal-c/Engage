export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/activity/:path*",
    "/profile/:path*",
    "/admin/:path*",
    "/apps/:path*",
  ],
};
