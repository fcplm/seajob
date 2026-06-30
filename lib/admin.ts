export function isAdmin(email: string | undefined | null): boolean {
  return !!email && email === process.env.ADMIN_EMAIL
}
