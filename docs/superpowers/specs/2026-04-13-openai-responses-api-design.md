# Проектирование поддержки OpenAI Responses API

**Дата:** 2026-04-13
**Статус:** утверждено
**Проект:** Anything Analyzer

## Цель

Добавить поддержку OpenAI Responses API наряду с Chat Completions API, сохранив совместимость с существующими provider-настройками.

## Контекст

В приложении уже есть `LLMRouter`, который маршрутизирует запросы к OpenAI-compatible, Anthropic-compatible и custom providers. Нужно добавить режим `responses`, чтобы OpenAI можно было использовать через `/responses`.

## Ограничения

- Нельзя ломать существующие настройки provider.
- Streaming и non-streaming режимы должны работать одинаково предсказуемо.
- Логи AI-запросов должны сохранять request/response body.
- Ошибки формата ответа должны быть явными.

## Изменения типов

В `src/shared/types.ts` добавляется:

```typescript
export type OpenAIApiType = "completions" | "responses";
```

`LLMProviderConfig` получает поле:

```typescript
apiType?: OpenAIApiType;
```

Если поле не задано, используется прежний Chat Completions route.

## Изменения LLMRouter

### Маршрутизация

- `apiType === "responses"` отправляет запрос в `/responses`;
- `apiType === "completions"` или пустое значение использует `/chat/completions`;
- custom providers сохраняют прежнее поведение.

### `completeResponses()`

Метод собирает body:

- `model`;
- `input`;
- `instructions` из system message;
- `max_output_tokens`;
- `stream`.

### Non-streaming parsing

Поддерживаются:

- `output_text`;
- текстовые блоки внутри `output`;
- usage tokens.

Если текста нет, выбрасывается понятная ошибка формата.

### Streaming parsing

SSE parser читает события Responses API:

- text delta;
- completed;
- failed;
- incomplete;
- usage.

Парсер должен обрабатывать последний SSE line даже без завершающего newline.

## Изменения UI

В настройках LLM добавляется selector API type:

- Chat Completions;
- Responses API.

Поле видно для OpenAI-compatible providers и сохраняется в конфиг.

## Проверки

- Unit-тесты для routing.
- Unit-тесты для non-streaming Responses API.
- Unit-тесты для streaming Responses API.
- Сборка renderer и main.

## Риски

- Некоторые OpenAI-compatible gateways могут не поддерживать `/responses`.
- Формат streaming events может отличаться у сторонних gateways.
- Нельзя смешивать `max_tokens` и `max_output_tokens` без явного mapping.
