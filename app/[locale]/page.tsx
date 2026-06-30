import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import type { Metadata } from 'next'

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'hero' })
  return { title: `SeaJob — ${t('headline')}`, description: t('subheadline') }
}

const TICKER_ITEMS = [
  { rank: 'Captain', co: 'Bulk Carrier, Pacific Maritime' },
  { rank: 'Chief Mate', co: 'Chemical Tanker, Stolt' },
  { rank: '2nd Engineer', co: 'AHTS, Bourbon Offshore' },
  { rank: 'ETO', co: 'Cruise, MSC' },
  { rank: 'Bosun', co: 'Container, Evergreen' },
  { rank: '3rd Officer', co: 'Ro-Pax, Grimaldi' },
  { rank: 'Chief Engineer', co: 'Tanker, Odfjell' },
  { rank: 'AB Seaman', co: 'Bulk, Pacific Maritime' },
]

const VACANCIES = [
  { rank: 'Captain', co: 'Odfjell', type: 'Bulk', salary: '$12,000' },
  { rank: 'Chief Engineer', co: 'Bourbon', type: 'Offshore', salary: '$10,500' },
  { rank: '2nd Officer', co: 'CMA CGM', type: 'Container', salary: '$4,800' },
  { rank: '3rd Engineer', co: 'Grimaldi', type: 'Ro-Ro', salary: '$4,200' },
  { rank: 'Electrician', co: 'MSC', type: 'Cruise', salary: '$5,600' },
  { rank: 'Bosun', co: 'Nordic Tankers', type: 'Tanker', salary: '$3,100' },
]

