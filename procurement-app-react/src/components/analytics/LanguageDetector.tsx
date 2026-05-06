import { useState } from 'react'
import {
  Box, Typography, TextField, Button, Paper, Chip,
  LinearProgress, Accordion, AccordionSummary, AccordionDetails,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { motion, AnimatePresence } from 'framer-motion'
import { barriersApi } from '../../services/api'
import type { LanguageResult } from '../../types'

const EXAMPLE = `Supplier Requirements and Selection Criteria

The successful supplier must demonstrate a minimum of 7 years' relevant experience delivering similar managed service contracts to UK central government departments.

Annual turnover must be at least £3 million in each of the last 2 consecutive financial years.

Suppliers must hold ISO 9001:2015, ISO 27001, and Cyber Essentials Plus certification at the point of contract award.

This contract is a renewal and continuation of our existing managed IT services arrangement. The incumbent supplier's infrastructure knowledge will be considered during evaluation.

The framework agreement will be used via a call-off mechanism under the Crown Commercial Service RM6111 Lot 3b. Only suppliers on this framework are eligible to submit responses.`

const sevColor = (s: string) => s === 'high' ? '#721C24' : s === 'medium' ? '#856404' : '#1F3A5F'
const sevBg    = (s: string) => s === 'high' ? '#f8d7da' : s === 'medium' ? '#fff3cd' : '#e8edf3'

export function LanguageDetector() {
  const [text, setText] = useState('')
  const [result, setResult] = useState<LanguageResult | null>(null)
  const [loading, setLoading] = useState(false)

  const analyse = async () => {
    if (text.trim().length < 20) return
    setLoading(true)
    try {
      const { data } = await barriersApi.analyzeLanguage(text)
      setResult(data)
    } catch {}
    setLoading(false)
  }

  const riskColor = result?.risk_level === 'Low' ? '#155724' : result?.risk_level === 'Medium' ? '#856404' : '#721C24'
  const riskBg   = result?.risk_level === 'Low' ? '#d4edda' : result?.risk_level === 'Medium' ? '#fff3cd' : '#f8d7da'

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
      {/* Input */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e8edf3' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>Contract Specification Text</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" sx={{ fontSize: 11 }} onClick={() => setText(EXAMPLE)}>Load example</Button>
              <Button size="small" sx={{ fontSize: 11, color: '#6C757D' }} onClick={() => { setText(''); setResult(null) }}>Clear</Button>
            </Box>
          </Box>
          <TextField
            multiline rows={14} fullWidth value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Paste contract specification, ITT, or procurement notice text here…"
            sx={{ '& textarea': { fontSize: 12, fontFamily: 'monospace', lineHeight: 1.6 } }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5 }}>
            <Typography variant="caption" sx={{ color: '#6C757D' }}>
              {text.trim().split(/\s+/).filter(Boolean).length} words
            </Typography>
            <Button variant="contained" onClick={analyse} disabled={loading || text.trim().length < 20}
              sx={{ fontSize: 13 }}>
              {loading ? 'Analysing…' : '🔍 Analyse'}
            </Button>
          </Box>
        </Paper>

        {result && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: `1px solid ${riskColor}30`, bgcolor: riskBg }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Analysis Summary</Typography>
                <Chip label={`${result.risk_level} Risk`} size="small"
                  sx={{ bgcolor: riskColor, color: '#fff', fontWeight: 700, fontSize: 11 }} />
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1.5, textAlign: 'center' }}>
                {[
                  { label: 'SME-Friendliness', value: `${result.overall_score}/100`, color: result.overall_score >= 65 ? '#155724' : result.overall_score >= 35 ? '#856404' : '#721C24' },
                  { label: 'Barriers Found', value: result.barrier_count, color: '#1F3A5F' },
                  { label: 'Total Words', value: result.total_words, color: '#1F3A5F' },
                ].map(({ label, value, color }) => (
                  <Box key={label}>
                    <Typography sx={{ fontSize: 22, fontWeight: 900, color }}>{value}</Typography>
                    <Typography variant="caption" sx={{ color: '#6C757D' }}>{label}</Typography>
                  </Box>
                ))}
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mt: 2 }}>
                <Box sx={{ bgcolor: 'rgba(255,255,255,0.6)', borderRadius: 2, p: 1.5, textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#6C757D' }}>Reading Level</Typography>
                  <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{result.readability?.level}</Typography>
                </Box>
                <Box sx={{ bgcolor: 'rgba(255,255,255,0.6)', borderRadius: 2, p: 1.5, textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#6C757D' }}>Avg Sentence</Typography>
                  <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{result.readability?.avg_sentence_length} words</Typography>
                </Box>
              </Box>
            </Paper>
          </motion.div>
        )}
      </Box>

      {/* Results */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <AnimatePresence>
          {result ? (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {result.positive_indicators?.length > 0 && (
                <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #c3e6cb', bgcolor: '#d4edda', mb: 2 }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#155724', mb: 1 }}>✅ Positive SME Indicators</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                    {result.positive_indicators.map(p => (
                      <Chip key={p} label={p} size="small"
                        sx={{ bgcolor: '#b8dfc9', color: '#155724', fontSize: 10, height: 20 }} />
                    ))}
                  </Box>
                </Paper>
              )}

              {result.barriers_detected?.length > 0 && (
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1 }}>
                    ⚠️ Barriers Detected ({result.barriers_detected.length})
                  </Typography>
                  {result.barriers_detected.map((b, i) => (
                    <Accordion key={b.type} defaultExpanded={i === 0}
                      elevation={0} sx={{ border: `1px solid ${sevBg(b.severity)}`, borderRadius: '8px !important', mb: 1,
                        borderLeft: `4px solid ${sevColor(b.severity)}`, '&:before': { display: 'none' } }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />} sx={{ py: 0.5, minHeight: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                          <Chip label={b.severity.toUpperCase()} size="small"
                            sx={{ bgcolor: sevBg(b.severity), color: sevColor(b.severity), fontWeight: 700, fontSize: 10, height: 18 }} />
                          <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{b.label}</Typography>
                          <Box sx={{ flex: 1 }} />
                          <Typography variant="caption" sx={{ color: '#6C757D', mr: 1 }}>
                            {b.count} instance{b.count > 1 ? 's' : ''}
                          </Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails sx={{ pt: 0 }}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
                          {b.matches.map(m => (
                            <Box key={m} component="code" sx={{
                              px: 1, py: 0.25, bgcolor: sevBg(b.severity), borderRadius: 1,
                              fontSize: 11, fontFamily: 'monospace', color: sevColor(b.severity),
                            }}>
                              "{m}"
                            </Box>
                          ))}
                        </Box>
                        <Box sx={{ bgcolor: '#e8f4fd', border: '1px solid #bee5eb', borderRadius: 2, p: 1.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#2E75B6' }}>💡 Suggested Rewrite</Typography>
                          <Typography sx={{ fontSize: 12, color: '#1F3A5F', mt: 0.5, lineHeight: 1.6 }}>{b.suggestion}</Typography>
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              )}

              {result.highlighted_html && (
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e8edf3' }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1.5 }}>Highlighted Specification</Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 1.5 }}>
                    {[['#fecaca', 'High'], ['#fef08a', 'Medium'], ['#bfdbfe', 'Low']].map(([color, label]) => (
                      <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '3px', bgcolor: color }} />
                        <Typography variant="caption" sx={{ color: '#6C757D' }}>{label} severity</Typography>
                      </Box>
                    ))}
                  </Box>
                  <Box
                    sx={{ maxHeight: 300, overflowY: 'auto', bgcolor: '#f8f9fa', p: 2, borderRadius: 2,
                      fontFamily: 'monospace', fontSize: 12, lineHeight: 1.7, color: '#1F3A5F',
                      whiteSpace: 'pre-wrap', '& mark': { borderRadius: '3px', px: '2px' } }}
                    dangerouslySetInnerHTML={{ __html: result.highlighted_html }}
                  />
                </Paper>
              )}
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Paper elevation={0} sx={{ p: 8, borderRadius: 3, border: '2px dashed #e8edf3', textAlign: 'center', bgcolor: '#fafbfc' }}>
                <Typography sx={{ fontSize: 48, mb: 2 }}>📝</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#6C757D' }}>
                  Paste specification text and click Analyse
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, color: '#9ca3af' }}>
                  Detects SME-unfriendly language patterns and suggests rewrites
                </Typography>
              </Paper>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </Box>
  )
}
