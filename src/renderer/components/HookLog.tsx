import React, { useMemo } from 'react'
import { VirtualTable, Tag, CopyableBlock } from '../ui'
import type { VTColumn } from '../ui'
import type { JsHookRecord, HookType } from '@shared/types'
import { useLocale } from '../i18n'

interface HookLogProps {
  hooks: JsHookRecord[]
}

// Color mapping for hook types
const HOOK_TYPE_COLORS: Record<HookType, 'info' | 'success' | 'purple' | 'orange'> = {
  fetch: 'info',
  xhr: 'success',
  crypto: 'purple',
  crypto_lib: 'purple',
  cookie_set: 'orange',
}

function truncate(str: string | null, maxLen = 80): string {
  if (!str) return '--'
  return str.length > maxLen ? str.slice(0, maxLen) + '...' : str
}

function prettyJson(str: string | null, emptyLabel: string): string {
  if (!str) return emptyLabel
  try {
    return JSON.stringify(JSON.parse(str), null, 2)
  } catch {
    return str
  }
}

// Expanded row content
const ExpandedRow: React.FC<{ record: JsHookRecord }> = ({ record }) => (
  <ExpandedHookRow record={record} />
)

const ExpandedHookRow: React.FC<{ record: JsHookRecord }> = ({ record }) => {
  const { t } = useLocale()
  return (
    <div style={{ padding: '4px 0' }}>
      <CopyableBlock label={t('hookLog.arguments')} content={prettyJson(record.arguments, t('common.empty'))} />
      {record.result && <CopyableBlock label={t('hookLog.result')} content={prettyJson(record.result, t('common.empty'))} />}
      {record.call_stack && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>{t('hookLog.callStack')}</div>
          <pre style={{
            background: 'var(--color-surface)',
            padding: 10,
            borderRadius: 6,
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--font-size-xs)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            color: 'var(--text-muted)',
            margin: 0,
          }}>
            {record.call_stack}
          </pre>
        </div>
      )}
      {record.related_request_id && (
        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
          {t('hookLog.relatedRequestId')}: <code style={{ background: 'var(--color-surface)', padding: '1px 4px', borderRadius: 3, fontSize: 'var(--font-size-xs)' }}>{record.related_request_id}</code>
        </div>
      )}
    </div>
  )
}

const HookLog: React.FC<HookLogProps> = ({ hooks }) => {
  const { t } = useLocale()
  const columns: VTColumn<JsHookRecord>[] = useMemo(() => [
    {
      key: 'timestamp',
      title: t('hookLog.time'),
      dataIndex: 'timestamp',
      width: 100,
      render: (val) => new Date(val as number).toLocaleTimeString(),
      sorter: (a, b) => a.timestamp - b.timestamp,
    },
    {
      key: 'hook_type',
      title: t('hookLog.type'),
      dataIndex: 'hook_type',
      width: 110,
      render: (val) => <Tag color={HOOK_TYPE_COLORS[val as HookType] || 'default'}>{val as string}</Tag>,
      filters: (['fetch', 'xhr', 'crypto', 'crypto_lib', 'cookie_set'] as HookType[]).map(t => ({ text: t, value: t })),
      onFilter: (value, record) => record.hook_type === value,
    },
    {
      key: 'function_name',
      title: t('hookLog.function'),
      dataIndex: 'function_name',
      width: 160,
      render: (val) => (
        <code style={{ fontSize: 'var(--font-size-sm)', background: 'var(--color-surface)', padding: '1px 4px', borderRadius: 3, color: 'var(--color-warning)' }}>
          {val as string}
        </code>
      ),
    },
    {
      key: 'arguments',
      title: t('hookLog.arguments'),
      dataIndex: 'arguments',
      render: (val) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-sm)' }} title={val as string}>
          {truncate(val as string)}
        </span>
      ),
    },
    {
      key: 'result',
      title: t('hookLog.result'),
      dataIndex: 'result',
      width: 200,
      render: (val) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-sm)' }} title={(val as string) || ''}>
          {truncate(val as string | null)}
        </span>
      ),
    },
  ], [t])

  return (
    <VirtualTable<JsHookRecord>
      columns={columns}
      data={hooks}
      rowKey="id"
      height={400}
      expandable={{
        expandedRowRender: (record) => <ExpandedRow record={record} />,
        rowExpandable: () => true,
      }}
      emptyText={t('hookLog.empty')}
    />
  )
}

export default HookLog
