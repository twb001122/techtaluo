import { isAdminRequest, unauthorized } from "@/lib/admin";
import { seedCards } from "@/lib/card-store";

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return unauthorized();
  const count = await seedCards();
  return Response.json({ count, message: `已初始化 ${count} 张科技塔罗牌。` });
}
