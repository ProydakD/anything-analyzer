import React, { useMemo } from 'react'
import { Collapse, Tag, Empty, Timeline } from '../ui'
import { IconShield, IconDatabase, IconApp } from '../ui/Icons'
import type { StorageSnapshot, StorageType } from '@shared/types'
import { useLocale } from '../i18n'
import type { LocaleKey } from '../i18n'
import styles from './StorageView.module.css'

interface StorageViewProps {
  snapshots: StorageSnapshot[]
}

const STORAGE_META: Record<StorageType, { labelKey: LocaleKey; icon: React.ReactNode; color: 'orange' | 'info' | 'success' }> = {
  cookie: { labelKey: 'storage.cookies', icon: <IconShield size={14} />, color: 'orange' },
  localStorage: { labelKey: 'storage.localStorage', icon: <IconDatabase size={14} />, color: 'info' },
  sessionStorage: { labelKey: 'storage.sessionStorage', icon: <IconApp size={14} />, color: 'success' },
}

function parseStorageData(data: string): Array<{ key: string; value: string }> {
  try {
    const parsed = JSON.parse(data)
    if (typeof parsed === 'object' && parsed !== null) {
      return Object.entries(parsed).map(([key, value]) => ({
        key,
        value: typeof value === 'string' ? value : JSON.stringify(value),
      }))
    }
  } catch { /* ignore */ }
  return []
}

function computeDiff(
  oldData: string,
  newData: string
): Array<{ key: string; action: 'added' | 'removed' | 'changed'; oldValue?: string; newValue?: string }> {
  const oldEntries = parseStorageData(oldData)
  const newEntries = parseStorageData(newData)
  const oldMap = new Map(oldEntries.map(e => [e.key, e.value]))
  const newMap = new Map(newEntries.map(e => [e.key, e.value]))
  const diffs: Array<{ key: string; action: 'added' | 'removed' | 'changed'; oldValue?: string; newValue?: string }> = []

  for (const [key, value] of newMap) {
    if (!oldMap.has(key)) diffs.push({ key, action: 'added', newValue: value })
    else if (oldMap.get(key) !== value) diffs.push({ key, action: 'changed', oldValue: oldMap.get(key), newValue: value })
  }
  for (const [key] of oldMap) {
    if (!newMap.has(key)) diffs.push({ key, action: 'removed', oldValue: oldMap.get(key) })
  }
  return diffs
}

const DIFF_COLORS: Record<string, 'success' | 'error' | 'info'> = { added: 'success', removed: 'error', changed: 'info' }

// KV Table using plain HTML table
const KVTable: React.FC<{ entries: Array<{ key: string; value: string }> }> = ({ entries }) => {
  const { t } = useLocale()
  return (
  <table className={styles.kvTable}>
    <thead>
      <tr>
        <th style={{ width: '35%' }}>{t('storage.key')}</th>
        <th>{t('storage.value')}</th>
      </tr>
    </thead>
    <tbody>
      {entries.map(e => (
        <tr key={e.key}>
          <td><code className={styles.codeInline}>{e.key}</code></td>
          <td className={styles.valueCell} title={e.value}>{e.value}</td>
        </tr>
      ))}
    </tbody>
  </table>
  )
}

// Diff timeline
const DiffTimeline: React.FC<{ snapshots: StorageSnapshot[] }> = ({ snapshots }) => {
  const { t } = useLocale()
  if (snapshots.length < 2) return null

  const sorted = [...snapshots].sort((a, b) => a.timestamp - b.timestamp)
  const items: Array<{ key: string; color?: string; children: React.ReactNode }> = []

  for (let i = 1; i < sorted.length; i++) {
    const diffs = computeDiff(sorted[i - 1].data, sorted[i].data)
    if (diffs.length === 0) continue

    items.push({
      key: `diff-${i}`,
      color: 'var(--color-info)',
      children: (
        <div>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
            {new Date(sorted[i].timestamp).toLocaleString()}
          </span>
          <div style={{ marginTop: 4 }}>
            {diffs.map(d => (
              <div key={d.key} style={{ marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Tag color={DIFF_COLORS[d.action]}>{t(`storage.${d.action}` as LocaleKey)}</Tag>
                <code className={styles.codeInline}>{d.key}</code>
                {d.newValue && (
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginLeft: 4 }}>
                    = {d.newValue.length > 60 ? d.newValue.slice(0, 60) + '...' : d.newValue}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ),
    })
  }

  if (items.length === 0) return null

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontWeight: 600, fontSize: 'var(--font-size-base)', color: 'var(--text-primary)', marginBottom: 8 }}>{t('storage.changesTimeline')}</div>
      <Timeline items={items} />
    </div>
  )
}

// Single storage type section
const StorageSection: React.FC<{ type: StorageType; snapshots: StorageSnapshot[] }> = ({ type, snapshots }) => {
  const { t } = useLocale()
  const meta = STORAGE_META[type]
  const label = t(meta.labelKey)
  const sorted = [...snapshots].sort((a, b) => b.timestamp - a.timestamp)
  const latestEntries = sorted.length > 0 ? parseStorageData(sorted[0].data) : []

  return (
    <div>
      {latestEntries.length > 0 ? (
        <>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: 8 }}>
            {t('storage.latestSnapshot', {
              time: new Date(sorted[0].timestamp).toLocaleString(),
              count: latestEntries.length,
              domain: sorted[0].domain,
            })}
          </div>
          <KVTable entries={latestEntries} />
          {sorted.length > 1 && <DiffTimeline snapshots={sorted} />}
        </>
      ) : (
        <Empty description={t('storage.noTypeData', { type: label.toLowerCase() })} />
      )}
    </div>
  )
}

const StorageView: React.FC<StorageViewProps> = ({ snapshots }) => {
  const { t } = useLocale()
  const grouped = useMemo(() => {
    const groups: Record<StorageType, StorageSnapshot[]> = { cookie: [], localStorage: [], sessionStorage: [] }
    for (const snap of snapshots) {
      if (groups[snap.storage_type]) groups[snap.storage_type].push(snap)
    }
    return groups
  }, [snapshots])

  if (snapshots.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 200 }}>
        <Empty description={t('storage.empty')} />
      </div>
    )
  }

  const collapseItems = (['cookie', 'localStorage', 'sessionStorage'] as StorageType[]).map(type => {
    const meta = STORAGE_META[type]
    const count = grouped[type].length
    return {
      key: type,
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {meta.icon}
          <span>{t(meta.labelKey)}</span>
          {count > 0 && <Tag color={meta.color}>{t(count === 1 ? 'storage.snapshotCount' : 'storage.snapshotCountPlural', { count })}</Tag>}
        </span>
      ),
      children: <StorageSection type={type} snapshots={grouped[type]} />,
    }
  })

  return <Collapse items={collapseItems} defaultActiveKey={['cookie', 'localStorage', 'sessionStorage']} />
}

export default StorageView
