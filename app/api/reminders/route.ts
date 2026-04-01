import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// This endpoint is called daily by GitHub Actions cron.
// It finds assignments due in the next 1–3 days and sends reminder emails.
//
// Required env vars:
//   SUPABASE_SERVICE_ROLE_KEY  — service role key (bypasses RLS)
//   NEXT_PUBLIC_SUPABASE_URL   — already in your .env
//   RESEND_API_KEY             — from resend.com dashboard
//   REMINDER_SECRET            — any random string, used to authenticate the cron request
//   NEXT_PUBLIC_APP_URL        — e.g. https://studyflow-ashy-eight.vercel.app

export async function POST(req: NextRequest) {
  // ── Authenticate the cron caller ──────────────────────────────────
  const authHeader = req.headers.get("authorization");
  const secret = process.env.REMINDER_SECRET;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const resendKey   = process.env.RESEND_API_KEY!;
  const appUrl      = process.env.NEXT_PUBLIC_APP_URL ?? "https://studyflow-ashy-eight.vercel.app";

  if (!serviceKey || !resendKey) {
    return NextResponse.json({ error: "Missing env vars" }, { status: 500 });
  }

  // ── Service-role Supabase client (bypasses RLS) ───────────────────
  const db = createClient(supabaseUrl, serviceKey);

  // ── Date window: today through 3 days from now ────────────────────
  const today    = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const plusThree = new Date(today);
  plusThree.setDate(today.getDate() + 3);
  const plusThreeStr = plusThree.toISOString().split("T")[0];

  // ── Fetch upcoming, incomplete assignments ────────────────────────
  const { data: assignments, error: assignErr } = await db
    .from("assignments")
    .select("*, classes(name, color), profiles!student_id(full_name, id)")
    .eq("completed", false)
    .gte("due_date", todayStr)
    .lte("due_date", plusThreeStr)
    .order("due_date", { ascending: true });

  if (assignErr) {
    console.error("reminders: assignment fetch error", assignErr);
    return NextResponse.json({ error: assignErr.message }, { status: 500 });
  }

  if (!assignments || assignments.length === 0) {
    return NextResponse.json({ sent: 0, message: "No upcoming assignments" });
  }

  // ── Group by student ──────────────────────────────────────────────
  const byStudent = new Map<string, { name: string; email?: string; items: typeof assignments }>();
  const studentIds = [...new Set(assignments.map((a) => a.student_id as string))];

  // Fetch auth emails via service role
  const { data: users } = await db.auth.admin.listUsers();
  const emailMap = new Map<string, string>();
  for (const u of users?.users ?? []) {
    if (u.email) emailMap.set(u.id, u.email);
  }

  for (const a of assignments) {
    const sid = a.student_id as string;
    if (!byStudent.has(sid)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prof = a.profiles as any;
      byStudent.set(sid, {
        name:  prof?.full_name ?? "Student",
        email: emailMap.get(sid),
        items: [],
      });
    }
    byStudent.get(sid)!.items.push(a);
  }

  // ── Send one digest email per student ─────────────────────────────
  const resend = new Resend(resendKey);
  let sent = 0;
  const errors: string[] = [];

  for (const [, student] of byStudent) {
    if (!student.email) continue;

    const assignmentRows = student.items
      .map((a) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cls     = (a.classes as any)?.name ?? "Unknown class";
        const due     = new Date(a.due_date + "T00:00:00");
        const dueStr  = due.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
        const daysLeft = Math.ceil((due.getTime() - today.setHours(0,0,0,0)) / 86400000);
        const urgency  = daysLeft === 0 ? "⚠️ Due TODAY" : daysLeft === 1 ? "⏰ Due tomorrow" : `📅 Due in ${daysLeft} days`;
        return `
          <tr>
            <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;">
              <strong style="color:#1e293b;">${a.title}</strong>
              <br/><span style="font-size:12px;color:#64748b;">${cls}</span>
            </td>
            <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;white-space:nowrap;">
              <span style="font-size:13px;color:#475569;">${dueStr}</span>
            </td>
            <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;white-space:nowrap;">
              <span style="font-size:12px;font-weight:600;color:${daysLeft === 0 ? "#dc2626" : daysLeft === 1 ? "#d97706" : "#4f46e5"};">
                ${urgency}
              </span>
            </td>
          </tr>`;
      })
      .join("");

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#4f46e5,#6366f1);padding:28px 32px;">
      <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">📚 Lumen</p>
      <p style="margin:6px 0 0;font-size:14px;color:#c7d2fe;">Your upcoming assignment reminder</p>
    </div>

    <!-- Body -->
    <div style="padding:28px 32px;">
      <p style="margin:0 0 6px;font-size:16px;color:#1e293b;">Hey ${student.name.split(" ")[0]},</p>
      <p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.6;">
        You have <strong>${student.items.length} assignment${student.items.length > 1 ? "s" : ""}</strong> coming up in the next 3 days. Stay on top of it — you've got this! 💪
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
        <thead>
          <tr style="background:#f8fafc;">
            <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;">Assignment</th>
            <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;">Due</th>
            <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;">Status</th>
          </tr>
        </thead>
        <tbody>${assignmentRows}</tbody>
      </table>

      <div style="margin-top:24px;text-align:center;">
        <a href="${appUrl}/calendar"
           style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:600;">
          View your calendar →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;padding:16px 32px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#94a3b8;">
        Sent by Lumen · <a href="${appUrl}" style="color:#6366f1;text-decoration:none;">Open app</a>
      </p>
    </div>
  </div>
</body>
</html>`;

    try {
      await resend.emails.send({
        from: "Lumen <reminders@lumen.study>",
        to:   student.email,
        subject: `📚 You have ${student.items.length} assignment${student.items.length > 1 ? "s" : ""} due soon`,
        html,
      });
      sent++;
    } catch (e) {
      errors.push(`${student.email}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return NextResponse.json({
    sent,
    total: byStudent.size,
    errors: errors.length ? errors : undefined,
  });
}
