import { NextResponse, type NextRequest } from "next/server";

// Canonicalise hand-typed URLs before routing. Usernames are stored lowercase;
// catalogue SKUs are uppercase.
export default function proxy(request: NextRequest) {
  const [, section, slug] = request.nextUrl.pathname.split("/");
  if (!slug) return;

  const canonical =
    section === "case" ? slug.toUpperCase() : slug.toLowerCase();
  if (canonical !== slug) {
    const url = request.nextUrl.clone();
    url.pathname = `/${section}/${canonical}`;
    return NextResponse.redirect(url, 308);
  }
}

export const config = {
  matcher: ["/case/:sku", "/collections/:username"],
};
