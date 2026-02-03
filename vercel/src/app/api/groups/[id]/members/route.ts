import { NextResponse } from 'next/server';
import { addGuestsToGroup, removeGuestsFromGroup } from '@/lib/db';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { guestIds } = await request.json();
  const members = await addGuestsToGroup(Number(params.id), guestIds);
  return NextResponse.json(members);
}

export async function DELETE(request: Request) {
  const { guestIds } = await request.json();
  await removeGuestsFromGroup(guestIds);
  return NextResponse.json({ success: true });
}
