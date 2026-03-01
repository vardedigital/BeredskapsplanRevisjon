'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react'

interface DocumentUploadProps {
  sessionId: string
  tenantId: string
  userId: string
  onUploadComplete: () => void
}

interface UploadedFile {
  id: string
  name: string
  type: string
  status: 'uploading' | 'completed' | 'error'
  error?: string
}

export default function DocumentUpload({ sessionId, tenantId, userId, onUploadComplete }: DocumentUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [customInstructions, setCustomInstructions] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  const requiredDocuments = [
    { type: 'ros', label: 'ROS-analyse', description: 'Helhetlig risiko- og sårbarhetsanalyse' },
    { type: 'plan_integrert', label: 'Integrert beredskapsplan', description: 'Én samlet plan (alternativ A)' },
    { type: 'plan_administrativ', label: 'Administrativ del', description: 'Administrativ del av planen (alternativ B)' },
    { type: 'plan_operativ', label: 'Operativ del', description: 'Operativ del av planen (alternativ B)' }
  ]

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsUploading(true)

    for (const file of acceptedFiles) {
      const fileId = `${Date.now()}-${file.name}`
      
      setUploadedFiles(prev => [...prev, {
        id: fileId,
        name: file.name,
        type: file.type,
        status: 'uploading'
      }])

      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('documentType', determineDocumentType(file.name))
        formData.append('sessionId', sessionId)
        formData.append('tenantId', tenantId)
        formData.append('userId', userId)

        const response = await fetch('/api/upload-document', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          throw new Error('Upload failed')
        }

        const result = await response.json()

        setUploadedFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, status: 'completed' } : f
        ))

      } catch (error) {
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, status: 'error', error: 'Opplasting feilet' } : f
        ))
      }
    }

    setIsUploading(false)
  }, [sessionId, tenantId, userId])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 4
  })

  function determineDocumentType(fileName: string): string {
    const lowerName = fileName.toLowerCase()
    
    if (lowerName.includes('ros') || lowerName.includes('risiko')) {
      return 'ros'
    } else if (lowerName.includes('administrativ')) {
      return 'plan_administrativ'
    } else if (lowerName.includes('operativ')) {
      return 'plan_operativ'
    } else {
      return 'plan_integrert'
    }
  }

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const handleStartRevision = async () => {
    if (uploadedFiles.filter(f => f.status === 'completed').length < 2) {
      alert('Du må laste opp minst ROS og en beredskapsplan')
      return
    }

    try {
      const response = await fetch('/api/analyze-documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          customInstructions
        })
      })

      if (!response.ok) {
        throw new Error('Analysis failed')
      }

      onUploadComplete()
    } catch (error) {
      alert('Revisjon feilet. Prøv igjen.')
    }
  }

  const completedFiles = uploadedFiles.filter(f => f.status === 'completed')

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        {isDragActive ? (
          <p className="text-lg text-gray-700">Slipp filene her...</p>
        ) : (
          <div>
            <p className="text-lg text-gray-700 mb-2">
              Dra og slipp dokumenter her, eller klikk for å velge
            </p>
            <p className="text-sm text-gray-500">
              Godkjente formater: PDF, DOC, DOCX, TXT
            </p>
          </div>
        )}
      </div>

      {/* Required Documents Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-3">Påkrevde dokumenter:</h3>
        <ul className="space-y-2">
          {requiredDocuments.map(doc => (
            <li key={doc.type} className="flex items-start gap-2 text-sm text-blue-800">
              <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium">{doc.label}</span>
                <span className="text-blue-600"> - {doc.description}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900">Opplastede filer</h3>
          {uploadedFiles.map(file => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 bg-white border rounded-lg"
            >
              <div className="flex items-center gap-3">
                {file.status === 'completed' && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
                {file.status === 'error' && (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
                {file.status === 'uploading' && (
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                )}
                <div>
                  <div className="font-medium text-gray-900">{file.name}</div>
                  {file.error && (
                    <div className="text-sm text-red-600">{file.error}</div>
                  )}
                </div>
              </div>
              <button
                onClick={() => removeFile(file.id)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Custom Instructions */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tilleggsinstruksjoner for revisjonen (valgfritt)
        </label>
        <textarea
          value={customInstructions}
          onChange={(e) => setCustomInstructions(e.target.value)}
          placeholder="F.eks. 'Fokus på helseberedskap og legevakt' eller 'Kortere plan, mer operativ'"
          maxLength={300}
          rows={3}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div className="text-sm text-gray-500 mt-1">
          {customInstructions.length}/300 tegn
        </div>
      </div>

      {/* Start Revision Button */}
      <button
        onClick={handleStartRevision}
        disabled={completedFiles.length < 2 || isUploading}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {isUploading ? 'Laster opp...' : 'Start revisjon'}
      </button>

      {/* Security Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-yellow-800">
            <strong>Sikkerhetsinformasjon:</strong> Alle opplastede dokumenter behandles midlertidig og slettes automatisk etter revisjonen er fullført. Ingen data lagres permanent.
          </div>
        </div>
      </div>
    </div>
  )
}