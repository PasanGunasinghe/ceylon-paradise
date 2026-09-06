const highlights = [
  'Custom-tailored tours across Sri Lanka',
  'Trusted local partners and responsible travel practices',
  'Curated experiences designed for Families, Couples, and Adventurers',
  'Transparent pricing, clear planning, and 24/7 support',
];

const values = [
  { title: 'Local expertise', description: 'We blend insider knowledge with thoughtful planning to create richer, more authentic travel moments.' },
  { title: 'Travel with comfort', description: 'Every itinerary is designed to balance adventure, ease, and memorable experiences at a comfortable pace.' },
  { title: 'Tailored service', description: 'No generic packages—every trip starts with understanding how you want to experience Sri Lanka.' },
];

export default function AboutPage() {
  return (
    <div className="page-shell page-background-full pb-20" style={{ backgroundImage: "url('/images/tea_plantation.jpg')" }}>
      <section className="page-hero small">
        <div className="content-container mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <p className="eyebrow">About us</p>
          <h1>Crafting exceptional journeys through Ceylon</h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-200">Ceylon Paradise Expeditions creates immersive and expertly guided travel journeys that connect guests with the soul of Sri Lanka—through culture, nature, and warm local hospitality.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-lg">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Our story</p>
            <h2 className="mt-3 text-3xl font-black text-slate-900">A passion for meaningful travel</h2>
            <p className="mt-5 text-slate-600">
              Founded with a love for Sri Lanka’s diverse beauty, we help travelers experience the island beyond the ordinary—through heritage routes, scenic escapes, wildlife encounters, and genuine cultural connection.
            </p>
            <p className="mt-4 text-slate-600">
              Our team curates every detail with care, from boutique stays to local guides and seamless transfers, so your adventure feels personal, smooth, and unforgettable.
            </p>
          </div>

          <div className="grid gap-4">
            {highlights.map((item) => (
              <div key={item} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-md shadow-slate-200/50">
                <div className="flex items-start gap-3">
                  <span className="mt-1 inline-block h-3 w-3 rounded-full bg-emerald-600" />
                  <p className="text-slate-700">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-900/20 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">Our values</p>
            <h2 className="mt-3 text-3xl font-black text-slate-900">Why travellers choose us</h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {values.map((value) => (
              <div key={value.title} className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-lg shadow-slate-200/50">
                <h3 className="text-2xl font-bold text-slate-900">{value.title}</h3>
                <p className="mt-4 text-slate-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
