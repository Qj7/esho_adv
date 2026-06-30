import { NextRequest } from 'next/server';
import { handleVisit } from '@/lib/visit-handler';

export const dynamic = 'force-dynamic';
export const preferredRegion = ['sin1', 'iad1', 'fra1'];

export async function GET(request: NextRequest) {
  return handleVisit(request);
}
