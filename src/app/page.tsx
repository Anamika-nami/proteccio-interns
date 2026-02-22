import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-40">
        <div className="inline-block bg-blue-600/10 border border-blue-600/30 text-blue-400 text-sm px-4 py-1.5 rounded-full mb-6">
          February 2026 Cohort
        </div>
        <h2 className="text-6xl font-bold mb-6 leading-tight">
          Meet the <span className="text-blue-400">Interns</span>
        </h2>
        <p className="text-gray-400 text-xl max-w-xl mb-10">
          A showcase of talent, projects, and progress from the Proteccio internship programme.
        </p>
        <div className="flex gap-4">
          <Link href="/interns" className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg font-medium transition-colors">
            View Interns
          </Link>
          <Link href="/projects" className="border border-gray-700 hover:border-gray-500 px-8 py-3 rounded-lg font-medium transition-colors">
            View Projects
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-4xl mx-auto px-6 pb-24 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { value: '10+', label: 'Interns' },
          { value: '5+', label: 'Projects Shipped' },
          { value: '1', label: 'Cohort' },
        ].map(stat => (
          <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
            <p className="text-4xl font-bold text-blue-400 mb-2">{stat.value}</p>
            <p className="text-gray-400">{stat.label}</p>
          </div>
        ))}
      </section>
    </main>
  )
}

