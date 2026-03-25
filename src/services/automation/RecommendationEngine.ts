/**
 * RECOMMENDATION ENGINE
 * 
 * Heuristic-based recommendation system for interns and admins.
 * Uses performance metrics, skills, and patterns to generate suggestions.
 * 
 * For Interns:
 * - Task suggestions based on skills
 * - Skill development recommendations
 * - Learning resource suggestions
 * 
 * For Admins:
 * - Interns ready for evaluation
 * - Interns at risk
 * - High/low performers
 */

import { createClient } from '@/lib/supabase/server'

export class RecommendationEngine {
  
  /**
   * Generate recommendations for an intern
   */
  static async generateInternRecommendations(internId: string): Promise<{
    tasks: any[]
    skills: any[]
    resources: any[]
  }> {
    const supabase = await createClient()
    
    // Get intern profile and performance metrics
    const { data: intern } = await supabase
      .from('intern_profiles')
      .select('id, full_name, skills, user_id')
      .eq('id', internId)
      .single()
    
    if (!intern) {
      return { tasks: [], skills: [], resources: [] }
    }
    
    // Get performance metrics
    const { data: metrics } = await supabase
      .from('mv_intern_performance_metrics')
      .select('*')
      .eq('intern_id', internId)
      .single()
    
    // Generate recommendations
    const taskRecommendations = await this.recommendTasks(intern, metrics)
    const skillRecommendations = await this.recommendSkills(intern, metrics)
    const resourceRecommendations = await this.recommendResources(intern, metrics)
    
    // Cache recommendations
    await this.cacheRecommendations(intern.user_id, 'intern', {
      tasks: taskRecommendations,
      skills: skillRecommendations,
      resources: resourceRecommendations
    })
    
    return {
      tasks: taskRecommendations,
      skills: skillRecommendations,
      resources: resourceRecommendations
    }
  }
  
  /**
   * Recommend tasks based on skills
   */
  private static async recommendTasks(intern: any, metrics: any): Promise<any[]> {
    const supabase = await createClient()
    const recommendations: any[] = []
    
    // Get available tasks matching intern's skills
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title, description, priority, due_date')
      .is('assigned_to', null)
      .eq('status', 'todo')
      .is('deleted_at', null)
      .limit(10)
    
    if (!tasks) return recommendations
    
    const internSkills = intern.skills || []
    
    for (const task of tasks) {
      let matchScore = 0
      let matchReason = ''
      
      // Simple keyword matching in title/description
      const taskText = `${task.title} ${task.description || ''}`.toLowerCase()
      
      for (const skill of internSkills) {
        if (taskText.includes(skill.toLowerCase())) {
          matchScore += 10
          matchReason = `Matches your ${skill} skills`
          break
        }
      }
      
      // Boost score for high priority tasks
      if (task.priority === 'high' || task.priority === 'urgent') {
        matchScore += 5
      }
      
      // Boost score if intern has low task count
      if (metrics && metrics.total_tasks < 5) {
        matchScore += 3
        matchReason = matchReason || 'Good starter task'
      }
      
      if (matchScore > 0) {
        recommendations.push({
          task_id: task.id,
          title: task.title,
          description: task.description,
          priority: task.priority,
          due_date: task.due_date,
          match_score: matchScore,
          reason: matchReason || 'Recommended for you',
          confidence: Math.min(1.0, matchScore / 20)
        })
      }
    }
    
    // Sort by match score
    recommendations.sort((a, b) => b.match_score - a.match_score)
    
    return recommendations.slice(0, 5)
  }
  
