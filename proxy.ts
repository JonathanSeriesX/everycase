import { NextResponse, type NextRequest } from "next/server";

// Case-normalising redirects for hand-typed URLs. Case pages are statically
// generated with dynamicParams=false, so /case/mgew4 would 404 at the router
// before any page code runs — the redirect has to happen here. Usernames are
// stored lowercase; SKUs uppercase.
export default function proxy(request: NextRequest) {
  const [, section, slug] = request.nextUrl.pathname.split("/");
  if (!slug) return;

  const canonical =
    section === "case" ? slug.toUpperCase() : slug.toLowerCase();
  if (canonical === slug) return;

  const url = request.nextUrl.clone();
  url.pathname = `/${section}/${canonical}`;
  return NextResponse.redirect(url, 308);
}

export const config = {
  matcher: ["/case/:sku", "/collections/:username"],
};
