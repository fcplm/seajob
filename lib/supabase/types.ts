export type Profile = {
  id: string
  full_name: string | null
  rank: string | null
  fleet_type: 'merchant' | 'tanker' | 'offshore' | 'cruise' | null
  phone: string | null
  photo_url: string | null
  subscription_status: 'free' | 'pro' | 'enterprise'
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
