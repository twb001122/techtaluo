export function isAdminRequest(request: Request) {
  const expected = process.env.ADMIN_KEY ?? "techtaluo";
  return request.headers.get("x-admin-key") === expected;
}

export function unauthorized() {
  return Response.json({ error: "未授权，请提供正确的管理员密钥。" }, { status: 401 });
}
