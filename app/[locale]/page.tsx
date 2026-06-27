import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import type { Metadata } from 'next'

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'hero' })
  return { title: `SeaJob — ${t('headline')}`, description: t('subheadline') }
}

function HeroSection({ locale }: { locale: string }) {
  const t = useTranslations('hero')
  return (
    <section className="py-24 px-4 text-center bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto max-w-3xl">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">{t('headline')}</h1>
        <p className="text-xl text-muted-foreground mb-10">{t('subheadline')}</p>
        <Link href={`/${locale}/signup`}>
          <Button size="lg" className="text-base px-8">{t('cta')}</Button>
        </Link>
      </div>
    </section>
  )
}

function HowItWorksSection() {
  const t = useTranslations('howItWorks')
  const steps = [
    { num: '01', title: t('step1Title'), desc: t('step1Desc') },
    { num: '02', title: t('step2Title'), desc: t('step2Desc') },
    { num: '03', title: t('step3Title'), desc: t('step3Desc') },
  ]
  return (
    <section className="py-20 px-4" id="how-it-works">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">{t('title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((s) => (
            <div key={s.num} className="flex flex-col items-center text-center gap-3">
              <span className="text-5xl font-bold text-muted-foreground/30">{s.num}</span>
              <h3 className="font-semibold text-lg">{s.title}</h3>
              <p className="text-muted-foreground text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FeaturesSection() {
  const t = useTranslations('features')
  const features = [
    { title: t('resumeTitle'), desc: t('resumeDesc'), icon: '📄' },
    { title: t('vacanciesTitle'), desc: t('vacanciesDesc'), icon: '🔍' },
    { title: t('senderTitle'), desc: t('senderDesc'), icon: '📧' },
  ]
  return (
    <section className="py-20 px-4 bg-muted/30" id="features">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">{t('title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f) => (
            <Card key={f.title}>
              <CardHeader>
                <div className="text-4xl mb-2">{f.icon}</div>
                <CardTitle>{f.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

function FleetsSection() {
  const t = useTranslations('fleets')
  const fleets = [
    { key: 'merchant', icon: '🚢' },
    { key: 'tanker', icon: '🛢️' },
    { key: 'offshore', icon: '⚓' },
    { key: 'cruise', icon: '🛳️' },
  ] as const
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto text-center">
        <h2 className="text-3xl font-bold mb-12">{t('title')}</h2>
        <div className="flex flex-wrap justify-center gap-6">
          {fleets.map((f) => (
            <div key={f.key} className="flex flex-col items-center gap-2 p-6 rounded-xl border bg-card w-36">
              <span className="text-4xl">{f.icon}</span>
              <span className="font-medium">{t(f.key)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function PricingSection() {
  const t = useTranslations('pricing')
  const tiers = [
    { key: 'free' as const, price: '$0', highlight: false },
    { key: 'pro' as const, price: '$19/mo', highlight: true },
    { key: 'enterprise' as const, price: '$49/mo', highlight: false },
  ]
  return (
    <section className="py-20 px-4 bg-muted/30" id="pricing">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">{t('title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {tiers.map((tier) => (
            <Card key={tier.key} className={tier.highlight ? 'border-primary shadow-lg' : ''}>
              <CardHeader>
                {tier.highlight && <Badge className="w-fit mb-2">Popular</Badge>}
                <CardTitle>{t(tier.key)}</CardTitle>
                <p className="text-2xl font-bold">{tier.price}</p>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <ul className="text-sm text-muted-foreground space-y-1">
                  {(t.raw(`tier.${tier.key}.features`) as string[]).map((f) => <li key={f}>✓ {f}</li>)}
                </ul>
                <Button variant={tier.highlight ? 'default' : 'outline'} disabled>
                  {t('comingSoon')}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function LandingPage({ params: { locale } }: { params: { locale: string } }) {
  return (
    <>
      <Header />
      <main>
        <HeroSection locale={locale} />
        <HowItWorksSection />
        <FeaturesSection />
        <FleetsSection />
        <PricingSection />
      </main>
      <Footer />
    </>
  )
}
