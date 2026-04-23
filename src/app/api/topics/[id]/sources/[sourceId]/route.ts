import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { deleteSource } from "@/lib/db/queries";

// DELETE /api/topics/[id]/sources/[sourceId] — remove a source
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; sourceId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, sourceId } = await params;
  await deleteSource(id, sourceId);
  return NextResponse.json({ ok: true });
}