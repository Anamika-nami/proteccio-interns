import Link from 'next/link'

export default function About() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-10 py-5 border-b border-gray-800">
        <h1 className="text-xl font-bold text-blue-400">Proteccio Interns</h1>
        <div className="flex gap-6 text-sm text-gray-300">
          <Link href="/" className="hover:text-white">Home</Link>
          <Link href="/about" className="hover:text-white">About</Link>
          <Link href="/interns" className="hover:text-white">Interns</Link>
          <Link href="/projects" className="hover:text-white">Projects</Link>
          <Link href="/contact" className="hover:text-white">Contact</Link>
          <Link href="/admin/login" className="hover:text-white text-blue-400">Admin</Link>
        </div>
      </nav>

      <section className="max-w-4xl mx-auto px-6 py-24">
        <h2 className="text-4xl font-bold mb-6">About the Programme</h2>
        <p className="text-gray-400 text-lg mb-6">
          The Proteccio Internship Programme is designed to give aspiring full stack developers
          real-world experience building production-grade applications. Interns work in teams,
          follow enterprise coding standards, and ship working software.
        </p>
        <p className="text-gray-400 text-lg mb-6">
          This platform is itself built by the interns — a live demonstration of their skills
          in Next.js, TypeScript, Supabase, and cloud deployment.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {[
            { title: 'Real Projects', desc: 'Interns build and ship actual products, not toy exercises.' },
            { title: 'Mentorship', desc: 'Guided by experienced engineers with daily code reviews.' },
            { title: 'Cloud Ready', desc: 'Every project is deployed to production from day one.' },
          ].map((item) => (
            <div key={item.title} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-blue-400 mb-2">{item.title}</h3>
              <p className="text-gray-400 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}