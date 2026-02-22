import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-gray-950 mt-24">
      <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">P</div>
            <span className="font-bold text-white">Proteccio Interns</span>
          </div>
          <p className="text-gray-400 text-sm">A showcase of talent, projects, and progress from the Proteccio internship programme.</p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Navigation</h4>
          <div className="flex flex-col gap-2 text-sm text-gray-400">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <Link href="/interns" className="hover:text-white transition-colors">Interns</Link>
            <Link href="/projects" className="hover:text-white transition-colors">Projects</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Contact</h4>
          <div className="flex flex-col gap-2 text-sm text-gray-400">
            <p>admin@proteccio.com</p>
            <p>Proteccio Internship Programme</p>
            <p>February 2026 Cohort</p>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-800 px-6 py-4 text-center text-xs text-gray-600">
        © {new Date().getFullYear()} Proteccio Interns. Built by interns, for interns.
      </div>
    </footer>
  )
}
