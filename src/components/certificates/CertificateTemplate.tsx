'use client'

import type { CertificateData } from '@/types'

interface CertificateTemplateProps {
  data: CertificateData
}

export function CertificateTemplate({ data }: CertificateTemplateProps) {
  return (
    <div className="bg-white p-12 border-8 border-double border-blue-900 max-w-4xl mx-auto">
      <div className="text-center space-y-8">
        {/* Header */}
        <div className="border-b-2 border-gray-300 pb-6">
          <h1 className="text-5xl font-serif font-bold text-blue-900">
            Certificate of Completion
          </h1>
          <p className="text-lg text-gray-600 mt-2">Internship Program</p>
        </div>

        {/* Body */}
        <div className="space-y-6 py-8">
          <p className="text-xl text-gray-700">This is to certify that</p>
          
          <h2 className="text-4xl font-serif font-bold text-gray-900 border-b-2 border-gray-400 pb-2 inline-block px-8">
            {data.intern_name}
          </h2>

          <p className="text-xl text-gray-700">
            has successfully completed the internship program as
          </p>

          <p className="text-2xl font-semibold text-blue-800">
            {data.role}
          </p>

          <p className="text-xl text-gray-700">
            at <span className="font-semibold">{data.organization}</span>
          </p>

          <p className="text-lg text-gray-600">
            Duration: {data.duration}
          </p>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-gray-300 pt-8 flex justify-between items-end">
          <div className="text-left">
            <div className="border-t-2 border-gray-400 pt-2 w-48">
              <p className="text-sm text-gray-600">Authorized Signature</p>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">Date of Completion</p>
            <p className="font-semibold text-gray-800">{data.completion_date}</p>
          </div>

          <div className="text-right">
            <p className="text-xs text-gray-500">Certificate ID</p>
            <p className="text-sm font-mono text-gray-700">{data.certificate_id}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
