import { NextResponse } from "next/server";

// Receives CSP violation reports (see the CSP block in next.config.ts) and
// echoes them into the function logs, which is where Vercel's dashboard
// (project → Logs) picks them up. Browsers post two dialects: the legacy
// report-uri shape { "csp-report": {...} } and the Reporting API shape
// [{ type: "csp-violation", body: {...} }, …] — normalise both.

const MAX_BODY_BYTES = 16_384;

type Dict = Record<string, unknown>;

const compact = (report: Dict) => ({
  directive: report["violated-directive"] ?? report.effectiveDirective,
  blocked: report["blocked-uri"] ?? report.blockedURL,
  page: report["document-uri"] ?? report.documentURL,
  source: report["source-file"] ?? report.sourceFile,
  line: report["line-number"] ?? report.lineNumber,
  sample: report["script-sample"] ?? report.sample,
});

export async function POST(request: Request) {
  const raw = await request.text();
  if (!raw || raw.length > MAX_BODY_BYTES) {
    return new NextResponse(null, { status: 204 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const reports: Dict[] = Array.isArray(parsed)
    ? parsed.map((entry) => (entry?.body ?? entry) as Dict)
    : [((parsed as Dict)?.["csp-report"] ?? parsed) as Dict];

  for (const report of reports) {
    if (report && typeof report === "object") {
      console.warn("[csp-report]", JSON.stringify(compact(report)));
    }
  }
  return new NextResponse(null, { status: 204 });
}
