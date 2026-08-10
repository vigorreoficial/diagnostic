import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
  Link,
  PDFViewer
} from '@react-pdf/renderer'

// Registrar fontes
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa2JL7W0Q5n-wU.woff2' },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7W0Q5n-wU.woff2', fontWeight: 'bold' }
  ]
})

// Cores
const COLORS = {
  primary: '#0F5FA8',
  secondary: '#0A3D78',
  dark: '#072F5F',
  light: '#4D90D9',
  veryLight: '#EAF3FC',
  grayLight: '#F7F8FA',
  grayMedium: '#D7DEE8',
  grayDark: '#5E6C84',
  black: '#1C1F26',
  white: '#FFFFFF',
  green: '#22c55e',
  red: '#ef4444',
  yellow: '#eab308'
}

// Estilos
const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: COLORS.white,
    fontFamily: 'Inter'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: `2px solid ${COLORS.primary}`,
    paddingBottom: 10,
    marginBottom: 20
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.secondary
  },
  headerSubtitle: {
    fontSize: 10,
    color: COLORS.grayDark
  },
  headerVersion: {
    fontSize: 10,
    color: COLORS.grayDark,
    backgroundColor: COLORS.veryLight,
    padding: '4 8',
    borderRadius: 4
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginBottom: 8
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.grayDark,
    marginBottom: 16
  },
  section: {
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottom: `1px solid ${COLORS.grayMedium}`
  },
  paragraph: {
    fontSize: 11,
    color: COLORS.dark,
    lineHeight: 1.6,
    marginBottom: 6
  },
  card: {
    backgroundColor: COLORS.veryLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginBottom: 4
  },
  cardText: {
    fontSize: 10,
    color: COLORS.grayDark
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  label: {
    fontSize: 10,
    color: COLORS.grayDark
  },
  value: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.dark
  },
  table: {
    marginVertical: 8
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: `1px solid ${COLORS.grayMedium}`,
    paddingVertical: 4
  },
  tableHeader: {
    backgroundColor: COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4
  },
  tableHeaderText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: 'bold'
  },
  tableCell: {
    fontSize: 9,
    color: COLORS.dark,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flex: 1
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    fontSize: 8,
    fontWeight: 'bold'
  },
  badgeAlta: {
    backgroundColor: COLORS.red,
    color: COLORS.white
  },
  badgeMedia: {
    backgroundColor: COLORS.yellow,
    color: COLORS.dark
  },
  badgeBaixa: {
    backgroundColor: COLORS.green,
    color: COLORS.white
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTop: `1px solid ${COLORS.grayMedium}`,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  footerText: {
    fontSize: 8,
    color: COLORS.grayDark
  },
  confidential: {
    fontSize: 8,
    color: COLORS.red,
    fontWeight: 'bold'
  },
  metricCard: {
    backgroundColor: COLORS.white,
    border: `1px solid ${COLORS.grayMedium}`,
    borderRadius: 8,
    padding: 12,
    width: '23%',
    alignItems: 'center'
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary
  },
  metricLabel: {
    fontSize: 8,
    color: COLORS.grayDark,
    marginTop: 4
  },
  columns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap'
  },
  column: {
    width: '48%'
  }
})

// ============================================
// COMPONENTES DO PDF
// ============================================

interface RelatorioPDFProps {
  diagnostico: any
  modulos: any[]
  analises: any[]
  knowledge?: any[]
  tipo: 'EXECUTIVO' | 'COMPLETO' | 'PLANO_ACAO' | 'PREDICAO' | 'CTI_COMPLETO'
}

