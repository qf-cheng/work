import { NextRequest, NextResponse } from "next/server";
import { defaultService } from "../../../lib/server/resourceRegistry";

export async function GET(request: NextRequest, { params }: { params: { resource: string } }) {
  const { searchParams } = new URL(request.url);
  const pageNo = Number(searchParams.get("pageNo") ?? 1) || 1;
  const pageSize = Number(searchParams.get("pageSize") ?? 20) || 20;
  const conditionRaw = searchParams.get("condition");
  const condition = conditionRaw ? JSON.parse(conditionRaw) : {};
  const result = defaultService.list(params.resource, pageNo, pageSize, condition);
  return NextResponse.json(result);
}

export async function POST(request: NextRequest, { params }: { params: { resource: string } }) {
  const payload = (await request.json()) as Record<string, unknown>;
  const result = defaultService.create(params.resource, payload);
  return NextResponse.json(result);
}