function Ticker() {
  const t = useTranslations('landing')
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS]

  return (
    <div
      className="overflow-hidden h-9 flex items-center border-b"
      style={{ background: '#c8d8ee', borderColor: '#a8bcd8' }}
    >
      <div
        className="flex-shrink-0 text-[10px] font-bold tracking-[2px] uppercase px-12 pr-6 border-r mr-6"
        style={{ color: '#94a3b8', borderColor: '#9ab0cc', whiteSpace: 'nowrap' }}
      >
        {t('tickerLabel')}
      </div>
      <div className="flex gap-7 items-center overflow-hidden" style={{ whiteSpace: 'nowrap' }}>
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs flex-shrink-0">
            <span className="font-bold" style={{ color: '#0c2461' }}>{item.rank}</span>
            <span style={{ color: '#b8cce8' }}>/</span>
            <span style={{ color: '#64748b' }}>{item.co}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function HeroSection({ locale }: { locale: string }) {
  const t = useTranslations('hero')
  const tl = useTranslations('landing')

  const demoCardRows = [
    { label: tl('demoCardLabel1'), value: tl('demoCardValue1') },
    { label: tl('demoCardLabel2'), value: 'Marshall Islands' },
    { label: tl('demoCardLabel3'), value: '37,000 DWT Chemical tanker' },
    { label: tl('demoCardLabel4'), value: 'STCW II/2, ECDIS, BRM' },
  ]

  return (
    <div
      className="mx-auto px-12 py-16 grid gap-16 items-center"
      style={{ maxWidth: 1080, gridTemplateColumns: '1fr 380px' }}
    >
      <div>
        <h1
          className="font-display text-[52px] leading-[1.02] tracking-[-1.5px] mb-4"
          style={{ color: '#0c2461' }}
        >
          {tl('heroHeadlineLine1')}<br />
          {tl('heroHeadlineLine2')}<br />
          <em style={{ color: '#1d4ed8' }}>{tl('heroHeadlineEm')}</em>
        </h1>
        <p className="text-[15px] leading-relaxed mb-7 max-w-[360px]" style={{ color: '#64748b' }}>
          {tl('heroSub')}
        </p>
        <div className="flex items-center gap-5">
          <Link
            href={`/${locale}/signup`}
            className="inline-block bg-primary text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors hover:opacity-90 active:translate-y-px"
          >
            {t('cta')}
          </Link>
          <Link
            href={`/${locale}#vacancies`}
            className="text-sm font-medium border-b pb-px transition-colors"
            style={{ color: '#0c2461', borderColor: '#c7d7f0' }}
          >
            {tl('browseVacancies')}
          </Link>
        </div>
      </div>

      {/* Demo job card */}
      <div
        className="bg-card rounded-xl p-6"
        style={{
          border: '1px solid #b8cce0',
          boxShadow: '0 1px 3px rgba(12,36,97,0.08), 0 8px 24px rgba(12,36,97,0.12), 0 32px 48px rgba(12,36,97,0.07)',
        }}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-lg font-bold tracking-tight" style={{ color: '#0c2461' }}>Chief Officer</div>
            <div className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>Stolt Tankers B.V.</div>
          </div>
          <span
            className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded"
            style={{ color: '#1d4ed8', background: '#dce6f4', letterSpacing: '0.8px' }}
          >
            {tl('demoCardBadge')}
          </span>
        </div>

        <div className="flex flex-col gap-2 mb-4">
          {demoCardRows.map(({ label, value }) => (
            <div key={label} className="flex items-start gap-2.5 text-[12.5px]">
              <span className="text-[11px] font-medium w-[68px] shrink-0 pt-px" style={{ color: '#b0bcd4' }}>{label}</span>
              <span style={{ color: '#334155' }}>{value}</span>
            </div>
          ))}
        </div>

        <hr style={{ borderColor: '#cddaee', margin: '16px 0' }} />

        <div className="flex justify-between items-end">
          <div>
            <div className="text-[22px] font-extrabold tracking-tight" style={{ color: '#0c2461' }}>$8,500 / {tl('demoCardSalaryUnit')}</div>
            <div className="text-[10px] mt-0.5" style={{ color: '#94a3b8' }}>{tl('demoCardSalarySubtitle')}</div>
          </div>
          <span className="text-[11px]" style={{ color: '#94a3b8' }}>{tl('demoCardApplications')}</span>
        </div>

        <button
          className="w-full mt-4 bg-primary text-white text-[13px] font-semibold py-2.5 rounded-lg transition-opacity hover:opacity-90 active:translate-y-px"
        >
          {tl('demoCardApply')}
        </button>
        <div className="text-center text-[10.5px] mt-2.5" style={{ color: '#c7d5e8' }}>
          {tl('demoCardPosted')}
        </div>
      </div>
    </div>
  )
}

function StatsBar() {
  const t = useTranslations('landing')
  const stats = [
    { num: '847', label: t('statsCompanies') },
    { num: '2,340', label: t('statsHired') },
    { num: '18', label: t('statsFleets') },
    { num: '24ч', label: t('statsResponse') },
  ]

  return (
    <div style={{ borderTop: '1px solid #b8cce0', borderBottom: '1px solid #b8cce0' }}>
      <div
        style={{ maxWidth: 1080 }}
        className="mx-auto px-12 py-5 flex"
      >
        {stats.map((s, i) => (
          <div
            key={s.label}
            className="flex-1 px-7"
            style={{
              paddingLeft: i === 0 ? 0 : undefined,
              borderRight: i < stats.length - 1 ? '1px solid #b8cce0' : undefined,
            }}
          >
            <div className="text-2xl font-extrabold tracking-tight leading-none" style={{ color: '#0c2461' }}>
              {s.num}
            </div>
            <div className="text-[11px] mt-1" style={{ color: '#94a3b8' }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PhotoBand() {
  const t = useTranslations('landing')
  return (
    <div className="relative w-full overflow-hidden" style={{ height: 220 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://picsum.photos/seed/cargo-ship-sea-harbor/1400/220"
        alt="Грузовое судно в порту"
        className="w-full h-full object-cover"
        style={{ objectPosition: 'center 40%', filter: 'saturate(0.7) brightness(0.92)' }}
        loading="lazy"
      />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(90deg, rgba(12,36,97,0.55) 0%, transparent 50%, rgba(12,36,97,0.2) 100%)' }}
      />
      <div className="absolute left-12 top-1/2 -translate-y-1/2">
        <p className="font-display text-[22px] text-white leading-snug tracking-tight max-w-[300px]">
          {t('photoBandHeadline')}<br />
          <em className="font-display" style={{ color: 'rgba(255,255,255,0.75)' }}>{t('photoBandSub')}</em>
        </p>
      </div>
    </div>
  )
}

function VacanciesSection({ locale }: { locale: string }) {
  const t = useTranslations('landing')
  return (
    <div id="vacancies" style={{ maxWidth: 1080 }} className="mx-auto px-12 py-10">
      <div className="flex justify-between items-baseline mb-5">
        <div className="text-[10px] font-bold tracking-[2.5px] uppercase" style={{ color: '#94a3b8' }}>
          {t('freshVacancies')}
        </div>
        <Link
          href={`/${locale}/dashboard/vacancies`}
          className="text-[12.5px] font-medium hover:underline"
          style={{ color: '#1d4ed8' }}
        >
          {t('allVacancies')}
        </Link>
      </div>
      <div className="grid gap-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {VACANCIES.map((v) => (
          <div
            key={`${v.rank}-${v.co}`}
            className="bg-card flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all hover:shadow-sm"
            style={{ border: '1px solid #b8cce0' }}
          >
            <span className="text-[13px] font-bold w-[135px] shrink-0" style={{ color: '#0c2461' }}>{v.rank}</span>
            <span className="flex-1 text-xs" style={{ color: '#64748b' }}>{v.co}</span>
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded"
              style={{ color: '#94a3b8', background: '#dce6f4', border: '1px solid #b8cce0' }}
            >
              {v.type}
            </span>
            <span className="text-[13px] font-bold w-14 text-right shrink-0" style={{ color: '#0c2461' }}>{v.salary}</span>
          </div>
        ))}
      </div>
    </div>
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
    <div
      id="how-it-works"
      style={{ borderTop: '1px solid #b8cce0', borderBottom: '1px solid #b8cce0', background: '#c8d8ee' }}
    >
      <div style={{ maxWidth: 1080 }} className="mx-auto px-12 py-12">
        <h2
          className="font-display text-[28px] tracking-tight mb-9"
          style={{ color: '#0c2461' }}
        >
          {t('title')}
        </h2>
        <div className="flex flex-col">
          {steps.map((s, i) => (
            <div
              key={s.num}
              className="grid gap-6 items-start py-7"
              style={{
                gridTemplateColumns: '80px 1fr',
                borderTop: '1px solid #b8cce0',
                borderBottom: i === steps.length - 1 ? '1px solid #b8cce0' : undefined,
              }}
            >
              <span
                className="font-display text-[40px] leading-none tracking-tight select-none"
                style={{ color: '#a8bcd8' }}
              >
                {s.num}
              </span>
              <div>
                <div className="text-[15px] font-bold tracking-tight mb-1.5" style={{ color: '#0c2461' }}>
                  {s.title}
                </div>
                <p className="text-[13.5px] leading-relaxed max-w-[480px]" style={{ color: '#64748b' }}>
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function LandingPage({ params: { locale } }: { params: { locale: string } }) {
  return (
    <>
      <Header />
      <Ticker />
      <main>
        <HeroSection locale={locale} />
        <StatsBar />
        <PhotoBand />
        <VacanciesSection locale={locale} />
        <HowItWorksSection />
      </main>
      <Footer />
    </>
  )
}
