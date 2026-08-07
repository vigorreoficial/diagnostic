'use client'

export function Footer() {
  return (
    <footer className="bg-white border-t border-[#D7DEE8] mt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <p className="text-sm font-medium text-[#0A3D78]">
              Vigorre Diagnostics™
            </p>
            <p className="text-xs text-[#5E6C84]">
              Dados que transformam decisões.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-xs text-[#5E6C84]">
            <span className="font-medium text-[#0F5FA8]">Versão 3.0 "QUANTUM"</span>
            <span className="hidden sm:inline">|</span>
            <span>Confidencial - Uso Exclusivo Vigorre</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <button className="text-[#5E6C84] hover:text-[#0F5FA8] transition-colors">
              Suporte
            </button>
            <button className="text-[#5E6C84] hover:text-[#0F5FA8] transition-colors">
              Manual
            </button>
            <button className="text-[#5E6C84] hover:text-[#0F5FA8] transition-colors">
              Política de Segurança
            </button>
            <button className="text-[#5E6C84] hover:text-[#0F5FA8] transition-colors">
              LGPD
            </button>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-[#D7DEE8] text-center">
          <p className="text-xs text-[#5E6C84]">
            © 2026 Vigorre — Inteligência e Gestão Estratégica
          </p>
        </div>
      </div>
    </footer>
  )
}
