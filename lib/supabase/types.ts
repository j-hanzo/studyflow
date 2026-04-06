export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: 'student' | 'parent'
          full_name: string | null
          grade: string | null
          color: string | null
          created_at: string
        }
        Insert: {
          id: string
          role: 'student' | 'parent'
          full_name?: string | null
          grade?: string | null
          color?: string | null
        }
        Update: {
          role?: 'student' | 'parent'
          full_name?: string | null
          grade?: string | null
          color?: string | null
        }
      }
      family_links: {
        Row: {
          id: string
          parent_id: string
          student_id: string
          created_at: string
        }
        Insert: { parent_id: string; student_id: string }
        Update: never
      }
      classes: {
        Row: {
          id: string
          student_id: string
          name: string
          teacher: string | null
          period: string | null
          color: string
          created_at: string
        }
        Insert: {
          student_id: string
          name: string
          teacher?: string | null
          period?: string | null
          color?: string
        }
        Update: {
          name?: string
          teacher?: string | null
          period?: string | null
          color?: string
        }
      }
      materials: {
        Row: {
          id: string
          class_id: string
          student_id: string
          title: string
          type: 'notes' | 'assignment' | 'handout'
          content_text: string | null
          photo_url: string | null
          tags: string[]
          created_at: string
        }
        Insert: {
          class_id: string
          student_id: string
          title: string
          type: 'notes' | 'assignment' | 'handout'
          content_text?: string | null
          photo_url?: string | null
          tags?: string[]
        }
        Update: {
          title?: string
          type?: 'notes' | 'assignment' | 'handout'
          content_text?: string | null
          photo_url?: string | null
          tags?: string[]
        }
      }
      assignments: {
        Row: {
          id: string
          class_id: string
          student_id: string
          title: string
          type: 'assignment' | 'exam' | 'quiz'
          due_date: string
          completed: boolean
          description: string | null
          created_at: string
        }
        Insert: {
          class_id: string
          student_id: string
          title: string
          type: 'assignment' | 'exam' | 'quiz'
          due_date: string
          completed?: boolean
          description?: string | null
        }
        Update: {
          title?: string
          type?: 'assignment' | 'exam' | 'quiz'
          due_date?: string
          completed?: boolean
          description?: string | null
        }
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          recipient_id: string
          body: string
          read: boolean
          created_at: string
        }
        Insert: {
          sender_id: string
          recipient_id: string
          body: string
          read?: boolean
        }
        Update: { read?: boolean }
      }
      study_sessions: {
        Row: {
          id: string
          student_id: string
          assignment_id: string | null
          title: string
          scheduled_date: string
          start_time: string | null
          duration_minutes: number
          completed: boolean
          created_at: string
        }
        Insert: {
          student_id: string
          assignment_id?: string | null
          title: string
          scheduled_date: string
          start_time?: string | null
          duration_minutes?: number
          completed?: boolean
        }
        Update: {
          title?: string
          scheduled_date?: string
          start_time?: string | null
          duration_minutes?: number
          completed?: boolean
        }
      }
    }
  }
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Class = Database['public']['Tables']['classes']['Row']
export type Material = Database['public']['Tables']['materials']['Row']
export type Assignment = Database['public']['Tables']['assignments']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type StudySession = Database['public']['Tables']['study_sessions']['Row']
