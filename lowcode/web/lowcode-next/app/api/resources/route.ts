import { NextResponse } from "next/server";
import { defaultRegistry } from "../../../lib/server/resourceRegistry";

export async function GET() {
  return NextResponse.json({ resources: defaultRegistry.list() });
}
