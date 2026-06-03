/**
 * Theme metadata — all available application themes.
 */

export interface ThemeMeta {
  id: string
  name: string        // 中文显示名
  nameEn: string      // 英文显示名
  nameRu: string      // Русское отображаемое имя
  type: 'dark' | 'light'
  accent: string      // 代表色（预览色块）
}

export const THEMES: ThemeMeta[] = [
  { id: 'dark',        name: '默认深色',     nameEn: 'Default Dark',  nameRu: 'Тёмная по умолчанию', type: 'dark',  accent: '#60a5fa' },
  { id: 'light',       name: '亮色清爽',     nameEn: 'Light',         nameRu: 'Светлая', type: 'light', accent: '#3b82f6' },
  { id: 'discord',     name: 'Discord 暖灰', nameEn: 'Discord',       nameRu: 'Discord', type: 'dark',  accent: '#5865f2' },
  { id: 'github-dark', name: 'GitHub Dark',  nameEn: 'GitHub Dark',   nameRu: 'GitHub Dark', type: 'dark',  accent: '#58a6ff' },
  { id: 'catppuccin',  name: 'Catppuccin',   nameEn: 'Catppuccin',    nameRu: 'Catppuccin', type: 'dark',  accent: '#cba6f7' },
  { id: 'dracula',     name: 'Dracula',      nameEn: 'Dracula',       nameRu: 'Dracula', type: 'dark',  accent: '#ff79c6' },
  { id: 'nord',        name: 'Nord 极光蓝',  nameEn: 'Nord',          nameRu: 'Nord', type: 'dark',  accent: '#88c0d0' },
  { id: 'tokyo-night', name: 'Tokyo Night',  nameEn: 'Tokyo Night',   nameRu: 'Tokyo Night', type: 'dark',  accent: '#7aa2f7' },
  { id: 'gruvbox',     name: 'Gruvbox 暖调', nameEn: 'Gruvbox',       nameRu: 'Gruvbox', type: 'dark',  accent: '#fe8019' },
  { id: 'ayu-dark',    name: 'Ayu Dark',     nameEn: 'Ayu Dark',      nameRu: 'Ayu Dark', type: 'dark',  accent: '#e6b450' },
  { id: 'one-dark',    name: 'One Dark',     nameEn: 'One Dark',      nameRu: 'One Dark', type: 'dark',  accent: '#61afef' },
]

export const DEFAULT_THEME = 'dark'

export function getThemeById(id: string): ThemeMeta | undefined {
  return THEMES.find(t => t.id === id)
}
