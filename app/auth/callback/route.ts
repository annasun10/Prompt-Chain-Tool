import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  const supabase = await createClient();

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 🔑 get role info from profiles
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("is_superadmin, is_matrix_admin")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    return NextResponse.redirect(new URL("/not-authorized", request.url));
  }

  const isAllowed =
    profile.is_superadmin === true || profile.is_matrix_admin === true;

  if (isAllowed) {
    return NextResponse.redirect(new URL("/flavors", request.url));
  }

  return NextResponse.redirect(new URL("/not-authorized", request.url));
}