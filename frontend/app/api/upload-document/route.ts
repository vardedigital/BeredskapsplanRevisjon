import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const documentType = formData.get('documentType') as string
    const sessionId = formData.get('sessionId') as string
    const tenantId = formData.get('tenantId') as string
    const userId = formData.get('userId') as string

    if (!file || !documentType || !sessionId || !tenantId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Forward to Supabase Edge Function
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/upload-document`

    const edgeFormData = new FormData()
    edgeFormData.append('file', file)
    edgeFormData.append('documentType', documentType)
    edgeFormData.append('sessionId', sessionId)
    edgeFormData.append('tenantId', tenantId)
    edgeFormData.append('userId', userId)

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      body: edgeFormData
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(error)
    }

    const result = await response.json()
    return NextResponse.json(result)

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}