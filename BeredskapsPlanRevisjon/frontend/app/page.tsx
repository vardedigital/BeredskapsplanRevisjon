'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import LanguageSelector from '@/components/LanguageSelector'
import DocumentUpload from '@/components/DocumentUpload'
import RevisionDashboard from '@/components/RevisionDashboard'
import { Shield, AlertCircle } from 'lucide-react'

type Step = 'language' | 'upload' | 'revision' | 'completed'

export default function Home() {
  const [step, setStep] = useState<Step>('language')
  const [sessionId, setSessionId] = useState<string>('')
  const [language, setLanguage] = useState<'bokmal' | 'nynorsk'>('bokmal')
  const [nynorskPreferences, setNynorskPreferences] = useState<any>({})
  const [tenantId, setTenantId] = useState<string>('')
  const [userId, setUserId] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initializeSession()
  }, [])

  const initializeSession = async () => {
    try {
      // Generate unique session ID
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      setSessionId(newSessionId)

      // In production, you would get these from authentication
      // For now, using placeholder values
      setTenantId('placeholder-tenant-id')
      setUserId('placeholder-user-id')

      setLoading(false)
    } catch (error) {
      console.error('Error initializing session:', error)
      setLoading(false)
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

  const handleCleanup = async () => {
    try {
      await fetch('/api/cleanup-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sessionId })
      })
      setStep('completed')
    } catch (error) {
      console.error('Error cleaning up session:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">BeredskapsPlanRevisjon</h1>
                <p className="text-sm text-gray-600">100% compliance med lov, forskrift og DSB-veiledere</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Sesjon: {sessionId.slice(-8)}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {[
              { id: 'language', label: 'Språk' },
              { id: 'upload', label: 'Opplasting' },
              { id: 'revision', label: 'Revisjon' },
              { id: 'completed', label: 'Fullført' }
            ].map((stepItem, index) => (
              <div key={stepItem.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 font-semibold ${
                  step === stepItem.id
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : ['language', 'upload', 'revision'].includes(stepItem.id) && 
                       ['language', 'upload', 'revision'].indexOf(step) > 
                       ['language', 'upload', 'revision'].indexOf(stepItem.id)
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-gray-300 bg-white text-gray-500'
                }`}>
                  {['language', 'upload', 'revision'].includes(stepItem.id) && 
                   ['language', 'upload', 'revision'].indexOf(step) > 
                   ['language', 'upload', 'revision'].indexOf(stepItem.id)
                    ? '✓'
                    : index + 1}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  step === stepItem.id ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {stepItem.label}
                </span>
                {index < 3 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    ['language', 'upload', 'revision'].includes(stepItem.id) && 
                    ['language', 'upload', 'revision'].indexOf(step) > 
                    ['language', 'upload', 'revision'].indexOf(stepItem.id)
                    ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="max-w-5xl mx-auto">
          {step === 'language' && (
            <LanguageSelector onLanguageSelect={handleLanguageSelect} />
          )}

          {step === 'upload' && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Last opp dokumenter</h2>
              <DocumentUpload
                sessionId={sessionId}
                tenantId={tenantId}
                userId={userId}
                onUploadComplete={handleUploadComplete}
              />
            </div>
          )}

          {step === 'revision' && (
            <RevisionDashboard
              sessionId={sessionId}
              language={language}
            />
          )}

          {step === 'completed' && (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Revisjon fullført!</h2>
              <p className="text-gray-600 mb-6">
                Alle data er slettet fra systemet. Kommunen har full kontroll over informasjonen.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Start ny revisjon
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <AlertCircle className="w-4 h-4" />
              <span>
                Dette verktøyet gir AI-støttede forslag. Kommunen har alltid det endelige ansvaret for innhold og lovsamsvar.
              </span>
            </div>
            <div className="text-sm text-gray-500">
              v2026.1 | 100% compliance
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}