import { createClient } from '@/lib/supabase/server'
import type { Task, KnowledgeResource } from '@/types'

interface TaskSuggestion {
  type: 'step' | 'resource' | 'documentation' | 'similar_task'
  title: string
  description: string
  url?: string
  resource_id?: string
  confidence: number
}

export class AISuggestionService {
  /**
   * Generate task guidance suggestions based on task content and user context
   */
  static async generateTaskSuggestions(
    taskId: string,
    userId: string
  ): Promise<TaskSuggestion[]> {
    try {
      const supabase = await createClient()
      
      // Get task details
      const { data: task } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single()

      if (!task) return []

      // Get user's skill level and learning history
      const { data: profile } = await supabase
        .from('intern_profiles')
        .select('skills, cohort')
        .eq('user_id', userId)
        .single()

      const suggestions: TaskSuggestion[] = []

      // Rule-based suggestions
      suggestions.push(...await this.generateStepSuggestions(task))
      suggestions.push(...await this.generateResourceSuggestions(task, profile?.skills || []))
      suggestions.push(...await this.generateDocumentationSuggestions(task))
      suggestions.push(...await this.generateSimilarTaskSuggestions(task, userId))

      // Sort by confidence and return top suggestions
      return suggestions
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 8)

    } catch (error) {
      console.error('Error generating task suggestions:', error)
      return []
    }
  }

  /**
   * Generate step-by-step suggestions based on task keywords
   */
  private static async generateStepSuggestions(task: Task): Promise<TaskSuggestion[]> {
    const suggestions: TaskSuggestion[] = []
    const title = task.title.toLowerCase()
    const description = (task.description || '').toLowerCase()
    const content = `${title} ${description}`

    // Frontend development steps
    if (content.includes('react') || content.includes('component') || content.includes('frontend')) {
      suggestions.push({
        type: 'step',
        title: 'Set up component structure',
        description: 'Create the basic component file and import necessary dependencies',
        confidence: 0.8
      })
      suggestions.push({
        type: 'step',
        title: 'Define component props and state',
        description: 'Identify what data the component needs and how it will manage state',
        confidence: 0.7
      })
      suggestions.push({
        type: 'step',
        title: 'Implement component logic',
        description: 'Write the main functionality and event handlers',
        confidence: 0.6
      })
    }

    // API development steps
    if (content.includes('api') || content.includes('endpoint') || content.includes('backend')) {
      suggestions.push({
        type: 'step',
        title: 'Design API endpoint structure',
        description: 'Define the HTTP method, URL pattern, and expected parameters',
        confidence: 0.8
      })
      suggestions.push({
        type: 'step',
        title: 'Implement request validation',
        description: 'Add input validation and error handling for the endpoint',
        confidence: 0.7
      })
      suggestions.push({
        type: 'step',
        title: 'Test API functionality',
        description: 'Create test cases and verify the endpoint works correctly',
        confidence: 0.6
      })
    }

    // Database steps
    if (content.includes('database') || content.includes('schema') || content.includes('migration')) {
      suggestions.push({
        type: 'step',
        title: 'Design database schema',
        description: 'Plan the table structure, relationships, and constraints',
        confidence: 0.8
      })
      suggestions.push({
        type: 'step',
        title: 'Create migration files',
        description: 'Write the SQL or migration code to implement the schema',
        confidence: 0.7
      })
    }

    return suggestions
  }

  /**
   * Suggest relevant knowledge resources based on task content
   */
  private static async generateResourceSuggestions(
    task: Task,
    userSkills: string[]
  ): Promise<TaskSuggestion[]> {
    try {
      const supabase = await createClient()
      const content = `${task.title} ${task.description || ''}`.toLowerCase()
      
      // Extract keywords for matching
      const keywords = this.extractKeywords(content)
      
      // Find matching resources
      const { data: resources } = await supabase
        .from('knowledge_resources')
        .select('id, title, description, category, tags, difficulty_level')
        .or(keywords.map(keyword => `title.ilike.%${keyword}%`).join(','))
        .limit(5)

      return (resources || []).map(resource => ({
        type: 'resource' as const,
        title: `Learn: ${resource.title}`,
        description: resource.description || `${resource.category} resource`,
        resource_id: resource.id,
        confidence: this.calculateResourceRelevance(resource, keywords, userSkills)
      }))

    } catch (error) {
      console.error('Error generating resource suggestions:', error)
      return []
    }
  }

  /**
   * Suggest documentation based on detected technologies
   */
  private static async generateDocumentationSuggestions(task: Task): Promise<TaskSuggestion[]> {
    const suggestions: TaskSuggestion[] = []
    const content = `${task.title} ${task.description || ''}`.toLowerCase()

    const docMappings = [
      {
        keywords: ['react', 'jsx', 'component'],
        title: 'React Documentation',
        description: 'Official React documentation and guides',
        url: 'https://react.dev/',
        confidence: 0.9
      },
      {
        keywords: ['next.js', 'nextjs'],
        title: 'Next.js Documentation',
        description: 'Next.js framework documentation',
        url: 'https://nextjs.org/docs',
        confidence: 0.9
      },
      {
        keywords: ['typescript', 'ts'],
        title: 'TypeScript Handbook',
        description: 'TypeScript language documentation',
        url: 'https://www.typescriptlang.org/docs/',
        confidence: 0.8
      },
      {
        keywords: ['tailwind', 'css'],
        title: 'Tailwind CSS Documentation',
        description: 'Utility-first CSS framework documentation',
        url: 'https://tailwindcss.com/docs',
        confidence: 0.8
      },
      {
        keywords: ['supabase', 'database', 'postgres'],
        title: 'Supabase Documentation',
        description: 'Supabase database and auth documentation',
        url: 'https://supabase.com/docs',
        confidence: 0.8
      }
    ]

    for (const mapping of docMappings) {
      if (mapping.keywords.some(keyword => content.includes(keyword))) {
        suggestions.push({
          type: 'documentation',
          title: mapping.title,
          description: mapping.description,
          url: mapping.url,
          confidence: mapping.confidence
        })
      }
    }

    return suggestions
  }

  /**
   * Find similar completed tasks for reference
   */
  private static async generateSimilarTaskSuggestions(
    task: Task,
    userId: string
  ): Promise<TaskSuggestion[]> {
    try {
      const supabase = await createClient()
      const keywords = this.extractKeywords(`${task.title} ${task.description || ''}`)
      
      // Find similar completed tasks
      const { data: similarTasks } = await supabase
        .from('tasks')
        .select('id, title, description')
        .eq('status', 'done')
        .neq('id', task.id)
        .or(keywords.map(keyword => `title.ilike.%${keyword}%`).join(','))
        .limit(3)

      return (similarTasks || []).map(similarTask => ({
        type: 'similar_task' as const,
        title: `Reference: ${similarTask.title}`,
        description: 'Similar completed task that might provide insights',
        confidence: 0.6
      }))

    } catch (error) {
      console.error('Error generating similar task suggestions:', error)
      return []
    }
  }

  /**
   * Extract relevant keywords from text
   */
  private static extractKeywords(text: string): string[] {
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'])
    
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.has(word))
      .slice(0, 10) // Limit to top 10 keywords
  }

  /**
   * Calculate how relevant a resource is to the task
   */
  private static calculateResourceRelevance(
    resource: any,
    keywords: string[],
    userSkills: string[]
  ): number {
    let score = 0.5 // Base score

    // Keyword matching
    const resourceText = `${resource.title} ${resource.description || ''} ${resource.tags?.join(' ') || ''}`.toLowerCase()
    const matchingKeywords = keywords.filter(keyword => resourceText.includes(keyword))
    score += (matchingKeywords.length / keywords.length) * 0.3

    // Difficulty matching (prefer beginner for new skills)
    if (resource.difficulty_level === 'beginner') score += 0.1
    if (resource.difficulty_level === 'intermediate' && userSkills.length > 2) score += 0.1

    // Category relevance
    if (resource.category === 'tutorial') score += 0.1

    return Math.min(score, 1.0)
  }
}