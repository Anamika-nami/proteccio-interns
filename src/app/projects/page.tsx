export default function Projects() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-4xl font-bold mb-4">Projects</h2>
        <p className="text-gray-400 mb-12">Work built and shipped by our interns.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col gap-3 hover:border-blue-600 transition-colors">
              <h3 className="text-lg font-semibold">Project Title</h3>
              <p className="text-gray-400 text-sm">A short description of what this project does and the problem it solves.</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {['Next.js', 'Supabase', 'Tailwind'].map(tech => (
                  <span key={tech} className="bg-gray-800 text-blue-400 text-xs px-2 py-1 rounded-full">{tech}</span>
                ))}
              </div>
              <div className="flex gap-3 mt-4">
                <a href="#" className="text-sm text-blue-400 hover:underline">Live Demo</a>
                <a href="#" className="text-sm text-gray-400 hover:underline">GitHub</a>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
