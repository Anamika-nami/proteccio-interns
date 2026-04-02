import PublicNavbar from '@/components/PublicNavbar';

export const metadata = {
  title: 'Contact Us | Proteccio Interns',
  description: 'Support and inquiries for the Proteccio Interns platform.',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-900 font-sans">
      <PublicNavbar />
      
      <main className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-extrabold text-white mb-6">
            Get in <span className="bg-gradient-to-r from-amber-400 to-blue-400 bg-clip-text text-transparent">Touch</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Have questions about Proteccio Interns? Our team is here to help you secure and manage your organization with intelligence-driven solutions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Customer Support */}
          <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 p-8 rounded-3xl shadow-2xl hover:border-amber-400/30 transition-all duration-300 group">
            <div className="p-4 bg-amber-400/10 rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform">
              <span className="text-3xl">🤝</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Customer Support</h3>
            <p className="text-slate-400 mb-6">Technical issues or platform questions? We&apos;re here 24/7.</p>
            <a href="mailto:support@proteccio-interns.com" className="inline-flex items-center text-amber-400 hover:text-amber-300 font-semibold transition-colors">
              support@proteccio-interns.com
              <span className="ml-2">→</span>
            </a>
          </div>

          {/* Sales Inquiries */}
          <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 p-8 rounded-3xl shadow-2xl hover:border-blue-400/30 transition-all duration-300 group">
            <div className="p-4 bg-blue-400/10 rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform">
              <span className="text-3xl">💼</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Sales & Enterprise</h3>
            <p className="text-slate-400 mb-6">Custom plans for large organizations and enterprise licensing.</p>
            <a href="mailto:sales@proteccio-interns.com" className="inline-flex items-center text-blue-400 hover:text-blue-300 font-semibold transition-colors">
              sales@proteccio-interns.com
              <span className="ml-2">→</span>
            </a>
          </div>

          {/* Technical Support */}
          <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 p-8 rounded-3xl shadow-2xl hover:border-purple-400/30 transition-all duration-300 group">
            <div className="p-4 bg-purple-400/10 rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform">
              <span className="text-3xl">🛠️</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Technical & Security</h3>
            <p className="text-slate-400 mb-6">Inquiries regarding data privacy, RLS architecture, or API access.</p>
            <a href="mailto:tech@proteccio-interns.com" className="inline-flex items-center text-purple-400 hover:text-purple-300 font-semibold transition-colors">
              tech@proteccio-interns.com
              <span className="ml-2">→</span>
            </a>
          </div>
        </div>

        <div className="mt-16 text-center">
          <div className="inline-block p-1 rounded-full bg-slate-800/80 border border-slate-700/50 backdrop-blur-sm">
            <p className="px-6 py-2 text-sm text-slate-400">
              Trusted by enterprise organizations worldwide.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
