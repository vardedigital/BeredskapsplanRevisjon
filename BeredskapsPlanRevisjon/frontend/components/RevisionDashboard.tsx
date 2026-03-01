'use client'

import { useState, useEffect } from 'react'
import { Shield, FileText, List, ClipboardCheck, Download, AlertTriangle, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface RevisionDashboardProps {
  sessionId: string
  language: 'bokmal' | 'nynorsk'
}

type TabType = 'overview' | 'plan' | 'changes' | 'exercises' | 'supervision'

export default function RevisionDashboard({ sessionId, language }: RevisionDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [session, setSession] = useState<any>(null)
  const [changes, setChanges] = useState<any[]>([])
  const [exercisePlans, setExercisePlans] = useState<any[]>([])
  const [supervisionChecklist, setSupervisionChecklist] = useState<any[]>([])
  const [updatedPlan, setUpdatedPlan] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSessionData()
  }, [sessionId])

  const loadSessionData = async () => {
    try {
      // Load session
      const { data: sessionData } = await supabase
        .from('revision_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .single()

      setSession(sessionData)

      // Load changes
      const { data: changesData } = await supabase
        .from('revision_changes')
        .select('*')
        .eq('session_id', sessionId)
        .order('priority', { ascending: false })

      setChanges(changesData || [])

      // Load exercise plans
      const { data: exercisesData } = await supabase
        .from('exercise_plans')
        .select('*')
        .eq('session_id', sessionId)

      setExercisePlans(exercisesData || [])

      // Load supervision checklist
      const { data: checklistData } = await supabase
        .from('supervision_checklists')
        .select('*')
        .eq('session_id', sessionId)

      setSupervisionChecklist(checklistData || [])

      // Load updated plan
      const { data: planData } = await supabase
        .from('revision_results')
        .select('*')
        .eq('session_id', sessionId)
        .eq('result_type', 'updated_plan')
        .single()

      setUpdatedPlan(planData?.content || '')

      setLoading(false)
    } catch (error) {
      console.error('Error loading session data:', error)
      setLoading(false)
    }
  }

  const mustChanges = changes.filter(c => c.priority === 'MUST')
  const shouldChanges = changes.filter(c => c.priority === 'SHOULD')

  const tabs = [
    { id: 'overview' as TabType, label: 'Oversikt', icon: Shield },
    { id: 'plan' as TabType, label: 'Ny plan', icon: FileText },
    { id: 'changes' as TabType, label: 'Endringslogg', icon: List },
    { id: 'exercises' as TabType, label: 'Øvingsplan', icon: ClipboardCheck },
    { id: 'supervision' as TabType, label: 'Tilsynsmodus', icon: CheckCircle }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Compliance Score Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Revisjon fullført</h2>
            <p className="text-blue-100">
              Compliance-basis sist oppdatert: {session?.compliance_version || 'Ukjent'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold">{session?.compliance_score || 0}%</div>
            <div className="text-blue-100">Compliance-score</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
              {tab.id === 'changes' && mustChanges.length > 0 && (
                <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">
                  {mustChanges.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow p-6">
        {activeTab === 'overview' && (
          <OverviewTab 
            mustChanges={mustChanges} 
            shouldChanges={shouldChanges}
            exercisePlans={exercisePlans}
            supervisionChecklist={supervisionChecklist}
          />
        )}

        {activeTab === 'plan' && (
          <PlanTab content={updatedPlan} language={language} />
        )}

        {activeTab === 'changes' && (
          <ChangesTab mustChanges={mustChanges} shouldChanges={shouldChanges} />
        )}

        {activeTab === 'exercises' && (
          <ExercisesTab exercises={exercisePlans} />
        )}

        {activeTab === 'supervision' && (
          <SupervisionTab checklist={supervisionChecklist} />
        )}
      </div>

      {/* Download Section */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Last ned resultater</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <DownloadButton label="Oppdatert plan" format="docx" />
          <DownloadButton label="Endringslogg" format="pdf" />
          <DownloadButton label="Øvingsplan" format="pdf" />
          <DownloadButton label="Tilsynsrapport" format="pdf" />
        </div>
      </div>
    </div>
  )
}

function OverviewTab({ mustChanges, shouldChanges, exercisePlans, supervisionChecklist }: any) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          label="MUST-endringer" 
          value={mustChanges.length} 
          color={mustChanges.length > 0 ? 'red' : 'green'}
          icon={AlertTriangle}
        />
        <StatCard 
          label="SHOULD-endringer" 
          value={shouldChanges.length} 
          color="blue"
          icon={FileText}
        />
        <StatCard 
          label="Øvelser foreslått" 
          value={exercisePlans.length} 
          color="purple"
          icon={ClipboardCheck}
        />
        <StatCard 
          label="Tilsynskrav" 
          value={supervisionChecklist.length} 
          color="orange"
          icon={CheckCircle}
        />
      </div>

      {/* Critical Changes */}
      {mustChanges.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Kritiske endringer (MUST)
          </h3>
          <div className="space-y-3">
            {mustChanges.slice(0, 5).map((change: any) => (
              <div key={change.id} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-red-900">{change.section}</div>
                    <div className="text-sm text-red-700 mt-1">{change.new_text}</div>
                  </div>
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                    {change.source}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-yellow-800">
            <strong>Ansvarsfraskrivelse:</strong> Dette verktøyet gir AI-støttede forslag. Kommunen og beredskapsledelsen har alltid det endelige ansvaret for innhold og lovsamsvar. Manuell juridisk kontroll anbefales før endelig godkjenning.
          </div>
        </div>
      </div>
    </div>
  )
}

function PlanTab({ content, language }: { content: string, language: 'bokmal' | 'nynorsk' }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Oppdatert beredskapsplan</h3>
        <DownloadButton label="Last ned Word" format="docx" />
      </div>
      <div className="prose max-w-none">
        <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700">
          {content}
        </pre>
      </div>
    </div>
  )
}

function ChangesTab({ mustChanges, shouldChanges }: any) {
  return (
    <div className="space-y-6">
      {mustChanges.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            MUST-endringer (Påkrevd)
          </h3>
          <div className="space-y-3">
            {mustChanges.map((change: any) => (
              <ChangeCard key={change.id} change={change} priority="MUST" />
            ))}
          </div>
        </div>
      )}

      {shouldChanges.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            SHOULD/COULD-endringer (Beste praksis)
          </h3>
          <div className="space-y-3">
            {shouldChanges.map((change: any) => (
              <ChangeCard key={change.id} change={change} priority="SHOULD" />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ExercisesTab({ exercises }: any) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Foreslått øvingsplan</h3>
        <DownloadButton label="Last ned PDF" format="pdf" />
      </div>
      <div className="space-y-4">
        {exercises.map((exercise: any) => (
          <div key={exercise.id} className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h4 className="font-semibold text-purple-900 mb-2">{exercise.exercise_name}</h4>
            <div className="space-y-2 text-sm text-purple-800">
              <p><strong>Scenario:</strong> {exercise.scenario}</p>
              <p><strong>Hovedmål:</strong> {exercise.main_goal}</p>
              <p><strong>Frekvens:</strong> {exercise.suggested_frequency || 'Ikke spesifisert'}</p>
              <p><strong>Ansvarlig:</strong> {exercise.responsible_role || 'Ikke spesifisert'}</p>
              {exercise.evaluation_required && (
                <p className="text-purple-600">⚠️ Evaluering og erfaringsoppsummering påkrevd</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SupervisionTab({ checklist }: any) {
  const [manualChecks, setManualChecks] = useState<Record<string, boolean>>({})

  const toggleManualCheck = (id: string) => {
    setManualChecks(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const coveredCount = checklist.filter((item: any) => item.ai_assessment === 'covered').length
  const partiallyCount = checklist.filter((item: any) => item.ai_assessment === 'partially_covered').length
  const notCoveredCount = checklist.filter((item: any) => item.ai_assessment === 'not_covered').length

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">{coveredCount}</div>
          <div className="text-sm text-green-700">Dekket</div>
        </div>
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
          <div className="text-2xl font-bold text-yellow-600">{partiallyCount}</div>
          <div className="text-sm text-yellow-700">Delvis dekket</div>
        </div>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
          <div className="text-2xl font-bold text-red-600">{notCoveredCount}</div>
          <div className="text-sm text-red-700">Ikke dekket</div>
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-3">
        {checklist.map((item: any) => (
          <div key={item.id} className="p-4 border rounded-lg">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={manualChecks[item.id] || false}
                onChange={() => toggleManualCheck(item.id)}
                className="mt-1 w-4 h-4 text-blue-600 rounded"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-1 rounded ${
                    item.ai_assessment === 'covered' ? 'bg-green-100 text-green-700' :
                    item.ai_assessment === 'partially_covered' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {item.ai_assessment === 'covered' ? 'Dekket' :
                     item.ai_assessment === 'partially_covered' ? 'Delvis' : 'Ikke dekket'}
                  </span>
                  <span className="text-xs text-gray-500">{item.source}</span>
                </div>
                <div className="font-medium text-gray-900">{item.requirement_area}</div>
                <div className="text-sm text-gray-600 mt-1">{item.requirement_text}</div>
                {item.chapter_reference && (
                  <div className="text-xs text-gray-500 mt-1">Kapittel: {item.chapter_reference}</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <DownloadButton label="Last ned tilsynsrapport" format="pdf" />
    </div>
  )
}

function ChangeCard({ change, priority }: any) {
  const bgColor = priority === 'MUST' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
  const textColor = priority === 'MUST' ? 'text-red-900' : 'text-blue-900'

  return (
    <div className={`p-4 border rounded-lg ${bgColor}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="font-semibold ${textColor}">{change.section}</div>
        <span className={`text-xs px-2 py-1 rounded ${
          priority === 'MUST' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
        }`}>
          {change.source}
        </span>
      </div>
      {change.old_text && (
        <div className="mb-2">
          <div className="text-xs font-medium text-gray-500 mb-1">Gammel tekst:</div>
          <div className="text-sm text-gray-600 line-through">{change.old_text}</div>
        </div>
      )}
      <div>
        <div className="text-xs font-medium text-gray-500 mb-1">Ny tekst:</div>
        <div className="text-sm text-gray-900">{change.new_text}</div>
      </div>
      {change.chapter_reference && (
        <div className="text-xs text-gray-500 mt-2">Kapittel: {change.chapter_reference}</div>
      )}
    </div>
  )
}

function StatCard({ label, value, color, icon: Icon }: any) {
  const colorClasses = {
    red: 'bg-red-50 border-red-200 text-red-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
    orange: 'bg-orange-50 border-orange-200 text-orange-600'
  }

  return (
    <div className={`p-4 border rounded-lg ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <Icon className="w-5 h-5" />
        <div className="text-2xl font-bold">{value}</div>
      </div>
      <div className="text-sm mt-1">{label}</div>
    </div>
  )
}

function DownloadButton({ label, format }: { label: string, format: string }) {
  return (
    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
      <Download className="w-4 h-4" />
      <span className="text-sm font-medium">{label}</span>
      <span className="text-xs text-gray-500 uppercase">{format}</span>
    </button>
  )
}