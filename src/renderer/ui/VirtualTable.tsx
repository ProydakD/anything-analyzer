import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useLocale } from '../i18n'
import styles from './VirtualTable.module.css'

/* ---- Types ---- */
export interface VTColumn<T> {
  key: string
  title: string
  dataIndex?: string
  width?: number
  render?: (value: unknown, record: T, index: number) => React.ReactNode
  sorter?: (a: T, b: T) => number
  ellipsis?: boolean
  filters?: Array<{ text: string; value: string }>
  filterSearch?: boolean
  onFilter?: (value: string, record: T) => boolean
}

export interface VTRowSelection<T> {
  selectedKeys: (string | number)[]
  onChange: (keys: (string | number)[], rows: T[]) => void
}

export interface VirtualTableProps<T> {
  columns: VTColumn<T>[]
  data: T[]
  rowKey: string | ((record: T) => string | number)
  rowHeight?: number
  height?: number
  showHeader?: boolean
  onRow?: (record: T) => { onClick?: () => void; className?: string }
  rowSelection?: VTRowSelection<T>
  expandable?: {
    expandedRowRender: (record: T) => React.ReactNode
    rowExpandable?: (record: T) => boolean
  }
  emptyText?: string
  onFilterDropdownOpenChange?: (open: boolean) => void
}

/* ---- Helpers ---- */
function getRowKey<T>(record: T, rowKey: string | ((r: T) => string | number)): string | number {
  return typeof rowKey === 'function' ? rowKey(record) : (record as Record<string, unknown>)[rowKey] as string | number
}

function getValue<T>(record: T, dataIndex?: string): unknown {
  if (!dataIndex) return record
  return (record as Record<string, unknown>)[dataIndex]
}

/* ---- Filter Dropdown (Portal-based to avoid overflow clipping) ---- */
function FilterDropdown({ column, activeFilters, onChange, onClose, filterSearch, anchorRef }: {
  column: { filters: Array<{ text: string; value: string }> }
  activeFilters: Set<string>
  onChange: (filters: Set<string>) => void
  onClose: () => void
  filterSearch?: boolean
  anchorRef: React.RefObject<HTMLButtonElement | null>
}) {
  const { t } = useLocale()
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 })

  // Calculate position from anchor button
  useEffect(() => {
    if (!anchorRef.current) return
    const rect = anchorRef.current.getBoundingClientRect()
    const dropdownWidth = 180
    // Prefer aligning left edge with button; clamp to viewport
    let left = rect.left
    if (left + dropdownWidth > window.innerWidth) {
      left = Math.max(4, window.innerWidth - dropdownWidth - 4)
    }
    setPos({ top: rect.bottom + 2, left })
  }, [anchorRef])

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) &&
          anchorRef.current && !anchorRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [onClose, anchorRef])

  const filtered = search
    ? column.filters.filter(f => f.text.toLowerCase().includes(search.toLowerCase()))
    : column.filters

  const toggle = (val: string) => {
    const next = new Set(activeFilters)
    if (next.has(val)) next.delete(val)
    else next.add(val)
    onChange(next)
  }

  return createPortal(
    <div ref={ref} className={styles.filterDropdown} style={{ position: 'fixed', top: pos.top, left: pos.left }}>
      {filterSearch && (
        <div className={styles.filterSearch}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('common.search')} autoFocus />
        </div>
      )}
      {filtered.map(f => (
        <label key={f.value} className={styles.filterItem}>
          <input type="checkbox" className={styles.filterCheckbox} checked={activeFilters.has(f.value)} onChange={() => toggle(f.value)} />
          {f.text}
        </label>
      ))}
      <div className={styles.filterActions}>
        <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 'var(--font-size-xs)' }} onClick={() => onChange(new Set())}>{t('common.reset')}</button>
        <button style={{ background: 'none', border: 'none', color: 'var(--color-info)', cursor: 'pointer', fontSize: 'var(--font-size-xs)' }} onClick={onClose}>{t('common.ok')}</button>
      </div>
    </div>,
    document.body
  )
}

