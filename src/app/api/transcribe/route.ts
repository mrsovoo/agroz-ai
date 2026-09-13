import { NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/ai";
import { getCurrentUser } from "@/lib/session";
import { clientIp } from "@/lib/validate";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { MAX_AUDIO_BYTES } from "@/lib/constants";
import { withApiErrors } from "@/lib/api";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const POST = withApiErrors(async (req: Request) => {
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
  if (file.size > MAX_AUDIO_BYTES) {
    return NextResponse.json(
      { ok: false, text: "", error: "Audio juda katta (8 MB dan oshmasin)" },
      { status: 413 },
    );
  }

  const user = await getCurrentUser();
  const limiterKey = user ? `stt:user:${user.id}` : `stt:ip:${clientIp(req)}`;
  const limit = rateLimit(limiterKey, 30, 60 * 60 * 1000);
  if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds);

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
});
