import { NextResponse } from 'next/server';
import { checkNeo4jConnection } from '@/lib/ontology';

export async function GET() {
  try {
    const connected = await checkNeo4jConnection();
    return NextResponse.json({ connected, service: 'ontology' });
  } catch {
    return NextResponse.json({ connected: false, service: 'ontology' });
  }
}
