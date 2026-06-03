# План мультиплатформенной сборки GitHub Actions

**Дата:** 2026-04-13
**Статус:** архивный план
**Цель:** собрать Windows, macOS и Linux артефакты через GitHub Actions.

## Задача 1. Настроить `electron-builder.yml`

Требования:

- задать `artifactName` с `${version}`, `${arch}` и `${ext}`;
- сохранить NSIS для Windows;
- сохранить DMG для macOS;
- сохранить AppImage для Linux;
- не менять `appId` и `productName` без отдельного решения.

## Задача 2. Создать workflow

Основные шаги:

```yaml
checkout
setup-node
setup-pnpm
pnpm install
pnpm test
pnpm build
electron-builder
upload-artifact
```

Workflow должен поддерживать matrix по OS и архитектуре. Для macOS signing secrets передаются только в publish/release сборках.

## Задача 3. Проверить локально

Команды:

```bash
pnpm install
pnpm test
pnpm build
npx electron-builder --win
```

Для Linux и macOS локальная проверка зависит от платформы разработчика.

## Задача 4. Проверить на GitHub

- Запустить workflow вручную.
- Проверить имена и размеры артефактов.
- Проверить, что Windows installer запускается.
- Проверить, что Linux AppImage стартует.
- Для macOS проверить подпись и notarization перед включением auto-update.

## Риски

- Без signing/notarization macOS auto-update не должен считаться готовым.
- Кросс-сборка macOS с другой платформы ненадёжна.
- Нативные модули Electron требуют корректных platform dependencies.
