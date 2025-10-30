import { NextResponse } from 'next/server';
import { getAllCasesFromCSV, filterCases } from '../../../lib/getCasesFromCSV';

export const runtime = 'nodejs';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const model = searchParams.get('model');
    const material = searchParams.get('material');
    const season = searchParams.get('season');

    const all = getAllCasesFromCSV();
    const data = filterCases(all, { model, material, season });
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
  }
}
