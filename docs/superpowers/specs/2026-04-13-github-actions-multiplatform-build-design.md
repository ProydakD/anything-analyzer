# Проектирование мультиплатформенной сборки GitHub Actions

**Дата:** 2026-04-13
**Статус:** утверждено
**Проект:** Anything Analyzer

## Цель

Настроить GitHub Actions workflow, который собирает установочные артефакты Electron-приложения для Windows, macOS и Linux.

## Ограничения

- Сборка использует `pnpm`.
- Electron Builder должен получать корректные имена артефактов для разных архитектур.
- macOS auto-update требует подписанный и нотариально заверенный пакет.
- Неподписанный DMG можно публиковать как ручной download, но он не подходит для автообновления.

## Стратегия запуска

Workflow запускается:

- вручную через `workflow_dispatch`;
- при публикации релиза или push tag;
- при необходимости через отдельный release job.

## Матрица сборки

| Платформа | Runner | Артефакт |
| --- | --- | --- |
| Windows x64 | `windows-latest` | NSIS installer |
| macOS arm64 | `macos-latest` или arm runner | DMG |
| macOS x64 | macOS runner x64 | DMG |
| Linux x64 | `ubuntu-latest` | AppImage |

Два macOS runner нужны, чтобы получать корректные `arm64` и `x64` артефакты без ненадёжной кросс-сборки.

## Pipeline

Для каждой платформы:

1. Checkout.
2. Setup Node.js.
3. Setup pnpm.
4. Install dependencies.
5. Run tests.
6. Run `pnpm build`.
7. Run Electron Builder for target platform.
8. Upload artifacts.

## Изменения файлов

- `.github/workflows/*`: workflow сборки.
- `electron-builder.yml`: имена артефактов и target-платформы.
- Документация релиза: требования к signing secrets.

## Риски

- Нативные зависимости могут требовать платформенных build tools.
- macOS signing secrets нельзя подменять тестовыми значениями.
- Auto-update для macOS не должен публиковаться без подписи и notarization.
