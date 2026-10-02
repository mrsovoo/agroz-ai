import { redirect } from "next/navigation";

export default async function AgroMahsulotRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dori/${id}`);
}
