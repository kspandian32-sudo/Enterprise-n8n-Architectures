import { NextRequest, NextResponse } from "next/server";

const BRIDGE_URL = "http://localhost:11435";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const response = await fetch(BRIDGE_URL + "/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Bridge unreachable", detail: err.message },
      { status: 503 }
    );
  }
}
