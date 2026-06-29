import { Nav } from '@/components/nav'
import { Footer } from '@/components/footer'
import { UploadDropzone } from '@/components/upload-dropzone'
import { ScanLine, TrendingUp, Zap } from 'lucide-react'

const features = [
  {
    icon: ScanLine,
    title: 'Real visual comps',
    description:
      'We search actual sold listings that look like your item — not just keyword matches. pgvector image similarity means the comps are real.',
  },
  {
    icon: TrendingUp,
    title: 'Days-to-sell, not just price',
    description:
      'A $200 price that takes 60 days is worse than $165 in 5. We rank every platform by velocity: expected dollars per day.',
  },
  {
    icon: Zap,
    title: 'Listing in one tap',
    description:
      'Auto-generated title and description — keyword-rich, honest, and ready to copy into any platform. No blank page.',
  },
]

const steps = [
  {
    number: '01',
    title: 'Snap',
    description:
      'Take or upload a photo of your item. Our vision AI identifies brand, model, and condition.',
  },
  {
    number: '02',
    title: 'See the market',
    description:
      'We pull live eBay data and estimate Poshmark and Depop comps — clearly labeled so you always know the source.',
  },
  {
    number: '03',
    title: 'List it',
    description:
      'Get a recommended price, platform ranking by velocity, and an auto-generated listing. Done.',
  },
]

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        {/* Hero */}
        <section className="bg-[#06281E] text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-28">
            <div className="max-w-2xl mx-auto text-center mb-14">
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold leading-tight text-balance mb-5">
                Know what it sells for{' '}
                <span className="text-[#34D399]">before you list it.</span>
              </h1>
              <p className="text-white/70 text-lg leading-relaxed text-pretty">
                Resellers guess at price and wonder why things sit. ResaleRadar scans your item,
                finds real sold comps across eBay, Poshmark, and Depop, and ranks them by how fast
                you&apos;ll actually get paid.
              </p>
            </div>
            <UploadDropzone />
          </div>
        </section>

        {/* Feature cards */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <div className="grid sm:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl border border-[#d1e8de] p-6 shadow-sm"
              >
                <div className="w-11 h-11 rounded-xl bg-[#ECFDF5] flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-[#10B981]" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-[#06281E] mb-2">{f.title}</h3>
                <p className="text-[#6b7f78] text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="bg-white border-y border-[#d1e8de]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
            <div className="text-center mb-14">
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#06281E] text-balance">
                How it works
              </h2>
              <p className="text-[#6b7f78] mt-3 text-base">Three steps from photo to listed.</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-10">
              {steps.map((step) => (
                <div key={step.number} className="flex flex-col items-start">
                  <span className="font-mono text-5xl font-bold text-[#10B981]/25 leading-none mb-4">
                    {step.number}
                  </span>
                  <h3 className="font-serif text-xl font-semibold text-[#06281E] mb-2">
                    {step.title}
                  </h3>
                  <p className="text-[#6b7f78] text-sm leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
