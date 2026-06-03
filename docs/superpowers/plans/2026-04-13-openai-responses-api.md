# План внедрения OpenAI Responses API

**Дата:** 2026-04-13
**Статус:** архивный план
**Цель:** добавить API type `responses` без регрессии Chat Completions.

## Структура работ

### Задача 1. Типы

Файл: `src/shared/types.ts`

- добавить `OpenAIApiType`;
- расширить `LLMProviderConfig.apiType`;
- обновить типы settings и IPC без обязательной миграции старых конфигов.

### Задача 2. Тесты LLMRouter

Файл: `tests/main/ai/llm-router.test.ts`

Покрыть:

- route на `/responses`;
- body non-streaming запроса;
- `instructions` из system message;
- parsing `output_text`;
- parsing nested `output`;
- failed/incomplete responses;
- streaming deltas;
- malformed JSON и отсутствие текста.

### Задача 3. Реализация LLMRouter

Файл: `src/main/ai/llm-router.ts`

Добавить:

- `completeResponses()`;
- `parseResponsesStream()`;
- чтение usage;
- явные ошибки формата;
- сохранение request/response в AI request log.

### Задача 4. Settings UI

Файлы:

- `src/renderer/components/settings/LLMSection.tsx`;
- связанные i18n словари.

Добавить selector API type:

- Chat Completions;
- Responses API.

Сохранение должно писать `apiType` в LLM config.

### Задача 5. End-to-end проверка

Команды:

```bash
pnpm test
pnpm build
```

Ручная проверка:

- OpenAI Chat Completions по старой настройке;
- OpenAI Responses API;
- streaming output;
- ошибка provider при неверном endpoint;
- сохранение логов.

## Риски

- Responses API имеет другой формат tokens и output.
- Сторонние gateways могут объявлять совместимость с OpenAI, но не поддерживать `/responses`.
- Некорректный streaming parser может потерять последний chunk.
