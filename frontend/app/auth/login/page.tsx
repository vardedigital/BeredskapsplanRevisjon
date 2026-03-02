'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Mail, Shield, Lock, CheckCircle, AlertTriangle } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      setMessage({
        type: 'success',
        text: 'Magic link er sendt til e-postadressen din! Sjekk innboksen din.',
      })
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Det oppstod en feil. Prøv igjen.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Left side - Illustrations and Info */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <Shield className="w-10 h-10 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">
                BeredskapsPlanRevisjon
              </h1>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">100% Lovlydighet</h3>
                  <p className="text-sm text-gray-600">
                    Automatisk sjekk mot lov, forskrift, DSB-veiledere og KS best practice
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                <Lock className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">GDPR & EU AI Act</h3>
                  <p className="text-sm text-gray-600">
                    Full compliance med personvernregler og AI-regelverk
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">Ingen Datalagring</h3>
                  <p className="text-sm text-gray-600">
                    Alle planer slettes automatisk etter nedlasting
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>For kommuner:</strong> Logg inn med din registrerte e-postadresse for å starte revisjon av din beredskapsplan.
              </p>
            </div>
          </div>

          {/* Right side - Login Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
            <div className="text-center mb-8">
              <Mail className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Logg inn
              </h2>
              <p className="text-gray-600">
                Vi sender deg en magic link til e-posten din
              </p>
            </div>

            <form onSubmit={handleMagicLink} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  E-postadresse
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="din@kommune.no"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Sender...' : 'Send Magic Link'}
              </button>

              {message && (
                <div
                  className={`p-4 rounded-lg ${
                    message.type === 'success'
                      ? 'bg-green-50 text-green-900 border border-green-200'
                      : 'bg-red-50 text-red-900 border border-red-200'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                </div>
              )}
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Har du ikke tilgang? Kontakt{' '}
                <a href="mailto:support@vardedigital.no" className="text-blue-600 hover:underline">
                  support@vardedigital.no
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-600 text-sm">
          <p>Utvikla 2026©Varde Digital Solutions</p>
          <p className="mt-2">
            Alle rettigheter reservert. Sertifisert i henhold til GDPR, EU AI Act og norsk lov.
          </p>
        </div>
      </div>
    </div>
  )
}
