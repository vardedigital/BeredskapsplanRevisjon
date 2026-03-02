'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import LanguageSelector from '@/components/LanguageSelector'
import DocumentUpload from '@/components/DocumentUpload'
import RevisionDashboard from '@/components/RevisionDashboard'
import { LogOut, Shield } from 'lucide-react'

type Step = 'language' | 'upload' | 'revision' | 'completed'

export default function DashboardPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('language')
  const [sessionId, setSessionId] = useState<string>('')
  const [language, setLanguage] = useState<'bokmal' | 'nynorsk'>('bokmal')
  const [nynorskPreferences, setNynorskPreferences] = useState<any>({})
  const [tenantId, setTenantId] = useState<string>('')
  const [userId, setUserId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string>('')
  const [municipalityName, setMunicipalityName] = useState<string>('')

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error || !session) {
        router.push('/auth/login')
        return
      }

      setUserEmail(session.user.email || '')

      // Get user data from database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('tenant_id, id')
        .eq('id', session.user.id)
        .single()

      if (userError || !userData) {
        await supabase.auth.signOut()
        router.push('/auth/login?error=user_not_found')
        return
      }

      setTenantId(userData.tenant_id)
      setUserId(userData.id)

      // Get municipality name
      const { data: tenantData } = await supabase
        .from('tenants')
        .select('municipality_name')
        .eq('id', userData.tenant_id)
        .single()

      setMunicipalityName(tenantData?.municipality_name || '')

      // Generate unique session ID
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      setSessionId(newSessionId)

      setLoading(false)
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/auth/login?error=auth_failed')
    }
  }

  const handleLogout = async () => {
    try {
      // Clean up session data
      if (sessionId) {
        await fetch('/api/cleanup-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        })
      }

      await supabase.auth.signOut()
      router.push('/auth/login')
    } catch (error) {
      console.error('Logout error:', error)
      router.push('/auth/login')
    }
  }

  const handleLanguageSelect = (selectedLanguage: 'bokmal' | 'nynorsk', preferences?: any) => {
    setLanguage(selectedLanguage)
    setNynorskPreferences(preferences || {})
    setStep('upload')
  }

  const handleUploadComplete = () => {
    setStep('revision')
  }

  const handleRevisionComplete = () => {
    setStep('completed')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laster...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Beredskapsplan Revisjon</h1>
                <p className="text-sm text-gray-600">{municipalityName} - {userEmail}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Logg ut</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {step === 'language' && (
          <LanguageSelector
            onSelect={handleLanguageSelect}
            language={language}
          />
        )}

        {step === 'upload' && (
          <DocumentUpload
            sessionId={sessionId}
            tenantId={tenantId}
            userId={userId}
            language={language}
            onComplete={handleUploadComplete}
          />
        )}

        {step === 'revision' && (
          <RevisionDashboard
            sessionId={sessionId}
            language={language}
            nynorskPreferences={nynorskPreferences}
            onComplete={handleRevisionComplete}
          />
        )}

        {step === 'completed' && (
          <div className="text-center py-12">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Revisjon fullført!
              </h2>
              <p className="text-gray-600 mb-6">
                Alle data er nå slettet fra systemet i henhold til GDPR og EU AI Act.
              </p>
              <button
                onClick={() => {
                  setStep('language')
                  setSessionId(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
                }}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Start ny revisjon
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-600 text-sm">
            <p>Utvikla 2026©Varde Digital Solutions</p>
            <p className="mt-2">
              Alle rettigheter reservert. Sertifisert i henhold til GDPR, EU AI Act og norsk lov.
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Alle opplastede dokumenter slettes automatisk etter nedlasting i henhold til personvernregler.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
