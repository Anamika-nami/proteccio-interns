import Link from 'next/link'

export default function Interns() {
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

      <section className="max-w-5xl mx-auto px-6 py-24">
        <h2 className="text-4xl font-bold mb-4">Our Interns</h2>
        <p className="text-gray-400 mb-12">Meet the talented individuals in our programme.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col gap-3">
              <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-bold">
                I
              </div>
              <h3 className="text-lg font-semibold">Intern Name</h3>
              <p className="text-gray-400 text-sm">Full Stack Developer</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {['React', 'TypeScript', 'Supabase'].map(skill => (
                  <span key={skill} className="bg-gray-800 text-blue-400 text-xs px-2 py-1 rounded-full">{skill}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
