import { useState, useRef } from 'react'
import type { DragEvent, ChangeEvent } from 'react'
import {
  Box, Typography, Button, Chip, LinearProgress,
  IconButton, List, ListItem, ListItemText, ListItemIcon,
} from '@mui/material'
import UploadFileIcon      from '@mui/icons-material/UploadFile'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import DeleteOutlinedIcon  from '@mui/icons-material/DeleteOutlined'
import CheckCircleIcon     from '@mui/icons-material/CheckCircle'
import { documentsApi }     from '../../services/api'
import type { CompanyDocument } from '../../types'

const DOC_TYPES = [
  { value: 'accounts',        label: 'Annual Accounts' },
  { value: 'gdpr',            label: 'GDPR Policy' },
  { value: 'iso_9001',        label: 'ISO 9001' },
  { value: 'iso_27001',       label: 'ISO 27001' },
  { value: 'cyber_essentials',label: 'Cyber Essentials' },
  { value: 'modern_slavery',  label: 'Modern Slavery Statement' },
  { value: 'public_liability',label: 'Public Liability Insurance' },
  { value: 'general',         label: 'Other' },
]

interface Props {
  documents: CompanyDocument[]
  onUploaded: (doc: CompanyDocument) => void
  onDeleted:  (id: string) => void
}

function fmtSize(bytes?: number) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DocumentUpload({ documents, onUploaded, onDeleted }: Props) {
  const [dragging, setDragging]   = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress]   = useState(0)
  const [error, setError]         = useState('')
  const [docType, setDocType]     = useState('general')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = async (files: FileList | null) => {
    if (!files || !files[0]) return
    const file = files[0]
    if (file.size > 10 * 1024 * 1024) {
      setError('File exceeds 10 MB limit.')
      return
    }
    setError('')
    setUploading(true)
    setProgress(10)
    try {
      // Simulate progress ticks
      const timer = setInterval(() => setProgress(p => Math.min(p + 15, 85)), 300)
      const { data } = await documentsApi.upload(file, docType)
      clearInterval(timer)
      setProgress(100)
      onUploaded(data.document)
      setTimeout(() => { setProgress(0); setUploading(false) }, 700)
    } catch (e: unknown) {
      setError((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Upload failed.')
      setUploading(false)
      setProgress(0)
    }
  }

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => handleFiles(e.target.files)

  return (
    <Box>
      {/* Doc type selector */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1.5 }}>
        {DOC_TYPES.map(dt => (
          <Chip
            key={dt.value}
            label={dt.label}
            size="small"
            onClick={() => setDocType(dt.value)}
            sx={{
              fontSize: 11, fontWeight: 500, cursor: 'pointer',
              bgcolor: docType === dt.value ? '#1d4ed8' : '#f1f5f9',
              color:   docType === dt.value ? '#fff'    : '#475569',
              '&:hover': { bgcolor: docType === dt.value ? '#1e40af' : '#e2e8f0' },
            }}
          />
        ))}
      </Box>

      {/* Drop zone */}
      <Box
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        sx={{
          border: `2px dashed ${dragging ? '#2563eb' : '#cbd5e1'}`,
          borderRadius: 2, p: 3, textAlign: 'center', cursor: uploading ? 'default' : 'pointer',
          bgcolor: dragging ? 'rgba(37,99,235,0.04)' : '#fafbfc',
          transition: 'all 0.15s',
          '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' },
        }}
      >
        <UploadFileIcon sx={{ fontSize: 36, color: '#94a3b8', mb: 1 }} />
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>
          Drop file here or click to browse
        </Typography>
        <Typography sx={{ fontSize: 11, color: '#94a3b8', mt: 0.5 }}>
          PDF, Word, JPEG — max 10 MB
        </Typography>
        {uploading && (
          <Box sx={{ mt: 1.5 }}>
            <LinearProgress variant="determinate" value={progress}
              sx={{ borderRadius: 1, height: 6 }} />
          </Box>
        )}
      </Box>

      <input ref={inputRef} type="file" hidden
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        onChange={onInputChange} />

      {error && (
        <Typography sx={{ fontSize: 12, color: '#dc2626', mt: 0.75 }}>{error}</Typography>
      )}

      {/* Uploaded list */}
      {documents.length > 0 && (
        <List dense disablePadding sx={{ mt: 1.5 }}>
          {documents.map(doc => (
            <ListItem
              key={doc.id}
              sx={{ px: 1, py: 0.5, borderRadius: 1, '&:hover': { bgcolor: '#f8fafc' } }}
              secondaryAction={
                <IconButton size="small" onClick={() => onDeleted(doc.id)}
                  sx={{ color: '#94a3b8', '&:hover': { color: '#ef4444' } }}>
                  <DeleteOutlinedIcon sx={{ fontSize: 16 }} />
                </IconButton>
              }
            >
              <ListItemIcon sx={{ minWidth: 28 }}>
                {doc.signed_url
                  ? <CheckCircleIcon sx={{ fontSize: 16, color: '#16a34a' }} />
                  : <InsertDriveFileIcon sx={{ fontSize: 16, color: '#94a3b8' }} />}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography sx={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>
                    {doc.file_name}
                  </Typography>
                }
                secondary={
                  <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>
                    {DOC_TYPES.find(d => d.value === doc.doc_type)?.label || doc.doc_type}
                    {doc.file_size ? ` · ${fmtSize(doc.file_size)}` : ''}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  )
}
