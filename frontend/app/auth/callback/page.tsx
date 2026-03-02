'use client'
// @ts-nocheck

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          router.push('/auth/login?error=auth_failed')
          return
        }

        if (data.session) {
          // Check if user has valid tenant
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('tenant_id, role')
            .eq('id', data.session.user.id)
            .single()

          if (userError || !userData) {
            // User not found in database, redirect to login
            await supabase.auth.signOut()
            router.push('/auth/login?error=user_not_found')
            return
          }

          // User is valid, redirect to dashboard
          router.push('/dashboard')
        } else {
          router.push('/auth/login?error=no_session')
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        router.push('/auth/login?error=callback_failed')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Logger inn...</p>
      </div>
    </div>
  )
}
