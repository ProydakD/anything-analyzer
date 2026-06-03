# Anything Analyzer

[Русский](README.md) | [English](README.en.md)

> Универсальный анализатор веб-протоколов: захватывает трафик из браузера, desktop-приложений, терминала, скриптов и мобильных устройств, а затем помогает AI восстановить API, сценарии, аутентификацию и криптографическую логику.

[![Electron](https://img.shields.io/badge/Electron-35-blue)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

<img alt="Скриншот Anything Analyzer" src="https://github.com/user-attachments/assets/87f24186-ea00-4a03-9634-4d7af4b224d4" />

## Зачем нужен Anything Analyzer

Обычные инструменты разделяют задачи: DevTools удобен только для браузера, Fiddler и Charles требуют отдельной прокси-настройки, Wireshark не показывает расшифрованный HTTPS без дополнительной работы. После захвата всё равно приходится вручную разбирать сотни запросов.

Anything Analyzer объединяет захват и AI-анализ в одной сессии:

```text
  Веб          Desktop          Терминал       Скрипты        Mobile / IoT
  Chrome       Postman          curl/wget      Python         App
    |          Electron            |           Node.js          |
    |             |                |              |             |
    v             v                v              v             v
 +----------+ +------------------------------------------------------+
 | Браузер  | |            MITM-прокси, порт 8888                   |
 |  CDP     | |  системный прокси / ручная настройка / Wi-Fi proxy  |
 +----+-----+ +------------------------+-----------------------------+
      |                              |
      +--------------+---------------+
                     v
            +----------------+
            | Единая сессия  |
            +--------+-------+
                     v
            +----------------+
            |   AI-анализ    |
            +----------------+
```

## Возможности

### Захват из разных источников

| Источник | Как захватывается | Типичные задачи |
| --- | --- | --- |
| Веб-сайт | Встроенный браузер | Реверс API, OAuth, фронтенд-шифрование |
| Desktop-приложение | MITM-прокси и системный прокси | Postman, Electron-приложения, игровые клиенты |
| Терминал | MITM-прокси и переменные окружения | curl, wget, httpie |
| Скрипты | MITM-прокси в коде | Python requests, Node.js fetch, Go http |
| Телефон или планшет | MITM-прокси и Wi-Fi proxy | iOS/Android приложения, WebView, H5 |
| IoT и другие устройства | MITM-прокси через шлюз | HTTP-трафик встраиваемых устройств |

Все запросы попадают в одну сессию, поэтому AI видит общую цепочку действий.

### AI-анализ

- Двухэтапная обработка: сначала фильтрация шумных запросов, затем глубокий анализ.
- Режимы: автоопределение, реверс API, аудит безопасности, производительность, реверс JS-шифрования.
- JS Hook: перехват fetch, XHR, crypto.subtle, CryptoJS, SM2/3/4 и связанных вызовов.
- Извлечение фрагментов криптографического кода из JS.
- Потоковая генерация отчёта и follow-up чат с доступом к деталям запросов.

### MCP-интеграция

- MCP Client подключает внешние MCP Server через stdio или StreamableHTTP.
- Встроенный MCP Server отдаёт возможности захвата и анализа внешним AI-инструментам, включая Claude Desktop и Cursor.
- Инструменты анализа поддерживают локаль `ru`, поэтому отчёты и follow-up ответы могут формироваться на русском.

## Быстрый старт

1. Скачайте установщик из [Releases](https://github.com/Mouseww/anything-analyzer/releases).
2. Откройте настройки и укажите LLM provider, API key, base URL, модель и лимит токенов.
3. Создайте сессию: задайте имя и целевой URL.
4. Запустите захват во встроенном браузере или настройте MITM-прокси для внешнего приложения.
5. Выполните нужный сценарий.
6. Остановите захват и нажмите «Анализ».

## MITM-прокси

Встроенный HTTPS MITM-прокси слушает порт `8888` и позволяет захватывать трафик внешних приложений.

```bash
curl -x http://127.0.0.1:8888 https://api.example.com/data

HTTP_PROXY=http://127.0.0.1:8888 HTTPS_PROXY=http://127.0.0.1:8888 node app.js
```

Для Python:

```python
import requests

proxies = {
    "http": "http://127.0.0.1:8888",
    "https": "http://127.0.0.1:8888",
}

requests.get("https://api.example.com/data", proxies=proxies)
```

Для HTTPS-трафика установите CA-сертификат через настройки MITM-прокси. Прокси работает в режиме только для чтения и не изменяет запросы или ответы.

## Документация

- [Подробная инструкция](USAGE.md)
- [Правила русской локализации](docs/ru-localization.md)
- [English README](README.en.md)

## Разработка

```bash
git clone https://github.com/MouseWW/anything-analyzer.git
cd anything-analyzer
pnpm install
pnpm dev
pnpm test
pnpm build
```

Требования: Node.js `>= 18`, pnpm, Visual Studio Build Tools на Windows для нативных зависимостей.

## Технологии

| Слой | Технологии |
| --- | --- |
| Framework | Electron 35, electron-vite |
| Frontend | React 19, Ant Design 5, TypeScript |
| База данных | better-sqlite3, локальный SQLite |
| Захват | Chrome DevTools Protocol, CDP Fetch |
| Прокси | Встроенный MITM HTTPS-прокси, node-forge TLS |
| AI | OpenAI, Anthropic, совместимые Chat Completions и Responses API |
| Расширения | MCP Client и встроенный MCP Server |

## Лицензия

MIT.
