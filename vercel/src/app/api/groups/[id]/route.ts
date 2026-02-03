import { NextResponse } from 'next/server';
import { updateGroup, deleteGroup } from '@/lib/db';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { name } = await request.json();
  const group = await updateGroup(Number(params.id), name);
  return NextResponse.json(group);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await deleteGroup(Number(params.id));
  return NextResponse.json({ success: true });
}
