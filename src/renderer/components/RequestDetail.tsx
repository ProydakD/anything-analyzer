import React, { useMemo, useState } from 'react'
import { Tag, Empty } from '../ui'
import type { CapturedRequest, JsHookRecord } from '@shared/types'
import { useLocale } from '../i18n'
import styles from './RequestDetail.module.css'

interface RequestDetailProps {
  request: CapturedRequest | null
  hooks: JsHookRecord[]
}

function safeParse(json: string | null): Record<string, string> | null {
  if (!json) return null
  try { return JSON.parse(json) } catch { return null }
}

function formatContent(content: string | null, emptyLabel: string, contentType?: string | null): string {
  if (!content) return emptyLabel
  const isJson = contentType?.includes('application/json') || content.trimStart().startsWith('{') || content.trimStart().startsWith('[')
  if (isJson) {
    try { return JSON.stringify(JSON.parse(content), null, 2) } catch { return content }
  }
  return content
}

function extractPath(url: string): string {
  try {
    const parsed = new URL(url)
    return parsed.pathname + parsed.search
  } catch {
    return url
  }
}

const METHOD_COLORS: Record<string, string> = {
  GET: 'var(--color-success)',
  POST: 'var(--color-info)',
  PUT: 'var(--color-orange)',
  DELETE: 'var(--color-error)',
  PATCH: 'var(--color-info)',
}

const HOOK_TYPE_COLORS: Record<string, 'info' | 'success' | 'purple' | 'orange'> = {
  fetch: 'info',
  xhr: 'success',
  crypto: 'purple',
  crypto_lib: 'purple',
  cookie_set: 'orange',
}

// Sensitive header value highlighting
const HIGHLIGHT_HEADERS: Record<string, string> = {
  authorization: 'var(--color-warning)',
  'x-ss-token': 'var(--color-purple)',
  'x-csrf-token': 'var(--color-warning)',
  cookie: 'var(--color-orange)',
  'set-cookie': 'var(--color-orange)',
}

type DetailTab = 'headers' | 'body' | 'response' | 'hooks'

// KV row component for headers
const KVRow: React.FC<{ k: string; v: string }> = ({ k, v }) => {
  const highlight = HIGHLIGHT_HEADERS[k.toLowerCase()]
  return (
    <div className={styles.kvRow}>
      <div className={styles.kvKey}>{k}</div>
      <div className={styles.kvVal} style={highlight ? { color: highlight } : undefined}>{v}</div>
    </div>
  )
}

// Headers tab — KV pairs layout
const HeadersTab: React.FC<{ request: CapturedRequest }> = ({ request }) => {
  const { t } = useLocale()
  const reqHeaders = safeParse(request.request_headers)
  const resHeaders = safeParse(request.response_headers)
  return (
    <div className={styles.kvSection}>
      <div className={styles.sectionLabel}>{t('requestDetail.requestHeaders')}</div>
      {reqHeaders ? (
        Object.entries(reqHeaders).map(([k, v]) => <KVRow key={k} k={k} v={String(v)} />)
      ) : (
        <div className={styles.emptyHint}>{t('common.none')}</div>
      )}
      <div className={styles.sectionLabel} style={{ marginTop: 14 }}>{t('requestDetail.responseHeaders')}</div>
      {resHeaders ? (
        Object.entries(resHeaders).map(([k, v]) => <KVRow key={k} k={k} v={String(v)} />)
      ) : (
        <div className={styles.emptyHint}>{t('common.none')}</div>
      )}
    </div>
  )
}

// Body tab
const BodyTab: React.FC<{ request: CapturedRequest }> = ({ request }) => {
  const { t } = useLocale()
  return (
    <div className={styles.kvSection}>
      <div className={styles.sectionLabel}>{t('requestDetail.requestBody')}</div>
      <pre className={styles.codeBlock}>{formatContent(request.request_body, t('common.empty'), request.content_type)}</pre>
    </div>
  )
}

