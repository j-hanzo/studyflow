"use client";

import { GraduationCap, Mail, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-4">
          <GraduationCap className="w-9 h-9 text-white" />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-6 h-6 text-emerald-600" />
          </div>

          <h1 className="text-xl font-bold text-slate-900 mb-2">Check your email</h1>
          <p className="text-sm text-slate-500 leading-relaxed mb-6">
            We sent you a confirmation link. Click it to activate your account and get started with Lumen.
          </p>

          <div className="space-y-2 text-left bg-slate-50 rounded-xl p-4 mb-6">
            {[
              "Add your classes",
              "Capture your first handout",
              "Let AI build your study plan",
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 flex-shrink-0">
                  {i + 1}
                </div>
                <p className="text-sm text-slate-600">{step}</p>
              </div>
            ))}
          </div>

          <Link
            href="/login"
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg text-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            Go to login
          </Link>
        </div>
      </div>
    </div>
  );
}
