import { NextResponse } from "next/server";
import { getRepSession } from "@/lib/auth/session";
import { getGuidanceForCall } from "@/lib/intelligence/guidance";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type GuidanceRequestBody = {
  repNotes?: string;
  objection?: string;
};

export async function POST(request: Request, context: RouteContext) {
  if (!getSupabasePublicEnv().ok) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const repSession = await getRepSession();
  if (!repSession) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let body: GuidanceRequestBody = {};
  try {
    body = (await request.json()) as GuidanceRequestBody;
  } catch {
    body = {};
  }

  const { id } = await context.params;
  const result = await getGuidanceForCall(id, repSession.organizationId, {
    repNotes: body.repNotes,
    objection: body.objection,
  });

  if (!result.ok) {
    const status = result.reason === "forbidden" ? 403 : 404;
    return NextResponse.json({ error: "Call not found." }, { status });
  }

  return NextResponse.json({
    callId: result.callId,
    leadId: result.lead.id,
    companyName: result.lead.companyName,
    guidance: result.guidance,
  });
}
