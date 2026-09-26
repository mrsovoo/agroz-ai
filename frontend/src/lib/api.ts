import { NextResponse } from "next/server";

/**
 * API handler'ni o'rab oladi: kutilmagan xato (masalan baza uzilishi) yuz bersa
 * bo'sh 500 o'rniga tushunarli JSON qaytaradi. Client tomoni `res.json()`ni
 * har doim xatosiz o'qiy oladi.
 */
export function withApiErrors(handler: (req: Request) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    try {
      return await handler(req);
    } catch (err) {
      console.error("[api] kutilmagan xatolik:", err);
      return NextResponse.json(
        { error: "Serverda xatolik yuz berdi. Birozdan so'ng qayta urinib ko'ring." },
        { status: 500 },
      );
    }
  };
}
