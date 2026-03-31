"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GraduationCap, Eye, EyeOff, Loader2, Users, BookOpen } from "lucide-react";

type Role = "student" | "parent";

const grades = [
  "6th Grade", "7th Grade", "8th Grade",
  "9th Grade", "10th Grade", "11th Grade", "12th Grade",
  "College Freshman", "College Sophomore", "College Junior", "College Senior",
];

export default function SignupPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<Role>("student");
  const [fullName, setFullName] = useState("");
  const [grade, setGrade] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          full_name: fullName,
          grade: role === "student" ? grade : null,
        },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/onboarding");
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-3">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
          <p className="text-sm text-slate-500 mt-1">Get started with Lumen</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">

          {/* Step 1 — Role + Name */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  I am a...
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("student")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      role === "student"
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <BookOpen className={`w-6 h-6 ${role === "student" ? "text-indigo-600" : "text-slate-400"}`} />
                    <span className={`text-sm font-semibold ${role === "student" ? "text-indigo-700" : "text-slate-600"}`}>
                      Student
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("parent")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      role === "parent"
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <Users className={`w-6 h-6 ${role === "parent" ? "text-indigo-600" : "text-slate-400"}`} />
                    <span className={`text-sm font-semibold ${role === "parent" ? "text-indigo-700" : "text-slate-600"}`}>
                      Parent
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Full name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={role === "student" ? "e.g. Jordan Harris" : "e.g. Patricia Harris"}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {role === "student" && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Grade
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select your grade</option>
                    {grades.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!fullName || (role === "student" && !grade)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 2 — Email + Password */}
          {step === 2 && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-sm text-slate-500 hover:text-slate-700"
                >
                  ← Back
                </button>
                <span className="text-sm text-slate-400">|</span>
                <span className="text-sm text-slate-600">
                  {role === "student" ? `Student · ${grade}` : "Parent account"}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    minLength={8}
                    required
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-rose-50 border border-rose-200 rounded-lg px-3 py-2.5">
                  <p className="text-sm text-rose-700">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? "Creating account..." : "Create account"}
              </button>

              <p className="text-xs text-slate-400 text-center">
                By signing up you agree to our Terms of Service and Privacy Policy
              </p>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-slate-500 mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-indigo-600 hover:text-indigo-800 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
