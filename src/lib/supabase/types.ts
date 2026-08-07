export type PerfilUsuario = 
  | 'ADMIN' 
  | 'DIRETOR' 
  | 'GESTOR' 
  | 'CONSULTOR' 
  | 'AUDITOR' 
  | 'ESPECIALISTA' 
  | 'CLIENTE'

export interface Usuario {
  id: string
  empresa_id: string | null
  nome: string
  email: string
  perfil: PerfilUsuario
  competencias: string[] | null
  especializacao: string | null
  created_at: string
  updated_at: string
}

export interface Empresa {
  id: string
  nome: string
  cnpj: string
  cnae: string | null
  porte: 'MICRO' | 'PEQUENA' | 'MEDIA' | 'GRANDE' | null
  segmento: string | null
  created_at: string
  updated_at: string
}