  /**
   * Recommend skills to learn
   */
  private static async recommendSkills(intern: any, metrics: any): Promise<any[]> {
    const supabase = await createClient()
    const recommendations: any[] = []
    
    const internSkills = intern.skills || []
    
    // Define skill progression paths
    const skillPaths: Record<string, string[]> = {
      'JavaScript': ['TypeScript', 'React', 'Node.js', 'Next.js'],
      'TypeScript': ['React', 'Node.js', 'Next.js', 'GraphQL'],
      'React': ['Next.js', 'Redux', 'React Native', 'Testing'],
      'Python': ['Django', 'FastAPI', 'Data Science', 'Machine Learning'],
      'HTML': ['CSS', 'JavaScript', 'React', 'Accessibility'],
      'CSS': ['Sass', 'Tailwind', 'Responsive Design', 'Animations'],
      'SQL': ['PostgreSQL', 'Database Design', 'Query Optimization', 'NoSQL'],
      'Git': ['GitHub Actions', 'CI/CD', 'DevOps', 'Docker']
    }
    
    // Find next skills based on current skills
    const suggestedSkills = new Set<string>()
    
    for (const skill of internSkills) {
      const nextSkills = skillPaths[skill] || []
      for (const nextSkill of nextSkills) {
        if (!internSkills.includes(nextSkill)) {
          suggestedSkills.add(nextSkill)
        }
      }
    }
    
    // If no skills or no progression, suggest popular skills
    if (suggestedSkills.size === 0) {
      const popularSkills = ['JavaScript', 'React', 'TypeScript', 'Python', 'SQL', 'Git']
      for (const skill of popularSkills) {
        if (!internSkills.includes(skill)) {
          suggestedSkills.add(skill)
        }
      }
    }
    
    // Get demand for each skill (count tasks requiring it)
    for (const skill of Array.from(suggestedSkills)) {
      const { count } = await supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .or(`title.ilike.%${skill}%,description.ilike.%${skill}%`)
        .is('deleted_at', null)
      
      const demand = count || 0
      
      recommendations.push({
        skill: skill,
        reason: internSkills.length > 0 
          ? `Natural progression from ${internSkills[0]}`
          : 'Highly valuable skill',
        demand: demand,
        priority: demand > 5 ? 'high' : demand > 2 ? 'medium' : 'low',
        confidence: Math.min(1.0, (demand + 5) / 15)
      })
    }
    
    // Sort by demand
    recommendations.sort((a, b) => b.demand - a.demand)
    
    return recommendations.slice(0, 5)
  }
  
  /**
   * Recommend learning resources
   */
  private static async recommendResources(intern: any, metrics: any): Promise<any[]> {
    const supabase = await createClient()
    const recommendations: any[] = []
    
    // Get knowledge resources matching intern's skills
    const { data: resources } = await supabase
      .from('knowledge_resources')
      .select('id, title, description, content_type, category, difficulty_level, tags')
      .limit(20)
    
    if (!resources) return recommendations
    
    const internSkills = intern.skills || []
    
    for (const resource of resources) {
      let matchScore = 0
      let matchReason = ''
      
      // Match by tags
      const resourceTags = resource.tags || []
      for (const skill of internSkills) {
        if (resourceTags.some((tag: string) => tag.toLowerCase().includes(skill.toLowerCase()))) {
          matchScore += 10
          matchReason = `Relevant to your ${skill} skills`
          break
        }
      }
      
      // Match by category
      if (resource.category && internSkills.some((s: string) => 
        resource.category.toLowerCase().includes(s.toLowerCase())
      )) {
        matchScore += 5
      }
      
      // Adjust for difficulty
      if (metrics) {
        const completionRate = metrics.task_completion_rate || 0
        
        if (completionRate > 80 && resource.difficulty_level === 'advanced') {
          matchScore += 5
          matchReason = matchReason || 'Ready for advanced content'
        } else if (completionRate < 50 && resource.difficulty_level === 'beginner') {
          matchScore += 5
          matchReason = matchReason || 'Good starting point'
        } else if (resource.difficulty_level === 'intermediate') {
          matchScore += 3
        }
      }
      
      if (matchScore > 0) {
        recommendations.push({
          resource_id: resource.id,
          title: resource.title,
          description: resource.description,
          content_type: resource.content_type,
          difficulty_level: resource.difficulty_level,
          match_score: matchScore,
          reason: matchReason || 'Recommended for you',
          confidence: Math.min(1.0, matchScore / 20)
        })
      }
    }
    
    // Sort by match score
    recommendations.sort((a, b) => b.match_score - a.match_score)
    
    return recommendations.slice(0, 5)
  }
  
