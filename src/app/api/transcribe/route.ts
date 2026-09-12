import { NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/ai";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, text: "", error: "Audio topilmadi" }, { status: 400 });
  }
  const file = form.get("audio");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ ok: false, text: "", error: "Audio topilmadi" }, { status: 400 });
  }
  try {
    const text = await transcribeAudio(file);
    if (!text) {
      return NextResponse.json({
        ok: false,
        text: "",
        note: "Ovozni matnga o'girish xizmati hozir mavjud emas. Iltimos, muammoni qisqacha yozing.",
      });
    }
    return NextResponse.json({ ok: true, text });
  } catch {
    return NextResponse.json({
      ok: false,
      text: "",
      note: "Ovozni qayta ishlab bo'lmadi. Iltimos, muammoni yozib yuboring.",
    });
  }
}
