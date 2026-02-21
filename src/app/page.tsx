import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Navbar */}
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

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-32">
        <h2 className="text-5xl font-bold mb-4">Meet the Interns</h2>
        <p className="text-gray-400 text-lg max-w-xl mb-8">
          A showcase of talent, projects, and progress from the Proteccio internship programme.
        </p>
        <div className="flex gap-4">
          <Link href="/interns" className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium">
            View Interns
          </Link>
          <Link href="/projects" className="border border-gray-600 hover:border-white px-6 py-3 rounded-lg font-medium">
            View Projects
          </Link>
        </div>
      </section>
    </main>
  )
}
