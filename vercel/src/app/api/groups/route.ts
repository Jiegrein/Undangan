import { NextResponse } from 'next/server';
import { getGroups, createGroup, initDb } from '@/lib/db';

export async function GET() {
  await initDb();
  const groups = await getGroups();
  return NextResponse.json(groups);
}

export async function POST(request: Request) {
  const { name, guestIds } = await request.json();
  const group = await createGroup(name, guestIds);
  return NextResponse.json(group);
}
