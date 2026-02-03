import { NextResponse } from 'next/server';
import { updateGuest, deleteGuest } from '@/lib/db';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { name, pax, invitedBy } = await request.json();
  const guest = await updateGuest(Number(params.id), name, pax, invitedBy);
  return NextResponse.json(guest);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await deleteGuest(Number(params.id));
  return NextResponse.json({ success: true });
}
