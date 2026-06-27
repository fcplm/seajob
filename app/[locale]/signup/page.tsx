import { SignupForm } from '@/components/auth/signup-form'

export default function SignupPage({ params: { locale } }: { params: { locale: string } }) {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <SignupForm locale={locale} />
    </main>
  )
}
