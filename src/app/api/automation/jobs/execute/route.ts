/**
 * JOB EXECUTION API
 * 
 * Endpoint for cron worker to execute scheduled jobs
 * Can be called by external cron or internal scheduler
 */

import { NextRequest, NextResponse } from 'next/server'
import { JobScheduler } from '@/services/automation/JobScheduler'

export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication for cron endpoint
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Execute all due jobs
    const results = await JobScheduler.executeDueJobs()
    
    return NextResponse.json({
      message: 'Jobs executed successfully',
      results: results,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error in POST /api/automation/jobs/execute:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function GET(request: NextRequest) {
  try {
    const stats = await JobScheduler.getJobStatistics()
    
    return NextResponse.json({
      status: 'healthy',
      statistics: stats,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: 'Failed to get statistics' },
      { status: 500 }
    )
  }
}