  /**
   * Generate admin recommendations
   */
  static async generateAdminRecommendations(): Promise<{
    readyForEvaluation: any[]
    atRisk: any[]
    lowPerformers: any[]
    highPerformers: any[]
  }> {
    const supabase = await createClient()
    
    // Get all performance metrics
    const { data: metrics } = await supabase
      .from('mv_intern_performance_metrics')
      .select('*')
    
    if (!metrics) {
      return {
        readyForEvaluation: [],
        atRisk: [],
        lowPerformers: [],
        highPerformers: []
      }
    }
    
    const readyForEvaluation = this.identifyReadyForEvaluation(metrics)
    const atRisk = this.identifyAtRisk(metrics)
    const lowPerformers = this.identifyLowPerformers(metrics)
    const highPerformers = this.identifyHighPerformers(metrics)
    
    // Cache recommendations
    const { data: admins } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')
    
    if (admins) {
      for (const admin of admins) {
        await this.cacheRecommendations(admin.id, 'admin', {
          readyForEvaluation,
          atRisk,
          lowPerformers,
          highPerformers
        })
      }
    }
    
    return {
      readyForEvaluation,
      atRisk,
      lowPerformers,
      highPerformers
    }
  }
  
  /**
   * Identify interns ready for evaluation
   */
  private static identifyReadyForEvaluation(metrics: any[]): any[] {
    const ready: any[] = []
    
    for (const intern of metrics) {
      let readyScore = 0
      const reasons: string[] = []
      
      // Check task completion
      if (intern.tasks_completed >= 10) {
        readyScore += 30
        reasons.push(`Completed ${intern.tasks_completed} tasks`)
      }
      
      // Check attendance
      if (intern.attendance_percentage >= 80) {
        readyScore += 20
        reasons.push(`${intern.attendance_percentage}% attendance`)
      }
      
      // Check work logs
      if (intern.worklog_count >= 20) {
        readyScore += 20
        reasons.push(`${intern.worklog_count} work logs submitted`)
      }
      
      // Check time since last evaluation
      if (intern.evaluation_count === 0) {
        readyScore += 30
        reasons.push('No evaluations yet')
      }
      
      if (readyScore >= 50) {
        ready.push({
          intern_id: intern.intern_id,
          full_name: intern.full_name,
          cohort: intern.cohort,
          readiness_score: readyScore,
          reasons: reasons,
          metrics: {
            tasks_completed: intern.tasks_completed,
            attendance_percentage: intern.attendance_percentage,
            worklog_count: intern.worklog_count,
            evaluation_count: intern.evaluation_count
          },
          confidence: Math.min(1.0, readyScore / 100)
        })
      }
    }
    
    // Sort by readiness score
    ready.sort((a, b) => b.readiness_score - a.readiness_score)
    
    return ready
  }
  
  /**
   * Identify at-risk interns
   */
  private static identifyAtRisk(metrics: any[]): any[] {
    const atRisk: any[] = []
    
    for (const intern of metrics) {
      let riskScore = 0
      const riskFactors: string[] = []
      
      // Low attendance
      if (intern.attendance_percentage < 70) {
        riskScore += 40
        riskFactors.push(`Low attendance: ${intern.attendance_percentage}%`)
      }
      
      // Overdue tasks
      if (intern.overdue_tasks > 3) {
        riskScore += 30
        riskFactors.push(`${intern.overdue_tasks} overdue tasks`)
      }
      
      // Low task completion
      if (intern.task_completion_rate < 50) {
        riskScore += 20
        riskFactors.push(`Low completion rate: ${intern.task_completion_rate}%`)
      }
      
      // Inactive
      if (intern.last_activity_at) {
        const daysSinceActivity = Math.floor(
          (Date.now() - new Date(intern.last_activity_at).getTime()) / (1000 * 60 * 60 * 24)
        )
        if (daysSinceActivity > 7) {
          riskScore += 30
          riskFactors.push(`Inactive for ${daysSinceActivity} days`)
        }
      }
      
      if (riskScore >= 40) {
        atRisk.push({
          intern_id: intern.intern_id,
          full_name: intern.full_name,
          cohort: intern.cohort,
          risk_score: riskScore,
          risk_factors: riskFactors,
          severity: riskScore >= 70 ? 'critical' : riskScore >= 50 ? 'high' : 'medium',
          metrics: {
            attendance_percentage: intern.attendance_percentage,
            overdue_tasks: intern.overdue_tasks,
            task_completion_rate: intern.task_completion_rate
          },
          confidence: Math.min(1.0, riskScore / 100)
        })
      }
    }
    
    // Sort by risk score
    atRisk.sort((a, b) => b.risk_score - a.risk_score)
    
    return atRisk
  }
  
