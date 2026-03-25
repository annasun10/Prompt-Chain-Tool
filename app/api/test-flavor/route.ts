import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type StepRow = {
  id: number;
  order_by: number;
  description: string | null;
  llm_system_prompt: string | null;
  llm_user_prompt: string | null;
  llm_temperature: number | null;
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, is_superadmin, is_matrix_admin")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    if (!profile.is_superadmin && !profile.is_matrix_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const flavorId = String(formData.get("flavorId") ?? "");

    if (!file || !flavorId) {
      return NextResponse.json(
        { error: "Missing file or flavorId" },
        { status: 400 }
      );
    }

    const { data: stepsData, error: stepsError } = await supabase
      .from("humor_flavor_steps")
      .select(
        "id, order_by, description, llm_system_prompt, llm_user_prompt, llm_temperature"
      )
      .eq("humor_flavor_id", flavorId)
      .order("order_by", { ascending: true });

    if (stepsError) {
      return NextResponse.json(
        { error: stepsError.message },
        { status: 500 }
      );
    }

    const steps: StepRow[] = stepsData ?? [];

    if (steps.length === 0) {
      return NextResponse.json(
        { error: "This flavor has no steps." },
        { status: 400 }
      );
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const jwt = session?.access_token;

    if (!jwt) {
      return NextResponse.json(
        { error: "Missing auth token." },
        { status: 401 }
      );
    }

    // 1) Get presigned upload URL
    const presignRes = await fetch(
      "https://api.almostcrackd.ai/pipeline/generate-presigned-url",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contentType: file.type || "image/jpeg",
        }),
      }
    );

    if (!presignRes.ok) {
      const text = await presignRes.text();
      return NextResponse.json(
        { error: `Presign failed: ${text}` },
        { status: 500 }
      );
    }

    const presignData = await presignRes.json();
    console.log("PRESIGN RESPONSE:", presignData);

    const uploadUrl =
      presignData.presignedUrl ||
      presignData.uploadUrl ||
      presignData.url;

    const fileUrl =
      presignData.cdnUrl ||
      presignData.fileUrl ||
      presignData.publicUrl ||
      presignData.uploadedUrl;

    if (!uploadUrl || !fileUrl) {
      return NextResponse.json(
        { error: "Presign response missing upload URL or file URL." },
        { status: 500 }
      );
    }

    // 2) Upload image bytes
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type || "image/jpeg",
      },
      body: await file.arrayBuffer(),
    });

    if (!uploadRes.ok) {
      const text = await uploadRes.text();
      return NextResponse.json(
        { error: `Image upload failed: ${text}` },
        { status: 500 }
      );
    }

    // 3) Register uploaded image and get imageId
    const registerRes = await fetch(
      "https://api.almostcrackd.ai/pipeline/upload-image-from-url",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: fileUrl,
          isCommonUse: false,
        }),
      }
    );

    if (!registerRes.ok) {
      const text = await registerRes.text();
      return NextResponse.json(
        { error: `Register image failed: ${text}` },
        { status: 500 }
      );
    }

    const registerData = await registerRes.json();
    console.log("REGISTER RESPONSE:", registerData);

    const imageId =
      registerData.imageId ||
      registerData.image_id ||
      registerData.id;

    if (!imageId) {
      return NextResponse.json(
        { error: "Missing imageId from register response." },
        { status: 500 }
      );
    }

    // 4) Generate captions
    const generateRes = await fetch(
      "https://api.almostcrackd.ai/pipeline/generate-captions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageId,
        }),
      }
    );

    if (!generateRes.ok) {
      const text = await generateRes.text();
      return NextResponse.json(
        { error: `Generate captions failed: ${text}` },
        { status: 500 }
      );
    }

    const generateData = await generateRes.json();
    console.log("GENERATE CAPTIONS RESPONSE:", generateData);

    // 5) Read generated captions from Supabase
    const { data: captionsFromDb, error: captionsError } = await supabase
      .from("captions")
      .select("*")
      .eq("image_id", imageId)
      .order("created_datetime_utc", { ascending: false });

    if (captionsError) {
      return NextResponse.json(
        { error: `Error fetching captions from DB: ${captionsError.message}` },
        { status: 500 }
      );
    }

    const captionRows = captionsFromDb ?? [];

    // 6) Prepare output
    const captionTexts = captionRows.map((c: any) => {
      return (
        c.content ??
        c.caption ??
        c.text ??
        c.body ??
        c.caption_text ??
        "(no text)"
      );
    });

    // Since the AlmostCrackd API is generating captions for the image as a whole,
    // we return the saved flavor steps as a readable "chain plan" and the final
    // generated captions as the final output.
    const stepResults = steps.map((step, index) => ({
      stepNumber: index + 1,
      description: step.description || `Step ${index + 1}`,
      output:
        `System Prompt:\n${step.llm_system_prompt || "(none)"}\n\n` +
        `User Prompt:\n${step.llm_user_prompt || "(none)"}\n\n` +
        `Temperature: ${step.llm_temperature ?? 0.7}`,
    }));

    return NextResponse.json({
      imageId,
      imageUrl: fileUrl,
      stepResults,
      finalOutput:
        captionTexts.length > 0
          ? captionTexts.join("\n\n")
          : "No captions were found in the database yet. Try again in a moment.",
      captions: captionRows,
    });
  } catch (error: any) {
    console.error("/api/test-flavor unexpected error:", error);

    return NextResponse.json(
      { error: error?.message || "Unexpected error." },
      { status: 500 }
    );
  }
}