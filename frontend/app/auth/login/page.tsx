'use client'
// @ts-nocheck

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Mail, Shield, Lock, CheckCircle, AlertTriangle, ShoppingCart, Users, Clock, HeadphonesIcon as Headphones } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showOrderForm, setShowOrderForm] = useState(false)

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

  const handleOrderSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const formData = new FormData(e.currentTarget)
    
    const orderData = {
      municipalityName: formData.get('municipalityName'),
      orgNumber: formData.get('orgNumber'),
      reference: formData.get('reference'),
      ordererName: formData.get('ordererName'),
      invoiceAddress: formData.get('invoiceAddress'),
      ordererEmail: formData.get('ordererEmail'),
      users: formData.get('users'),
      userEmails: formData.get('userEmails'),
    }

    try {
      const response = await fetch('/api/submit-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Det oppstod en feil')
      }

      setMessage({
        type: 'success',
        text: result.message || 'Bestilling mottatt! Vi vil kontakte deg innen 24 timer.',
      })
      
      // Reset form and go back to login after 3 seconds
      setTimeout(() => {
        setShowOrderForm(false)
        setMessage(null)
      }, 3000)

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
      <div className="max-w-6xl w-full">
        {!showOrderForm ? (
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left side - Illustrations and Info */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <Shield className="w-10 h-10 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900">
                  Beredskapsplan Revisjon
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

              {/* Pricing Information */}
              <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg text-white">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <ShoppingCart className="w-6 h-6" />
                  Pris og Tilgang
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Årlig abonnement: kr 2 990,-</p>
                      <p className="text-sm text-blue-100">Inkluderer 1 brukerlisens</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Garantert oppetid og support</p>
                      <p className="text-sm text-blue-100">Aktualisering i henhold til gjeldende krav</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Headphones className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">E-postsupport inkludert</p>
                      <p className="text-sm text-blue-100">Rask respons på henvendelser</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-blue-500">
                    <p className="text-sm">
                      <strong>Rabatt:</strong> 10% for hver tilleggsbruker
                    </p>
                  </div>
                </div>
              </div>

              {/* Access Information */}
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-900">
                  <strong>For å kunne ta i bruk denne løsningen må du være registrert bruker.</strong>{' '}
                  Registrerte brukere logger inn med sin e-postadresse nedenfor. Ønsker du tilgang? Klikk på "Bestill tilgang" for å sende inn bestilling.
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

              <div className="mt-6">
                <button
                  onClick={() => setShowOrderForm(true)}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                >
                  Bestill tilgang
                </button>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Har du spørsmål? Kontakt{' '}
                  <a href="mailto:support@vardedigital.no" className="text-blue-600 hover:underline">
                    support@vardedigital.no
                  </a>
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Order Form */
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
              <div className="text-center mb-8">
                <ShoppingCart className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Bestill tilgang
                </h2>
                <p className="text-gray-600">
                  Fyll ut skjemaet for å bestille tilgang til Beredskapsplan Revisjon
                </p>
              </div>

              <form onSubmit={handleOrderSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="municipalityName" className="block text-sm font-medium text-gray-700 mb-2">
                      Kommunenavn *
                    </label>
                    <input
                      id="municipalityName"
                      name="municipalityName"
                      type="text"
                      required
                      placeholder="Oslo kommune"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="orgNumber" className="block text-sm font-medium text-gray-700 mb-2">
                      EHF/Org.nr. *
                    </label>
                    <input
                      id="orgNumber"
                      name="orgNumber"
                      type="text"
                      required
                      placeholder="123 456 789"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reference" className="block text-sm font-medium text-gray-700 mb-2">
                    Referanse *
                  </label>
                  <input
                    id="reference"
                    name="reference"
                    type="text"
                    required
                    placeholder="Prosjektnummer eller annen referanse"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="ordererName" className="block text-sm font-medium text-gray-700 mb-2">
                    Navn på bestiller *
                  </label>
                  <input
                    id="ordererName"
                    name="ordererName"
                    type="text"
                    required
                    placeholder="Ola Nordmann"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="invoiceAddress" className="block text-sm font-medium text-gray-700 mb-2">
                    Fakturaadresse *
                  </label>
                  <textarea
                    id="invoiceAddress"
                    name="invoiceAddress"
                    required
                    rows={3}
                    placeholder="Gateadresse, postnummer, poststed"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="ordererEmail" className="block text-sm font-medium text-gray-700 mb-2">
                    E-post (bestiller) *
                  </label>
                  <input
                    id="ordererEmail"
                    name="ordererEmail"
                    type="email"
                    required
                    placeholder="bestiller@kommune.no"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="users" className="block text-sm font-medium text-gray-700 mb-2">
                    Navn på bruker(e) *
                  </label>
                  <textarea
                    id="users"
                    name="users"
                    required
                    rows={3}
                    placeholder="Kari Nordmann, Per Hansen (ett navn per linje)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Skriv ett navn per linje</p>
                </div>

                <div>
                  <label htmlFor="userEmails" className="block text-sm font-medium text-gray-700 mb-2">
                    E-postadresse(r) for oppretting av tilgang *
                  </label>
                  <textarea
                    id="userEmails"
                    name="userEmails"
                    required
                    rows={3}
                    placeholder="kari@kommune.no, per@kommune.no (én e-post per linje)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Skriv én e-postadresse per linje</p>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowOrderForm(false)}
                    disabled={loading}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Avbryt
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Sender...' : 'Bestill'}
                  </button>
                </div>

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
            </div>
          </div>
        )}

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