  /**
   * Identify low performers
   */
  private static identifyLowPerformers(metrics: any[]): any[] {
    const lowPerformers: any[] = []
    
    for (const intern of metrics) {
      let performanceScore = 0
      
      // Task completion rate (40%)
      performanceScore += (intern.task_completion_rate || 0) * 0.4
      
      // Attendance (30%)
      performanceScore += (intern.attendance_percentage || 0) * 0.3
      
      // Evaluation score (30%)
      if (intern.avg_evaluation_score) {
        performanceScore += (intern.avg_evaluation_score / 5) * 100 * 0.3
      }
      
      if (performanceScore < 60 && intern.total_tasks > 5) {
        lowPerformers.push({
          intern_id: intern.intern_id,
          full_name: intern.full_name,
          cohort: intern.cohort,
          performance_score: Math.round(performanceScore),
          metrics: {
            task_completion_rate: intern.task_completion_rate,
            attendance_percentage: intern.attendance_percentage,
            avg_evaluation_score: intern.avg_evaluation_score,
            total_tasks: intern.total_tasks
          },
          recommendation: 'Requires additional support and mentoring',
          confidence: 0.85
        })
      }
    }
    
    // Sort by performance score (lowest first)
    lowPerformers.sort((a, b) => a.performance_score - b.performance_score)
    
    return lowPerformers
  }
  
  /**
   * Identify high performers
   */
  private static identifyHighPerformers(metrics: any[]): any[] {
    const highPerformers: any[] = []
    
    for (const intern of metrics) {
      let performanceScore = 0
      
      // Task completion rate (40%)
      performanceScore += (intern.task_completion_rate || 0) * 0.4
      
      // Attendance (30%)
      performanceScore += (intern.attendance_percentage || 0) * 0.3
      
      // Evaluation score (30%)
      if (intern.avg_evaluation_score) {
        performanceScore += (intern.avg_evaluation_score / 5) * 100 * 0.3
      }
      
      if (performanceScore >= 85 && intern.total_tasks > 5) {
        highPerformers.push({
          intern_id: intern.intern_id,
          full_name: intern.full_name,
          cohort: intern.cohort,
          performance_score: Math.round(performanceScore),
          metrics: {
            task_completion_rate: intern.task_completion_rate,
            attendance_percentage: intern.attendance_percentage,
            avg_evaluation_score: intern.avg_evaluation_score,
            total_tasks: intern.total_tasks,
            tasks_completed: intern.tasks_completed
          },
          recommendation: 'Consider for advanced projects or mentorship role',
          confidence: 0.90
        })
      }
    }
    
    // Sort by performance score (highest first)
    highPerformers.sort((a, b) => b.performance_score - a.performance_score)
    
    return highPerformers
  }
  
  /**
   * Cache recommendations
   */
  private static async cacheRecommendations(
    userId: string,
    userType: 'intern' | 'admin',
    recommendations: any
  ): Promise<void> {
    const supabase = await createClient()
    
    const types = userType === 'intern'
      ? ['task_suggestion', 'skill_suggestion', 'learning_resource']
      : ['intern_ready_for_evaluation', 'intern_at_risk', 'low_performer', 'high_performer']
    
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    
    for (const type of types) {
      let data: any
      
      if (userType === 'intern') {
        data = type === 'task_suggestion' ? recommendations.tasks
          : type === 'skill_suggestion' ? recommendations.skills
          : recommendations.resources
      } else {
        data = type === 'intern_ready_for_evaluation' ? recommendations.readyForEvaluation
          : type === 'intern_at_risk' ? recommendations.atRisk
          : type === 'low_performer' ? recommendations.lowPerformers
          : recommendations.highPerformers
      }
      
      await supabase
        .from('recommendation_cache')
        .upsert({
          user_id: userId,
          user_type: userType,
          recommendation_type: type,
          recommendations: data,
          confidence_score: data.length > 0 ? 0.85 : 0,
          expires_at: expiresAt.toISOString()
        }, {
          onConflict: 'user_id,recommendation_type'
        })
    }
  }
  
  /**
   * Get cached recommendations
   */
  static async getCachedRecommendations(
    userId: string,
    recommendationType: string
  ): Promise<any> {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('recommendation_cache')
      .select('recommendations, confidence_score, computed_at')
      .eq('user_id', userId)
      .eq('recommendation_type', recommendationType)
      .eq('is_valid', true)
      .gt('expires_at', new Date().toISOString())
      .single()
    
    if (error || !data) return null
    
    return data
  }
}
