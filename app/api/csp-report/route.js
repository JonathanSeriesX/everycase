export const runtime = 'edge';

export async function POST(request) {
  try {
    const report = await request.json();
    // Intentionally log to help diagnose CSP violations during development.
    console.log('CSP Report:', report);
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error processing CSP report:', error);
    return new Response('Error processing report', { status: 500 });
  }
}

