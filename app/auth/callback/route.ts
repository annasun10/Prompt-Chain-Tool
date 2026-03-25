import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  const supabase = await createClient();

  if (!code) {
    return NextResponse.redirect(new URL("/login", origin));
  }

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
    code
  );

  if (exchangeError) {
    return NextResponse.redirect(new URL("/login", origin));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", origin));
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_superadmin, is_matrix_admin")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.redirect(new URL("/not-authorized", origin));
  }

  const isAllowed =
    profile.is_superadmin === true || profile.is_matrix_admin === true;

  if (isAllowed) {
    return NextResponse.redirect(new URL("/flavors", origin));
  }

  return NextResponse.redirect(new URL("/not-authorized", origin));
}