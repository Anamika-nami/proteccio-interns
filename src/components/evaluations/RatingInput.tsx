'use client'

import { useState } from 'react'

interface RatingInputProps {
  label: string
  value: number
  onChange: (value: number) => void
  required?: boolean
}

export function RatingInput({ label, value, onChange, required = false }: RatingInputProps) {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null)

  const stars = [1, 2, 3, 4, 5]

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="flex gap-2">
        {stars.map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(null)}
            className="text-3xl transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            aria-label={`Rate ${star} out of 5`}
          >
            <span
              className={
                star <= (hoveredRating || value)
                  ? 'text-yellow-400'
                  : 'text-gray-300'
              }
            >
              ★
            </span>
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600 self-center">
          {value > 0 ? `${value}/5` : 'Not rated'}
        </span>
      </div>
    </div>
  )
}