export function RelatorioPDF({ diagnostico, modulos, analises, knowledge = [], tipo }: RelatorioPDFProps) {
  const imvTotal = modulos.length > 0 
    ? Math.round(modulos.reduce((acc, m) => acc + (m.pontuacao || 0), 0) / modulos.length)
    : 0

  const concluidos = modulos.filter(m => m.status === 'CONCLUIDO' || m.status === 'VALIDADO').length
  const totalModulos = modulos.length

  const getPrioridadeLabel = (prioridade: string) => {
    const labels: Record<string, string> = { 'BAIXA': 'Baixa', 'MEDIA': 'Média', 'ALTA': 'Alta', 'CRITICA': 'Crítica' }
    return labels[prioridade] || prioridade
  }

  const getNivelMaturidade = (imv: number) => {
    if (imv >= 901) return 'Excelência'
    if (imv >= 801) return 'Estratégico'
    if (imv >= 601) return 'Gerenciado'
    if (imv >= 401) return 'Estruturado'
    if (imv >= 201) return 'Básico'
    return 'Inicial'
  }

  const MODULOS_LABELS: Record<string, string> = {
    'ESTRATEGIA': 'Estratégia e Governança',
    'RH': 'Recursos Humanos',
    'DP': 'Departamento Pessoal',
    'JURIDICO': 'Jurídico e Compliance',
    'SST': 'Saúde e Segurança do Trabalho',
    'NUTRICAO': 'Nutrição Organizacional',
    'FINANCEIRO': 'Financeiro',
    'COMERCIAL': 'Comercial e Marketing',
    'QUALIDADE': 'Qualidade',
    'MELHORIA_CONTINUA': 'Melhoria Contínua',
    'OPERACOES': 'Operações e Logística',
    'COMPRAS': 'Compras e Suprimentos',
    'TI': 'Tecnologia da Informação',
    'AGRO': 'Agronegócio'
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Vigorre Diagnostics™</Text>
            <Text style={styles.headerSubtitle}>Dados que transformam decisões.</Text>
          </View>
          <View>
            <Text style={styles.headerVersion}>v3.0 "QUANTUM"</Text>
          </View>
        </View>

        {/* Título */}
        <Text style={styles.title}>
          {tipo === 'EXECUTIVO' && 'Relatório Executivo'}
          {tipo === 'COMPLETO' && 'Relatório Completo'}
          {tipo === 'PLANO_ACAO' && 'Plano de Ação'}
          {tipo === 'PREDICAO' && 'Relatório de Predição'}
          {tipo === 'CTI_COMPLETO' && 'CTI™ + Knowledge Hub™'}
        </Text>
        <Text style={styles.subtitle}>
          {diagnostico?.titulo} - {diagnostico?.empresas?.nome || 'Empresa'}
        </Text>

        {/* Data */}
        <View style={styles.row}>
          <Text style={styles.label}>Data de geração:</Text>
          <Text style={styles.value}>{new Date().toLocaleDateString('pt-BR')}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Versão do diagnóstico:</Text>
          <Text style={styles.value}>3.0 "QUANTUM"</Text>
        </View>

        {/* Resumo Executivo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Resumo Executivo</Text>
          <View style={styles.columns}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{imvTotal}</Text>
              <Text style={styles.metricLabel}>IMV™ Total</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{concluidos}/{totalModulos}</Text>
              <Text style={styles.metricLabel}>Módulos Concluídos</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{getNivelMaturidade(imvTotal)}</Text>
              <Text style={styles.metricLabel}>Nível de Maturidade</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{analises.length}</Text>
              <Text style={styles.metricLabel}>Análises CTI™</Text>
            </View>
          </View>
        </View>

        {/* Análises por Módulo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔍 Análises por Módulo</Text>
          {modulos.map((modulo, index) => {
            const analise = analises.find(a => a.modulo_id === modulo.id)
            const areaLabel = MODULOS_LABELS[modulo.area] || modulo.area
            if (index >= 4 && tipo !== 'COMPLETO' && tipo !== 'CTI_COMPLETO') return null

            return (
              <View key={modulo.id} style={styles.card}>
                <View style={styles.row}>
                  <Text style={styles.cardTitle}>{areaLabel}</Text>
                  <Text style={styles.cardText}>Nota: {modulo.pontuacao || 0}%</Text>
                </View>
                {analise && (
                  <>
                    <Text style={styles.paragraph}>{analise.parecer}</Text>
                    <View style={{ backgroundColor: COLORS.white, padding: 8, borderRadius: 4, marginTop: 4 }}>
                      <Text style={{ fontSize: 9, fontWeight: 'bold', color: COLORS.primary }}>💡 Recomendação</Text>
                      <Text style={{ fontSize: 9, color: COLORS.dark }}>{analise.recomendacao}</Text>
                    </View>
                  </>
                )}
              </View>
            )
          })}
          {modulos.length > 4 && tipo !== 'COMPLETO' && tipo !== 'CTI_COMPLETO' && (
            <Text style={{ fontSize: 9, color: COLORS.grayDark, textAlign: 'center', marginTop: 8 }}>
              + {modulos.length - 4} módulos disponíveis no relatório completo
            </Text>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>© 2026 Vigorre — Inteligência e Gestão Estratégica</Text>
          <Text style={styles.confidential}>🔒 Confidencial - Uso Exclusivo Vigorre</Text>
        </View>
      </Page>
    </Document>
  )
}
