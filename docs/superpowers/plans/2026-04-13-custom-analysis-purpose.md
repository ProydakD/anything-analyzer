# План внедрения выбора цели анализа

**Дата:** 2026-04-13
**Статус:** выполненный план, сохранён как архивная документация
**Стек:** React, TypeScript, Electron IPC, Vitest

## Цель

Позволить пользователю выбрать режим AI-анализа или ввести собственный фокус перед запуском отчёта.

## Архитектура

Параметр `purpose?: string` проходит через:

```text
ControlBar -> App -> useCapture -> preload -> IPC -> AiAnalyzer -> PromptBuilder
```

`PromptBuilder` выбирает набор требований по `purpose`. Shared-константа `ANALYSIS_PURPOSES` хранит fallback-список режимов, а актуальный UI использует prompt templates.

## Задачи

### 1. Shared types

Файл: `src/shared/types.ts`

- добавить список сценариев анализа;
- обновить тип `AnalysisPurposeId`;
- расширить `ElectronAPI.startAnalysis`;
- сохранить обратную совместимость за счёт optional-параметра.

### 2. PromptBuilder

Файл: `src/main/ai/prompt-builder.ts`

- добавить `purpose?: string`;
- вынести требования в отдельные константы;
- поддержать режимы `auto`, `reverse-api`, `security-audit`, `performance`, `crypto-reverse`;
- для произвольного текста добавлять пользовательский фокус и базовые требования.

### 3. AiAnalyzer и IPC

Файлы:

- `src/main/ai/ai-analyzer.ts`;
- `src/main/ipc.ts`;
- `src/preload/index.ts`;
- `src/renderer/hooks/useCapture.ts`.

Нужно прокинуть `purpose` без изменения старых вызовов.

### 4. UI выбора режима

Файлы:

- `src/renderer/components/ControlBar.tsx`;
- `src/renderer/components/AnalyzeBar.tsx`;
- `src/renderer/components/ReportView.tsx`.

Требования:

- selector режимов;
- поддержка «Своя инструкция»;
- передача выбранного режима в `onAnalyze`;
- корректное disabled-состояние во время анализа.

### 5. Тестирование

Команды:

```bash
pnpm test
pnpm build
```

Проверки:

- базовый режим `auto`;
- каждый предопределённый режим;
- произвольная инструкция;
- отсутствие регрессий IPC;
- запуск анализа из UI.

## Риски

- Избыточный список режимов может усложнить UX.
- Нельзя терять базовые требования при пользовательском фокусе.
- Для больших сессий режим должен корректно работать с предварительной фильтрацией.