/* ---- VirtualTable ---- */
export function VirtualTable<T>({
  columns,
  data,
  rowKey,
  rowHeight = 34,
  height: heightProp,
  showHeader = true,
  onRow,
  rowSelection,
  expandable,
  emptyText,
  onFilterDropdownOpenChange,
}: VirtualTableProps<T>) {
  const { t } = useLocale()
  const resolvedEmptyText = emptyText ?? t('common.noData')
  const [sortState, setSortState] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null)
  const [filterState, setFilterState] = useState<Record<string, Set<string>>>({})
  const [openFilter, setOpenFilter] = useState<string | null>(null)
  const [expandedKeys, setExpandedKeys] = useState<Set<string | number>>(new Set())
  const bodyRef = useRef<HTMLDivElement>(null)
  const [autoHeight, setAutoHeight] = useState(heightProp ?? 400)

  // Auto-detect container height via ResizeObserver when no explicit height given
  useEffect(() => {
    if (heightProp != null) return
    const el = bodyRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const h = Math.floor(entry.contentRect.height)
        if (h > 0) setAutoHeight(h)
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [heightProp])

  const height = heightProp ?? autoHeight

  const handleFilterOpen = useCallback((key: string | null) => {
    const wasOpen = openFilter !== null
    const isOpen = key !== null
    setOpenFilter(key)
    if (wasOpen !== isOpen) onFilterDropdownOpenChange?.(isOpen)
  }, [openFilter, onFilterDropdownOpenChange])

  // Apply filters
  const filteredData = useMemo(() => {
    let result = data
    for (const col of columns) {
      const active = filterState[col.key]
      if (active && active.size > 0 && col.onFilter) {
        result = result.filter(r => {
          for (const val of active) {
            if (col.onFilter!(val, r)) return true
          }
          return false
        })
      }
    }
    return result
  }, [data, columns, filterState])

  // Apply sort
  const sortedData = useMemo(() => {
    if (!sortState) return filteredData
    const col = columns.find(c => c.key === sortState.key)
    if (!col?.sorter) return filteredData
    const sorted = [...filteredData].sort(col.sorter)
    return sortState.dir === 'desc' ? sorted.reverse() : sorted
  }, [filteredData, sortState, columns])

  const toggleSort = (key: string) => {
    setSortState(prev => {
      if (prev?.key !== key) return { key, dir: 'asc' }
      if (prev.dir === 'asc') return { key, dir: 'desc' }
      return null
    })
  }

  const toggleExpand = useCallback((key: string | number) => {
    setExpandedKeys(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const allKeys = useMemo(() => sortedData.map(r => getRowKey(r, rowKey)), [sortedData, rowKey])
  const allSelected = rowSelection && allKeys.length > 0 && allKeys.every(k => rowSelection.selectedKeys.includes(k))

  const toggleSelectAll = () => {
    if (!rowSelection) return
    if (allSelected) rowSelection.onChange([], [])
    else rowSelection.onChange(allKeys, sortedData)
  }

  // Track last clicked row index for shift+click range selection
  const lastClickedIndexRef = useRef<number | null>(null)

  const toggleSelectRow = (record: T, event?: React.MouseEvent) => {
    if (!rowSelection) return
    const key = getRowKey(record, rowKey)
    const currentIndex = sortedData.findIndex(r => getRowKey(r, rowKey) === key)

    // Shift+click: range selection
    if (event?.shiftKey && lastClickedIndexRef.current !== null && currentIndex >= 0) {
      const start = Math.min(lastClickedIndexRef.current, currentIndex)
      const end = Math.max(lastClickedIndexRef.current, currentIndex)
      const rangeKeys = sortedData.slice(start, end + 1).map(r => getRowKey(r, rowKey))
      // Merge with existing selection
      const mergedKeys = new Set([...rowSelection.selectedKeys, ...rangeKeys])
      const nextKeys = Array.from(mergedKeys)
      const nextRows = sortedData.filter(r => nextKeys.includes(getRowKey(r, rowKey)))
      rowSelection.onChange(nextKeys, nextRows)
      lastClickedIndexRef.current = currentIndex
      return
    }

    lastClickedIndexRef.current = currentIndex
    const idx = rowSelection.selectedKeys.indexOf(key)
    let nextKeys: (string | number)[]
    if (idx >= 0) nextKeys = rowSelection.selectedKeys.filter(k => k !== key)
    else nextKeys = [...rowSelection.selectedKeys, key]
    const nextRows = sortedData.filter(r => nextKeys.includes(getRowKey(r, rowKey)))
    rowSelection.onChange(nextKeys, nextRows)
  }

  const hasExpand = !!expandable

  // Refs for filter button anchors
  const filterBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  // Render header
  const renderHeader = () => (
    <div className={styles.headerRow}>
      {rowSelection && (
        <div className={styles.checkboxCell}>
          <input type="checkbox" className={styles.checkbox} checked={allSelected ?? false} onChange={toggleSelectAll} />
        </div>
      )}
      {hasExpand && <div style={{ width: 32, flexShrink: 0 }} />}
      {columns.map(col => {
        const hasSorter = !!col.sorter
        const hasFilter = col.filters && col.filters.length > 0
        const isFlexCol = !col.width
        const cls = isFlexCol ? styles.headerCellFlex : styles.headerCell
        const sortCls = hasSorter ? styles.sortable : ''
        const activeFilter = filterState[col.key]
        const isFilterActive = activeFilter && activeFilter.size > 0

        return (
          <div key={col.key} className={`${cls} ${sortCls}`} style={col.width ? { width: col.width } : undefined} onClick={hasSorter ? () => toggleSort(col.key) : undefined}>
            <span className={styles.headerLabel}>{col.title}</span>
            {hasSorter && (
              <span className={`${styles.sortIcon} ${sortState?.key === col.key ? styles.sortActive : ''}`}>
                {sortState?.key === col.key ? (sortState.dir === 'asc' ? '\u25B2' : '\u25BC') : '\u25B4'}
              </span>
            )}
            {hasFilter && (
              <>
                <button
                  ref={el => { filterBtnRefs.current[col.key] = el }}
                  className={`${styles.filterBtn} ${isFilterActive ? styles.filterActive : ''}`}
                  onClick={(e) => { e.stopPropagation(); handleFilterOpen(openFilter === col.key ? null : col.key) }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M3 4h18l-7 8v6l-4 2v-8z" /></svg>
                </button>
                {openFilter === col.key && (
                  <FilterDropdown
                    column={col as { filters: Array<{ text: string; value: string }> }}
                    activeFilters={activeFilter || new Set()}
                    filterSearch={col.filterSearch}
                    onChange={(filters) => setFilterState(prev => ({ ...prev, [col.key]: filters }))}
                    onClose={() => handleFilterOpen(null)}
                    anchorRef={{ current: filterBtnRefs.current[col.key] ?? null }}
                  />
                )}
              </>
            )}
          </div>
        )
      })}
    </div>
  )

  // Render a single row (used by both expandable and virtual modes)
  const renderRow = (record: T, index: number, rowStyle?: React.CSSProperties) => {
    const key = getRowKey(record, rowKey)
    const rowProps = onRow?.(record)
    const isSelected = rowSelection?.selectedKeys.includes(key)
    const isExpanded = hasExpand && expandedKeys.has(key)
    const canExpand = hasExpand && (expandable?.rowExpandable ? expandable.rowExpandable(record) : true)

    return (
      <React.Fragment key={key}>
        <div
          style={rowStyle}
          className={`${styles.row} ${isSelected ? styles.rowSelected : ''} ${rowProps?.className ?? ''} ${rowProps?.onClick ? styles.rowClickable : ''}`}
          onClick={rowProps?.onClick}
        >
          {rowSelection && (
            <div className={styles.checkboxCell}>
              <input type="checkbox" className={styles.checkbox} checked={isSelected ?? false} onClick={(e) => { e.stopPropagation(); toggleSelectRow(record, e as unknown as React.MouseEvent) }} readOnly />
            </div>
          )}
          {hasExpand && (
            <div
              style={{ width: 32, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: canExpand ? 'pointer' : 'default', color: 'var(--text-muted)' }}
              onClick={(e) => { e.stopPropagation(); if (canExpand) toggleExpand(key) }}
            >
              {canExpand && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              )}
            </div>
          )}
          {columns.map(col => {
            const val = getValue(record, col.dataIndex)
            const isFlexCol = !col.width
            return (
              <div key={col.key} className={isFlexCol ? styles.cellFlex : styles.cell} style={col.width ? { width: col.width } : undefined}>
                {col.render ? col.render(val, record, index) : String(val ?? '')}
              </div>
            )
          })}
        </div>
        {isExpanded && (
          <div className={styles.expandedContent}>
            {expandable!.expandedRowRender(record)}
          </div>
        )}
      </React.Fragment>
    )
  }

  // If using expandable rows, use native scroll (variable height rows)
  if (hasExpand) {
    return (
      <div className={styles.wrapper}>
        {showHeader && renderHeader()}
        <div className={styles.body} style={{ maxHeight: height }}>
          {sortedData.length === 0 ? (
            <div className={styles.empty}>{resolvedEmptyText}</div>
          ) : (
            sortedData.map((record, idx) => renderRow(record, idx))
          )}
        </div>
      </div>
    )
  }

  // Virtual scroll mode (no expandable rows) — native implementation
  const [scrollTop, setScrollTop] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const totalHeight = sortedData.length * rowHeight
  const visibleCount = Math.ceil(height / rowHeight) + 2 // overscan by 2
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - 1)
  const endIndex = Math.min(sortedData.length, startIndex + visibleCount)

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  return (
    <div className={styles.wrapper}>
      {showHeader && renderHeader()}
      <div ref={bodyRef} style={{ flex: 1, minHeight: 0 }}>
        {sortedData.length === 0 ? (
          <div className={styles.empty}>{resolvedEmptyText}</div>
        ) : (
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            style={{ height, width: '100%', overflow: 'auto' }}
          >
            <div style={{ height: totalHeight, position: 'relative' }}>
              {sortedData.slice(startIndex, endIndex).map((record, i) => {
                const actualIndex = startIndex + i
                return renderRow(record, actualIndex, {
                  position: 'absolute',
                  top: actualIndex * rowHeight,
                  left: 0,
                  right: 0,
                  height: rowHeight,
                })
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
