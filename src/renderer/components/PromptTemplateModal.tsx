import { useEffect, useState, useCallback } from 'react'
import { Modal, Button, Input, TextArea, Tag, Popconfirm, useToast } from '../ui'
import { IconPlus, IconUndo, IconDelete, IconSave } from '../ui/Icons'
import { v4 as uuidv4 } from 'uuid'
import type { PromptTemplate } from '@shared/types'
import { useLocale } from '../i18n'

interface Props {
  open: boolean
  onClose: () => void
}

export default function PromptTemplateModal({ open, onClose }: Props) {
  const toast = useToast()
  const { locale, t } = useLocale()
  const [templates, setTemplates] = useState<PromptTemplate[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<PromptTemplate | null>(null)
  const [dirty, setDirty] = useState(false)

  const loadAll = useCallback(async () => {
    const list = await window.electronAPI.getPromptTemplates(locale)
    setTemplates(list)
    // Auto-select first if nothing selected
    if (!selectedId && list.length > 0) {
      setSelectedId(list[0].id)
      setEditForm({ ...list[0] })
    }
  }, [selectedId, locale])

  useEffect(() => {
    if (open) loadAll()
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = (id: string) => {
    const t = templates.find((tpl) => tpl.id === id)
    if (!t) return
    setSelectedId(id)
    setEditForm({ ...t })
    setDirty(false)
  }

  const handleFieldChange = (field: keyof PromptTemplate, value: string) => {
    if (!editForm) return
    setEditForm({ ...editForm, [field]: value })
    setDirty(true)
  }

  const handleSave = async () => {
    if (!editForm) return
    await window.electronAPI.savePromptTemplate(editForm)
    toast.success(t('promptTemplates.saved'))
    setDirty(false)
    await loadAll()
  }

  const handleReset = async () => {
    if (!editForm || !editForm.isBuiltin) return
    await window.electronAPI.resetPromptTemplate(editForm.id)
    toast.success(t('promptTemplates.reset'))
    const list = await window.electronAPI.getPromptTemplates(locale)
    setTemplates(list)
    const restored = list.find((t) => t.id === editForm.id)
    if (restored) {
      setEditForm({ ...restored })
      setDirty(false)
    }
  }

  const handleDelete = async () => {
    if (!editForm || editForm.isBuiltin) return
    await window.electronAPI.deletePromptTemplate(editForm.id)
    toast.success(t('promptTemplates.deleted'))
    setSelectedId(null)
    setEditForm(null)
    setDirty(false)
    const list = await window.electronAPI.getPromptTemplates(locale)
    setTemplates(list)
    if (list.length > 0) {
      setSelectedId(list[0].id)
      setEditForm({ ...list[0] })
    }
  }

  const handleCreate = () => {
    const newTemplate: PromptTemplate = {
      id: uuidv4(),
      name: t('promptTemplates.newName'),
      description: '',
      systemPrompt: t('promptTemplates.defaultSystemPrompt'),
      requirements: '',
      isBuiltin: false,
      isModified: false,
    }
    setSelectedId(newTemplate.id)
    setEditForm(newTemplate)
    setDirty(true)
  }

  return (
    <Modal
      title={t('promptTemplates.title')}
      open={open}
      onClose={onClose}
      width={800}
    >
      {/* Negate modal body padding so sidebar border runs edge-to-edge */}
      <div style={{ margin: '-16px -24px', display: 'flex', height: 520, overflow: 'hidden' }}>
        {/* Left: template list */}
        <div style={{
          width: 200,
          borderRight: '1px solid var(--color-border)',
          overflow: 'auto',
          flexShrink: 0,
        }}>
          <div style={{ padding: '8px 12px' }}>
            <Button
              variant="dashed"
              icon={<IconPlus size={13} />}
              block
              size="sm"
              onClick={handleCreate}
            >
              {t('promptTemplates.add')}
            </Button>
          </div>
          <div>
            {templates.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelect(item.id)}
                style={{
                  cursor: 'pointer',
                  padding: '8px 12px',
                  background: selectedId === item.id ? 'var(--color-accent-bg)' : 'transparent',
                  borderLeft: selectedId === item.id ? '3px solid var(--color-accent)' : '3px solid transparent',
                }}
              >
                <div style={{ minWidth: 0, width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                    <span style={{
                      fontSize: 'var(--font-size-base)',
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: 'var(--text-primary)',
                    }}>
                      {item.name}
                    </span>
                    {item.isBuiltin && (
                      <Tag style={{ fontSize: 'var(--font-size-2xs)', lineHeight: '16px', padding: '0 4px' }}>{t('promptTemplates.builtin')}</Tag>
                    )}
                    {item.isModified && (
                      <Tag color="orange" style={{ fontSize: 'var(--font-size-2xs)', lineHeight: '16px', padding: '0 4px' }}>{t('promptTemplates.modified')}</Tag>
                    )}
                  </div>
                  <span style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--text-secondary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'block',
                  }}>
                    {item.description}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: edit form */}
        <div style={{ flex: 1, padding: 16, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {editForm ? (
            <>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <span style={{ display: 'block', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 4 }}>
                    {t('promptTemplates.name')}
                  </span>
                  <Input
                    value={editForm.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    inputSize="sm"
                    disabled={editForm.isBuiltin}
                  />
                </div>
                <div style={{ flex: 2 }}>
                  <span style={{ display: 'block', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 4 }}>
                    {t('promptTemplates.description')}
                  </span>
                  <Input
                    value={editForm.description}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    inputSize="sm"
                  />
                </div>
              </div>

              <div>
                <span style={{ display: 'block', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 4 }}>
                  {t('promptTemplates.systemPrompt')}
                </span>
                <TextArea
                  value={editForm.systemPrompt}
                  onChange={(e) => handleFieldChange('systemPrompt', e.target.value)}
                  autoSize={{ minRows: 3, maxRows: 6 }}
                  style={{ fontSize: 'var(--font-size-sm)' }}
                />
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <span style={{ display: 'block', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 4 }}>
                  {t('promptTemplates.requirements')}
                </span>
                <TextArea
                  value={editForm.requirements}
                  onChange={(e) => handleFieldChange('requirements', e.target.value)}
                  style={{ flex: 1, fontSize: 'var(--font-size-sm)', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                {editForm.isBuiltin && editForm.isModified && (
                  <Popconfirm title={t('promptTemplates.confirmReset')} onConfirm={handleReset} okText={t('common.ok')} cancelText={t('common.cancel')}>
                    <Button size="sm" icon={<IconUndo size={13} />}>{t('common.reset')}</Button>
                  </Popconfirm>
                )}
                {!editForm.isBuiltin && (
                  <Popconfirm title={t('promptTemplates.confirmDelete')} onConfirm={handleDelete} okText={t('common.ok')} cancelText={t('common.cancel')}>
                    <Button size="sm" variant="danger" icon={<IconDelete size={13} />}>{t('common.delete')}</Button>
                  </Popconfirm>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  icon={<IconSave size={13} />}
                  onClick={handleSave}
                  disabled={!dirty}
                >
                  {t('common.save')}
                </Button>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{t('promptTemplates.selectOrCreate')}</span>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
