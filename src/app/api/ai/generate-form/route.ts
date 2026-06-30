import { createClient } from "@/lib/supabase/server";
import { checkAiFormLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate Limiting
    const limitStatus = await checkAiFormLimit(user.id);
    if (!limitStatus.allowed) {
      return NextResponse.json(
        { error: "Daily AI Form limit exceeded. Try again tomorrow." },
        { status: 429 }
      );
    }

    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Invalid prompt" }, { status: 400 });
    }

    // Generate Form Object via Gemini
    const { object } = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: z.object({
        fields: z.array(z.object({
          id: z.string(),
          type: z.enum(["text", "long_text", "number", "email", "phone", "dropdown", "checkbox", "radio", "file_upload", "date", "time", "rating", "linear_scale", "section_divider", "page_break", "checkbox_grid"]),
          label: z.string(),
          placeholder: z.string().describe("Use empty string if not applicable"),
          description: z.string().describe("Use empty string if not applicable"),
          required: z.boolean(),
          locked: z.boolean(),
          options: z.string().describe("Comma separated options for choice fields. Use empty string if not applicable"),
        }))
      }),
      prompt: `You are an expert form designer. The user wants to create a form for the following purpose: "${prompt}".
Generate a list of appropriate form fields. Keep the total number of fields between 3 and 10.
Make sure field 'id's are snake_case and unique.
For 'dropdown', 'radio', or 'checkbox' types, provide 'options' as a comma-separated string.
Always set 'locked' to false.`,
    });

    return NextResponse.json({ fields: object.fields, remaining: limitStatus.remaining });

  } catch (error) {
    console.error("AI Generate Form Error:", error);
    return NextResponse.json(
      { error: "Failed to generate form. Please check your API key or try again later." },
      { status: 500 }
    );
  }
}