// Response tab
const ResponseTab: React.FC<{ request: CapturedRequest }> = ({ request }) => {
  const { t } = useLocale()
  return (
    <div className={styles.kvSection}>
      <div className={styles.metaGrid}>
        <div className={styles.metaLabel}>{t('requestDetail.status')}</div>
        <div className={styles.metaValue}>{request.status_code ?? '--'}</div>
        <div className={styles.metaLabel}>{t('requestDetail.contentType')}</div>
        <div className={styles.metaValue}>{request.content_type ?? '--'}</div>
        <div className={styles.metaLabel}>{t('requestDetail.duration')}</div>
        <div className={styles.metaValue}>{request.duration_ms != null ? `${request.duration_ms} ms` : '--'}</div>
      </div>
      <div className={styles.sectionLabel}>{t('requestDetail.responseBody')}</div>
      <pre className={styles.codeBlock}>{formatContent(request.response_body, t('common.empty'), request.content_type)}</pre>
    </div>
  )
}

// Hooks tab
const HooksTab: React.FC<{ hooks: JsHookRecord[] }> = ({ hooks }) => {
  const { t } = useLocale()
  if (hooks.length === 0) return <Empty description={t('requestDetail.noHooks')} />
  return (
    <div className={styles.hookList}>
      {hooks.map((hook) => (
        <div key={hook.id} className={styles.hookItem}>
          <div className={styles.hookHeader}>
            <Tag color={HOOK_TYPE_COLORS[hook.hook_type] || 'default'}>{hook.hook_type}</Tag>
            <code className={styles.hookFn}>{hook.function_name}</code>
            <span className={styles.hookTime}>{new Date(hook.timestamp).toLocaleTimeString()}</span>
          </div>
          <div className={styles.hookArgs}>{hook.arguments}</div>
        </div>
      ))}
    </div>
  )
}

const RequestDetail: React.FC<RequestDetailProps> = ({ request, hooks }) => {
  const { t } = useLocale()
  const [activeKey, setActiveKey] = useState<DetailTab>('headers')
  const tabList: { key: DetailTab; label: string }[] = [
    { key: 'headers', label: t('requestDetail.headers') },
    { key: 'body', label: t('requestDetail.body') },
    { key: 'response', label: t('requestDetail.response') },
    { key: 'hooks', label: t('requestDetail.hooks') },
  ]

  const relatedHooks = useMemo(() => {
    if (!request) return []
    return hooks.filter((h) => {
      if (h.related_request_id === request.id) return true
      const timeDiff = request.timestamp - h.timestamp
      return timeDiff >= 0 && timeDiff <= 500
    })
  }, [request, hooks])

  if (!request) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 200 }}>
        <Empty description={t('requestDetail.selectRequest')} />
      </div>
    )
  }

  const methodColor = METHOD_COLORS[request.method.toUpperCase()] || 'var(--text-muted)'

  return (
    <div className={styles.container}>
      {/* Header: METHOD STATUS · TIME */}
      <div className={styles.detailHeader}>
        <div className={styles.detailTitle}>
          <span style={{ color: methodColor, fontWeight: 600 }}>{request.method.toUpperCase()}</span>
          {' '}
          {request.status_code ?? '--'} · {request.duration_ms != null ? `${request.duration_ms}ms` : '--'}
        </div>
        <div className={styles.detailUrl}>{request.url}</div>
      </div>

      {/* Simple text tabs */}
      <div className={styles.detailTabs}>
        {tabList.map(tab => (
          <button
            key={tab.key}
            className={`${styles.detailTab} ${activeKey === tab.key ? styles.detailTabActive : ''}`}
            onClick={() => setActiveKey(tab.key)}
          >
            {tab.label}{tab.key === 'hooks' ? ` (${relatedHooks.length})` : ''}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className={styles.detailBody}>
        {activeKey === 'headers' && <HeadersTab request={request} />}
        {activeKey === 'body' && <BodyTab request={request} />}
        {activeKey === 'response' && <ResponseTab request={request} />}
        {activeKey === 'hooks' && <HooksTab hooks={relatedHooks} />}
      </div>
    </div>
  )
}

export default RequestDetail
