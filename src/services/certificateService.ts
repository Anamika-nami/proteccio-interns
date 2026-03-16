import { createClient } from '@/lib/supabase/server'
import type { CertificateData } from '@/types'
import { logActivity } from '@/lib/logger'

export class CertificateService {
  /**
   * Generate certificate data for an intern
   */
  static async generateCertificateData(
    internId: string
  ): Promise<{ success: boolean; data?: CertificateData; error?: string }> {
    try {
      const supabase = await createClient()

      // Fetch intern details
      const { data: intern, error } = await supabase
        .from('intern_profiles')
        .select('id, full_name, cohort, status, created_at')
        .eq('id', internId)
        .single()

      if (error || !intern) {
        return { success: false, error: 'Intern not found' }
      }

      // Verify intern has completed internship
      if (intern.status !== 'COMPLETED') {
        return { 
          success: false, 
          error: 'Certificate can only be generated for completed internships' 
        }
      }

      // Calculate duration
      const startDate = new Date(intern.created_at)
      const endDate = new Date()
      const months = Math.floor(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
      )

      const certificateData: CertificateData = {
        intern_name: intern.full_name,
        role: `${intern.cohort} Intern`,
        organization: 'Proteccio Interns',
        duration: `${months} month${months !== 1 ? 's' : ''}`,
        completion_date: endDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        certificate_id: `CERT-${intern.id.substring(0, 8).toUpperCase()}`
      }

      return { success: true, data: certificateData }
    } catch (error) {
      console.error('Error generating certificate data:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Upload certificate PDF to Supabase Storage
   */
  static async uploadCertificate(
    internId: string,
    pdfBlob: Blob,
    userId: string
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const supabase = await createClient()

      const fileName = `certificate_${internId}_${Date.now()}.pdf`
      const filePath = `${internId}/${fileName}`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('certificates')
        .upload(filePath, pdfBlob, {
          contentType: 'application/pdf',
          upsert: false
        })

      if (error) {
        console.error('Error uploading certificate:', error)
        return { success: false, error: error.message }
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('certificates')
        .getPublicUrl(filePath)

      // Log activity
      await logActivity({
        userId: userId,
        action: 'certificate_generated',
        entityType: 'intern_profile',
        entityId: internId,
        metadata: { file_path: filePath },
        category: 'action'
      })

      return { success: true, url: urlData.publicUrl }
    } catch (error) {
      console.error('Error in uploadCertificate:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Get certificate download URL
   */
  static async getCertificateUrl(
    internId: string
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const supabase = await createClient()

      // List files for this intern
      const { data: files, error } = await supabase.storage
        .from('certificates')
        .list(internId, {
          limit: 1,
          sortBy: { column: 'created_at', order: 'desc' }
        })

      if (error || !files || files.length === 0) {
        return { success: false, error: 'Certificate not found' }
      }

      const filePath = `${internId}/${files[0].name}`

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('certificates')
        .getPublicUrl(filePath)

      return { success: true, url: urlData.publicUrl }
    } catch (error) {
      console.error('Error in getCertificateUrl:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Check if certificate exists for intern
   */
  static async hasCertificate(internId: string): Promise<boolean> {
    try {
      const supabase = await createClient()

      const { data: files, error } = await supabase.storage
        .from('certificates')
        .list(internId, { limit: 1 })

      if (error) {
        console.error('Error checking certificate:', error)
        return false
      }

      return files && files.length > 0
    } catch (error) {
      console.error('Error in hasCertificate:', error)
      return false
    }
  }
}
