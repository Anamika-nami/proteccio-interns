import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/permissions'
import { AISuggestionService } from '@/services/aiSuggestionService'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = await getUserRole(user.id)
    
    if (role === 'intern') {
      return await getInternDashboard(user.id, supabase)
    } else if (role === 'admin') {
      return await getAdminDashboard(user.id, supabase)
    } else {
      return NextResponse.json({ error: 'Invalid role' }, { status: 403 })
    }

  } catch (error) {
    console.error('Error fetching dashboard insights:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}

async function getInternDashboard(userId: string, supabase: any) {
  // Get intern profile
  const { data: profile } = await supabase
    .from('intern_profiles')
    .select('id, full_name, cohort, skills')
    .eq('user_id', userId)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Intern profile not found' }, { status: 404 })
  }

  // Get today's date
  const today = new Date().toISOString().split('T')[0]
  const startOfWeek = new Date()
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
  const weekStart = startOfWeek.toISOString().split('T')[0]

  // Get today's tasks
  const { data: todaysTasks } = await supabase
    .from('tasks')
    .select(`
      *,
      collaboration_count:collaboration_threads(count),
      unread_comments:collaboration_threads(
        comments:collaboration_comments(count)
      )
    `)
    .eq('assigned_to', profile.id)
    .gte('due_date', today)
    .lte('due_date', today + 'T23:59:59')
    .order('due_date')

  // Get pending tasks
  const { data: pendingTasks } = await supabase
    .from('tasks')
    .select(`
      *,
      collaboration_count:collaboration_threads(count)
    `)
    .eq('assigned_to', profile.id)
    .in('status', ['todo', 'in_progress'])
    .lt('due_date', today)
    .order('due_date')
    .limit(5)

  // Get attendance streak
  const { data: attendanceData } = await supabase
    .from('attendance')
    .select('date, status')
    .eq('intern_id', profile.id)
    .order('date', { ascending: false })
    .limit(30)

  let attendanceStreak = 0
  for (const record of attendanceData || []) {
    if (record.status === 'present') {
      attendanceStreak++
    } else {
      break
    }
  }

  // Get learning hours this week
  const { data: learningData } = await supabase
    .from('learning_logs')
    .select('time_spent_hours')
    .eq('intern_id', profile.id)
    .gte('created_at', weekStart)
    .eq('verification_status', 'verified')

  const learningHoursWeek = learningData?.reduce((sum: number, log: any) => sum + log.time_spent_hours, 0) || 0

  // Get unread notifications
  const { data: notifications } = await supabase
    .from('notifications')
    .select('id')
    .eq('user_id', userId)
    .eq('is_read', false)

  // Generate insights
  const insights = await generateInternInsights(profile, supabase)

  // Get personalized recommendations
  const recommendations = await getPersonalizedRecommendations(profile, supabase)

  // Get existing dashboard insights
  const { data: existingInsights } = await supabase
    .from('dashboard_insights')
    .select('*')
    .eq('user_id', userId)
    .eq('is_dismissed', false)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order('priority', { ascending: false })
    .limit(5)

  return NextResponse.json({
    insights: existingInsights || [],
    recommendations: recommendations || [],
    stats: {
      tasks_today: todaysTasks?.length || 0,
      pending_tasks: pendingTasks?.length || 0,
      attendance_streak: attendanceStreak,
      learning_hours_week: learningHoursWeek,
      unread_notifications: notifications?.length || 0
    },
    todaysTasks: todaysTasks || [],
    pendingTasks: pendingTasks || []
  })
}

async function getAdminDashboard(userId: string, supabase: any) {
  // Get admin dashboard data
  const today = new Date().toISOString().split('T')[0]

  // Get pending verifications
  const { data: pendingLogs } = await supabase
    .from('learning_logs')
    .select('id')
    .eq('verification_status', 'pending')

  const { data: pendingEvaluations } = await supabase
    .from('intern_profiles')
    .select('id')
    .eq('approval_status', 'pending')

  // Get open mentorship conversations
  const { data: openConversations } = await supabase
    .from('mentorship_conversations')
    .select('id')
    .eq('mentor_id', userId)
    .eq('status', 'open')

  // Get today's attendance
  const { data: todaysAttendance } = await supabase
    .from('attendance')
    .select('id, status')
    .eq('date', today)

  const presentCount = todaysAttendance?.filter((a: any) => a.status === 'present').length || 0
  const totalInterns = todaysAttendance?.length || 0

  return NextResponse.json({
    insights: [],
    recommendations: [],
    stats: {
      pending_verifications: pendingLogs?.length || 0,
      pending_evaluations: pendingEvaluations?.length || 0,
      open_conversations: openConversations?.length || 0,
      attendance_rate: totalInterns > 0 ? Math.round((presentCount / totalInterns) * 100) : 0
    },
    todaysTasks: [],
    pendingTasks: []
  })
}

async function generateInternInsights(profile: any, supabase: any) {
  const insights = []
  const today = new Date()
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Check for overdue tasks
  const { data: overdueTasks } = await supabase
    .from('tasks')
    .select('id, title')
    .eq('assigned_to', profile.id)
    .lt('due_date', today.toISOString())
    .in('status', ['todo', 'in_progress'])

  if (overdueTasks && overdueTasks.length > 0) {
    insights.push({
      type: 'overdue_tasks',
      title: 'Overdue Tasks Need Attention',
      description: `You have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}. Consider reaching out for help if you're stuck.`,
      priority: 3,
      data: { task_count: overdueTasks.length }
    })
  }

  // Check learning activity
  const { data: recentLearning } = await supabase
    .from('learning_logs')
    .select('id')
    .eq('intern_id', profile.id)
    .gte('created_at', weekAgo.toISOString())

  if (!recentLearning || recentLearning.length === 0) {
    insights.push({
      type: 'learning_reminder',
      title: 'Time to Log Some Learning',
      description: 'You haven\'t logged any learning activities this week. Document your progress to track your growth!',
      priority: 2,
      data: {}
    })
  }

  // Check for collaboration opportunities
  const { data: tasksWithoutCollaboration } = await supabase
    .from('tasks')
    .select(`
      id, title,
      collaboration_threads(id)
    `)
    .eq('assigned_to', profile.id)
    .eq('status', 'in_progress')

  const tasksNeedingHelp = tasksWithoutCollaboration?.filter((task: any) => 
    !task.collaboration_threads || task.collaboration_threads.length === 0
  ) || []

  if (tasksNeedingHelp.length > 0) {
    insights.push({
      type: 'collaboration_suggestion',
      title: 'Consider Starting Discussions',
      description: `You have ${tasksNeedingHelp.length} active task${tasksNeedingHelp.length > 1 ? 's' : ''} without any discussions. Collaboration can help you move faster!`,
      priority: 1,
      data: { task_count: tasksNeedingHelp.length }
    })
  }

  return insights
}

async function getPersonalizedRecommendations(profile: any, supabase: any) {
  // Get user's current tasks to understand what they're working on
  const { data: currentTasks } = await supabase
    .from('tasks')
    .select('title, description')
    .eq('assigned_to', profile.id)
    .in('status', ['todo', 'in_progress'])
    .limit(5)

  if (!currentTasks || currentTasks.length === 0) {
    // Return general beginner resources
    const { data: beginnerResources } = await supabase
      .from('knowledge_resources')
      .select('*')
      .eq('difficulty_level', 'beginner')
      .eq('is_featured', true)
      .limit(3)

    return beginnerResources || []
  }

  // Extract keywords from current tasks
  const taskContent = currentTasks
    .map((task: any) => `${task.title} ${task.description || ''}`)
    .join(' ')
    .toLowerCase()

  // Find relevant resources based on task keywords
  const keywords = extractKeywords(taskContent)
  
  if (keywords.length === 0) {
    return []
  }

  const { data: relevantResources } = await supabase
    .from('knowledge_resources')
    .select('*')
    .or(keywords.map(keyword => `title.ilike.%${keyword}%`).join(','))
    .limit(5)

  return relevantResources || []
}

function extractKeywords(text: string): string[] {
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'])
  
  return text
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !commonWords.has(word))
    .slice(0, 5)
}