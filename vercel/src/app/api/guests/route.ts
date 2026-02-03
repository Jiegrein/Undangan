import { NextResponse } from 'next/server';
import { getGuests, addGuest, initDb } from '@/lib/db';

export async function GET() {
  await initDb();
  const guests = await getGuests();
  return NextResponse.json(guests);
}

export async function POST(request: Request) {
  const { name, pax, invitedBy } = await request.json();
  const guest = await addGuest(name, pax, invitedBy);
  return NextResponse.json(guest);
}
