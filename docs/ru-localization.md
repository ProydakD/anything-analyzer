# Русская локализация

## Область покрытия

Русская локализация покрывает:

- интерфейс renderer через `src/renderer/i18n/ru.ts`;
- переключатель языка `zh -> en -> ru`;
- названия тем оформления через `nameRu`;
- встроенные prompt templates через `src/main/prompt-templates.ts`;
- AI prompt, pre-filter prompt, progress-сообщения и `get_request_detail` через `src/main/ai/prompt-builder.ts` и `src/main/ai/ai-analyzer.ts`;
- follow-up чат через передачу `locale` из renderer в IPC.

## Правила для новых строк

1. Пользовательские строки renderer добавляются в `en.ts` и `ru.ts`; `zh.ts` может использовать fallback, но для стабильной китайской локали лучше добавлять ключи туда же.
2. Новые ключи должны использовать `LocaleKey`, чтобы отсутствие перевода проявлялось на этапе TypeScript.
3. Строки, которые попадают в AI prompt или progress UI, не должны оставаться захардкоженными в main process без учёта `AppLocale`.
4. Пользовательски изменённые prompt templates не локализуются поверх сохранённых значений.

## Проверки

После изменения локализации запускайте:

```bash
pnpm test
pnpm build
```

Для ручного аудита полезно искать пользовательские строки в renderer:

```bash
rg -n "\"[^\"]*[A-Za-zА-Яа-я][^\"]*\"" src/renderer -g "*.tsx"
```
