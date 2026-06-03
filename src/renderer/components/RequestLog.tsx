import React, { useMemo, useCallback, useState } from 'react'
import { VirtualTable } from '../ui'
import type { VTColumn, VTRowSelection } from '../ui'
import type { CapturedRequest } from '@shared/types'
import { useLocale } from '../i18n'
import styles from './RequestLog.module.css'

interface RequestLogProps {
  requests: CapturedRequest[]
  selectedId: string | null
  onSelect: (request: CapturedRequest) => void
  selectedSeqs: number[]
  onSelectedSeqsChange: (seqs: number[]) => void
}

// Color mapping for HTTP methods
const METHOD_COLORS: Record<string, string> = {
  GET: 'var(--color-success)',
  POST: 'var(--color-info)',
  PUT: 'var(--color-orange)',
  DELETE: 'var(--color-error)',
  PATCH: 'var(--color-info)',
  HEAD: 'var(--text-muted)',
  OPTIONS: 'var(--text-muted)',
}

// Color for status codes
function getStatusColor(code: number | null): string {
  if (code === null) return 'var(--text-muted)'
  if (code >= 200 && code < 300) return 'var(--color-success)'
  if (code >= 300 && code < 400) return 'var(--color-warning)'
  if (code >= 400 && code < 500) return 'var(--color-error)'
  if (code >= 500) return 'var(--color-error)'
  return 'var(--text-muted)'
}

function extractPath(url: string): string {
  try {
    const parsed = new URL(url)
    return parsed.pathname + parsed.search
  } catch {
    return url
  }
}

function extractHost(url: string): string {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}

const RequestLog: React.FC<RequestLogProps> = ({ requests, selectedId, onSelect, selectedSeqs, onSelectedSeqsChange }) => {
  const { t } = useLocale()
  const [searchText, setSearchText] = useState('')

  // Pre-filter by search text only (method filter now handled by VirtualTable column filter)
  const filteredRequests = useMemo(() => {
    if (!searchText.trim()) return requests
    const q = searchText.trim().toLowerCase()
    return requests.filter(r => r.url.toLowerCase().includes(q))
  }, [requests, searchText])

  // Collect unique methods for column filter
  const methodFilters = useMemo(() => {
    const methods = new Set(requests.map(r => r.method.toUpperCase()))
    return Array.from(methods).sort().map(m => ({ text: m, value: m }))
  }, [requests])

  // Collect unique domains for column filter
  const domainFilters = useMemo(() => {
    const domains = new Set(requests.map(r => extractHost(r.url)))
    return Array.from(domains).sort().map(d => ({ text: d, value: d }))
  }, [requests])

  // Collect unique sources for column filter
  const sourceFilters = useMemo(() => [
    { text: 'CDP', value: 'cdp' },
    { text: 'Proxy', value: 'proxy' },
  ], [])

  const columns: VTColumn<CapturedRequest>[] = useMemo(() => [
    {
      key: 'sequence',
      title: '#',
      dataIndex: 'sequence',
      width: 50,
      render: (val) => <span style={{ color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{val as number}</span>,
      sorter: (a, b) => a.sequence - b.sequence,
    },
    {
      key: 'method',
      title: t('requestLog.method'),
      dataIndex: 'method',
      width: 100,
      filters: methodFilters,
      onFilter: (value, record) => record.method.toUpperCase() === value,
      render: (val) => {
        const m = (val as string).toUpperCase()
        return <span style={{ color: METHOD_COLORS[m] || 'var(--text-muted)', fontWeight: 600 }}>{m}</span>
      },
    },
    {
      key: 'domain',
      title: t('requestLog.domain'),
      dataIndex: 'url',
      width: 180,
      filters: domainFilters,
      filterSearch: true,
      onFilter: (value, record) => extractHost(record.url) === value,
      render: (_val, record) => (
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={extractHost(record.url)}>
          {extractHost(record.url)}
        </span>
      ),
    },
    {
      key: 'url',
      title: t('requestLog.path'),
      dataIndex: 'url',
      render: (_val, record) => (
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={record.url}>
          {extractPath(record.url)}
        </span>
      ),
    },
    {
      key: 'status_code',
      title: t('requestLog.status'),
      dataIndex: 'status_code',
      width: 70,
      render: (val) => {
        const code = val as number | null
        return <span style={{ color: getStatusColor(code), fontWeight: 500 }}>{code ?? '--'}</span>
      },
      sorter: (a, b) => (a.status_code ?? 0) - (b.status_code ?? 0),
    },
    {
      key: 'duration_ms',
      title: t('requestLog.time'),
      dataIndex: 'duration_ms',
      width: 80,
      render: (val) => {
        const ms = val as number | null
        return <span style={{ color: 'var(--text-muted)' }}>{ms !== null ? `${ms}ms` : '--'}</span>
      },
      sorter: (a, b) => (a.duration_ms ?? 0) - (b.duration_ms ?? 0),
    },
    {
      key: 'source',
      title: t('requestLog.source'),
      dataIndex: 'source',
      width: 90,
      filters: sourceFilters,
      onFilter: (value, record) => (record.source || 'cdp') === value,
      render: (val) => {
        const src = (val as string) || 'cdp'
        const isProxy = src === 'proxy'
        return (
          <span className={isProxy ? styles.srcProxy : styles.srcCdp}>
            {isProxy ? 'Proxy' : 'CDP'}
          </span>
        )
      },
    },
  ], [methodFilters, domainFilters, sourceFilters, t])

  const handleRow = useCallback((record: CapturedRequest) => ({
    onClick: () => onSelect(record),
    className: record.id === selectedId ? 'vtRowHighlight' : '',
  }), [selectedId, onSelect])

  const rowSelection: VTRowSelection<CapturedRequest> = useMemo(() => ({
    selectedKeys: selectedSeqs,
    onChange: (_keys, rows) => {
      onSelectedSeqsChange(rows.map(r => r.sequence))
    },
  }), [selectedSeqs, onSelectedSeqsChange])

  return (
    <div className={styles.container}>
      {/* Search toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            className={styles.searchInput}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder={t('requestLog.searchPlaceholder')}
          />
        </div>
      </div>

      {/* Request list with column headers and filters */}
      <VirtualTable<CapturedRequest>
        columns={columns}
        data={filteredRequests}
        rowKey="sequence"
        rowHeight={32}
        rowSelection={rowSelection}
        onRow={handleRow}
        emptyText={t('requestLog.empty')}
      />
    </div>
  )
}

export default RequestLog
