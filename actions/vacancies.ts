'use server'

export async function applyToVacancy(
  _vacancyId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  return { ok: false, error: 'not_implemented' }
}
