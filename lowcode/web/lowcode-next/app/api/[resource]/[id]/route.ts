import { NextRequest, NextResponse } from "next/server";
import { defaultService } from "../../../../lib/server/resourceRegistry";

export async function GET(_: NextRequest, { params }: { params: { resource: string; id: string } }) {
  const result = defaultService.detail(params.resource, params.id);
  return NextResponse.json(result);
}

export async function PATCH(request: NextRequest, { params }: { params: { resource: string; id: string } }) {
  const payload = (await request.json()) as Record<string, unknown>;
  const result = defaultService.update(params.resource, params.id, payload);
  return NextResponse.json(result);
}

export async function DELETE(_: NextRequest, { params }: { params: { resource: string; id: string } }) {
  const result = defaultService.remove(params.resource, params.id);
  return NextResponse.json(result);
}
