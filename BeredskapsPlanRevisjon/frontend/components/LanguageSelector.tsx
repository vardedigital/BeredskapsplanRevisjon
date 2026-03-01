'use client'

import { useState } from 'react'
import { Globe } from 'lucide-react'

interface LanguageSelectorProps {
  onLanguageSelect: (language: 'bokmal' | 'nynorsk', preferences?: any) => void
}

export default function LanguageSelector({ onLanguageSelect }: LanguageSelectorProps) {
  const [language, setLanguage] = useState<'bokmal' | 'nynorsk'>('bokmal')
  const [showNynorskPreferences, setShowNynorskPreferences] = useState(false)
  const [nynorskPreferences, setNynorskPreferences] = useState({
    pronoun: 'Vi',
    verbForm: 'å vere',
    ending: 'a-endingsform'
  })

  const handleLanguageChange = (lang: 'bokmal' | 'nynorsk') => {
    setLanguage(lang)
    if (lang === 'nynorsk') {
      setShowNynorskPreferences(true)
    } else {
      setShowNynorskPreferences(false)
      onLanguageSelect(lang)
    }
  }

  const handleConfirm = () => {
    onLanguageSelect(language, nynorskPreferences)
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Globe className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Velg språk</h2>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleLanguageChange('bokmal')}
            className={`p-6 rounded-lg border-2 transition-all ${
              language === 'bokmal'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-3xl mb-2">🇳🇴</div>
            <div className="font-semibold text-lg">Bokmål</div>
            <div className="text-sm text-gray-600 mt-1">Standard norsk</div>
          </button>

          <button
            onClick={() => handleLanguageChange('nynorsk')}
            className={`p-6 rounded-lg border-2 transition-all ${
              language === 'nynorsk'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-3xl mb-2">🇳🇴</div>
            <div className="font-semibold text-lg">Nynorsk</div>
            <div className="text-sm text-gray-600 mt-1">Norsk målform</div>
          </button>
        </div>

        {showNynorskPreferences && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-semibold mb-4 text-gray-900">Nynorsk-stilinnstillinger</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pronomen
                </label>
                <select
                  value={nynorskPreferences.pronoun}
                  onChange={(e) => setNynorskPreferences({
                    ...nynorskPreferences,
                    pronoun: e.target.value
                  })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="Vi">Vi</option>
                  <option value="Me">Me</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verbform (der stilrelevant)
                </label>
                <select
                  value={nynorskPreferences.verbForm}
                  onChange={(e) => setNynorskPreferences({
                    ...nynorskPreferences,
                    verbForm: e.target.value
                  })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="å vere">å vere</option>
                  <option value="å bli">å bli</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Endingar
                </label>
                <select
                  value={nynorskPreferences.ending}
                  onChange={(e) => setNynorskPreferences({
                    ...nynorskPreferences,
                    ending: e.target.value
                  })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="a-endingsform">a-endingsform</option>
                  <option value="e-endingsform">e-endingsform</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleConfirm}
          className="w-full mt-6 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Fortsett
        </button>
      </div>
    </div>
  )
}