import { NextResponse } from "next/server";
import { getRepSession } from "@/lib/auth/session";
import {
  getCallOutcomeForCall,
  submitCallOutcome,
} from "@/lib/outcomes/service";
import { parsePostCallOutcomeInput } from "@/lib/outcomes/validation";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
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

  const { id } = await context.params;
  const result = await getCallOutcomeForCall(id, repSession.organizationId);

  if (!result.ok) {
    const status = result.reason === "forbidden" ? 403 : 404;
    return NextResponse.json({ error: "Outcome not found." }, { status });
  }

  return NextResponse.json({
    callId: result.callId,
    leadId: result.lead.id,
    companyName: result.lead.companyName,
    outcome: result.outcome,
    created: result.created,
  });
}

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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const input = parsePostCallOutcomeInput(body);
  if (!input) {
    return NextResponse.json(
      { error: "Invalid outcome payload. Qualification and next action are required." },
      { status: 400 },
    );
  }

  const { id } = await context.params;
  const result = await submitCallOutcome(id, repSession.organizationId, input);

  if (!result.ok) {
    if (result.reason === "forbidden") {
      return NextResponse.json({ error: "Call not found." }, { status: 403 });
    }
    if (result.reason === "invalid") {
      return NextResponse.json({ error: "Invalid outcome payload." }, { status: 400 });
    }
    if (result.reason === "save_failed") {
      return NextResponse.json({ error: "Unable to save outcome." }, { status: 500 });
    }
    return NextResponse.json({ error: "Call not found." }, { status: 404 });
  }

  return NextResponse.json({
    callId: result.callId,
    leadId: result.lead.id,
    companyName: result.lead.companyName,
    outcome: result.outcome,
    created: result.created,
  });
}
