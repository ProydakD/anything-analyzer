import type {
  AppLocale,
  AssembledData,
  CryptoScriptSnippet,
  SceneHint,
  AuthChainItem,
  FilteredRequest,
  PromptTemplate,
  RequestSummary,
} from "@shared/types";

interface PromptMessages {
  system: string;
  user: string;
}

const REVERSE_API_REQUIREMENTS = `1. 完整 API 端点清单：列出所有 API 的方法、路径、请求参数、响应 JSON 结构
2. 鉴权流程：Token/Cookie 获取、刷新、传递机制的完整链路
3. 请求依赖链：哪些请求的响应是后续请求的必要输入
4. 数据模型推断：从 API 响应结构推断后端数据模型
5. 复现代码：用 Python requests 库写出可直接运行的完整 API 调用流程`;

const SECURITY_AUDIT_REQUIREMENTS = `1. 认证安全：分析认证方式的安全性，是否存在弱口令、明文传输、Token 泄露风险
2. 敏感数据暴露：检查响应中是否包含不必要的敏感信息（密码、密钥、PII）
3. CSRF/XSS 风险：分析请求是否缺少 CSRF Token，响应头是否缺少安全头（CSP, X-Frame-Options 等）
4. 权限控制：分析是否存在越权访问的可能（水平/垂直越权）
5. 安全建议：针对发现的问题给出具体修复建议`;

const PERFORMANCE_REQUIREMENTS = `1. 请求时序分析：分析请求的串行/并行关系，识别阻塞链路
2. 冗余请求：识别重复或不必要的请求
3. 资源优化：分析资源加载顺序，识别可优化的静态资源
4. 缓存策略：分析 Cache-Control、ETag 等缓存头的使用情况
5. 性能建议：给出具体的性能优化建议和预期收益`;

const CRYPTO_REVERSE_REQUIREMENTS = `1. 加密算法识别：识别所有使用的加密/签名/哈希算法（AES、RSA、SHA、HMAC、SM2/3/4 等），标注具体库和方法名
2. 加密流程还原：完整描述每个请求参数的加密 pipeline（明文 → 各步骤 → 密文），画出数据流转图
3. 密钥管理分析：密钥来源（硬编码/动态/协商）、密钥格式（Hex/Base64/PEM）、密钥长度
4. 签名/校验机制：请求签名的生成算法、参与签名的参数排序规则、时间戳/nonce 机制
5. 复现代码：用 Python 写出完整的加密/签名/请求复现代码，确保可直接运行，包含所有必要的密钥和参数`;

const DEFAULT_REQUIREMENTS = `1. 场景识别：判断用户执行了什么操作（注册、登录、AI对话、支付等）
2. 交互流程概述：按时间顺序描述完整交互链路
3. API端点清单：列出所有关键API，标注方法、路径、用途
4. 鉴权机制分析：认证方式、凭据获取流程、凭据传递方式
5. 流式通信分析（如检测到SSE/WebSocket）：协议类型、端点、请求/响应格式
6. 存储使用分析：Cookie/localStorage/sessionStorage 的关键变化
7. 关键依赖关系：请求之间的依赖和时序关系
8. 复现建议：用代码伪逻辑描述如何复现整个流程`;

const RU_DEFAULT_REQUIREMENTS = `1. Определить сценарий: что сделал пользователь (регистрация, вход, AI-чат, оплата и т.п.).
2. Описать цепочку взаимодействий по времени.
3. Составить список ключевых API: метод, путь и назначение.
4. Разобрать аутентификацию: способ, получение и передачу учётных данных.
5. Разобрать потоковую коммуникацию, если есть SSE/WebSocket: протокол, endpoint, формат запроса и ответа.
6. Описать использование хранилищ: ключевые изменения Cookie/localStorage/sessionStorage.
7. Показать зависимости и порядок запросов.
8. Дать рекомендации по воспроизведению: псевдологика или кодовый план полного сценария.`;

const RU_REVERSE_API_REQUIREMENTS = `1. Полный список API endpoint: метод, путь, параметры запроса и JSON-структура ответа.
2. Цепочка аутентификации: получение, обновление и передача Token/Cookie.
3. Зависимости запросов: какие ответы нужны последующим запросам.
4. Вывод модели данных по структурам API-ответов.
5. Код воспроизведения: полный запускаемый сценарий на Python requests.`;

const RU_SECURITY_AUDIT_REQUIREMENTS = `1. Безопасность аутентификации: слабые места, plaintext, риск утечки Token.
2. Утечки чувствительных данных: пароль, ключи, PII и лишние поля в ответах.
3. CSRF/XSS и заголовки безопасности: CSRF Token, CSP, X-Frame-Options и т.п.
4. Контроль доступа: риск горизонтального или вертикального повышения привилегий.
5. Практические рекомендации по исправлению найденных проблем.`;

const RU_PERFORMANCE_REQUIREMENTS = `1. Тайминг запросов: последовательность/параллельность и блокирующие цепочки.
2. Повторные или лишние запросы.
3. Оптимизация загрузки ресурсов и порядка их получения.
4. Cache-Control, ETag и другие политики кэширования.
5. Конкретные рекомендации по ускорению и ожидаемый эффект.`;

const RU_CRYPTO_REVERSE_REQUIREMENTS = `1. Определить алгоритмы шифрования, подписи и хэша (AES, RSA, SHA, HMAC, SM2/3/4 и т.п.), библиотеки и методы.
2. Восстановить поток шифрования параметров: открытый текст -> шаги -> шифртекст.
3. Разобрать управление ключами: источник, формат, длина.
4. Разобрать подпись/проверку: алгоритм, порядок параметров, timestamp/nonce.
5. Дать полный Python-код воспроизведения шифрования, подписи и запроса.`;

const EN_DEFAULT_REQUIREMENTS = `1. Identify the scenario: what the user did (registration, login, AI chat, payment, etc.).
2. Summarize the interaction flow in chronological order.
3. List key API endpoints with method, path, and purpose.
4. Analyze authentication: method, credential acquisition, and credential transmission.
5. Analyze streaming communication if SSE/WebSocket is detected: protocol, endpoint, request and response format.
6. Analyze storage usage: key Cookie/localStorage/sessionStorage changes.
7. Explain request dependencies and ordering.
8. Provide reproduction guidance with pseudologic or runnable steps.`;

const EN_REVERSE_API_REQUIREMENTS = `1. Complete API endpoint list: methods, paths, request parameters, and response JSON structures.
2. Authentication flow: Token/Cookie acquisition, refresh, and transmission.
3. Request dependency chain.
4. Data model inference from API responses.
5. Reproduction code using Python requests.`;

const EN_SECURITY_AUDIT_REQUIREMENTS = `1. Authentication security: weak credentials, plaintext transport, Token leakage risks.
2. Sensitive data exposure: passwords, keys, PII, and unnecessary response fields.
3. CSRF/XSS risks and missing security headers.
4. Authorization controls and privilege escalation risks.
5. Concrete remediation recommendations.`;

const EN_PERFORMANCE_REQUIREMENTS = `1. Request timing and blocking chains.
2. Duplicate or unnecessary requests.
3. Resource loading order and optimization opportunities.
4. Cache-Control, ETag, and caching policy analysis.
5. Concrete performance recommendations and expected impact.`;

const EN_CRYPTO_REVERSE_REQUIREMENTS = `1. Identify encryption/signing/hash algorithms, libraries, and methods.
2. Reconstruct the crypto flow for request parameters.
3. Analyze key management: source, format, and length.
4. Analyze signature/verification rules, parameter ordering, timestamp/nonce.
5. Provide complete Python reproduction code.`;

const LOCALE_TEXT = {
  zh: {
    systemPrompt: '你是一位网站协议分析专家。你的任务是分析用户在网站上的操作过程中产生的HTTP请求、JS调用和存储变化，识别其业务场景，并生成结构化的协议分析报告。Be precise and technical. Output in Chinese (Simplified).',
    toolHint: '\n你可以使用 get_request_detail 工具来查看任意请求的完整内容（包括被过滤的请求）。当你发现分析信息不足时，主动调用此工具获取更多细节。',
    intro: (platformName: string) => `以下是用户在 ${platformName} 上操作时的完整数据。`,
    sceneHeading: '场景线索',
    authHeading: '鉴权链',
    streamingHeading: '流式通信',
    requestsHeading: '请求日志',
    hooksHeading: 'JS Hook 数据',
    cryptoHooksHeading: '加密操作记录',
    cryptoScriptsHeading: '相关加密代码片段',
    storageHeading: '存储变化',
    requirementsHeading: '分析要求',
    noScene: '(无场景线索)',
    noAuth: '(无鉴权数据)',
    noStreaming: '(无流式通信)',
    noRequests: '(无请求记录)',
    noHooks: '(无 JS Hook 记录)',
    noStorage: '(无存储变化)',
    noCryptoHooks: '(无加密操作记录)',
    noCryptoScripts: '(无相关加密代码)',
    storageAdded: '新增',
    storageChanged: '变更',
    storageRemoved: '删除',
    cryptoCalls: '次调用',
    cryptoSource: '来源',
    cryptoMoreCalls: '及其他 {count} 次调用',
    cryptoScriptLines: '行',
    cryptoScriptMatches: '匹配',
    requestIndexHeading: '完整请求索引（包含被过滤的请求）',
    requestIndexIntro: (total: number, selected: number) => `以下是本次会话中所有 ${total} 条请求的摘要（当前深度分析仅包含其中 ${selected} 条）。`,
    requestIndexHint: '如果你认为被过滤的请求可能与分析相关，可以调用 get_request_detail 工具获取其完整内容。',
    filterSystem: '你是一个HTTP请求相关性过滤器。给定请求摘要列表和分析目的，判断哪些请求与分析目的相关。\n仅返回JSON数组，包含相关请求的序号。例如：[1, 3, 5, 8]\n宁可多选也不要遗漏——如果一个请求可能相关，就包含它。\n不要返回任何其他内容，只返回JSON数组。',
    filterPurposeHeading: '分析目的',
    filterSummaryHeading: (count: number) => `请求摘要（共 ${count} 条）`,
    filterInstruction: '请返回与分析目的相关的请求序号JSON数组。包含直接相关和支撑性请求（如认证请求）。',
    customFocus: (purpose: string) => `用户指定的分析重点：${purpose}`,
    customBaseline: '在完成上述重点分析的同时，也请覆盖以下基础分析：',
  },
  en: {
    systemPrompt: 'You are a web protocol analysis expert. Analyze HTTP requests, JS calls, and storage changes generated by user actions, identify the business scenario, and produce a structured protocol analysis report. Be precise and technical. Output in English.',
    toolHint: '\nYou can use the get_request_detail tool to inspect the complete contents of any request, including filtered requests. When the available analysis data is insufficient, call this tool proactively for more detail.',
    intro: (platformName: string) => `Below is the complete data captured while the user operated on ${platformName}.`,
    sceneHeading: 'Scene hints',
    authHeading: 'Authentication chain',
    streamingHeading: 'Streaming communication',
    requestsHeading: 'Request log',
    hooksHeading: 'JS Hook data',
    cryptoHooksHeading: 'Crypto operation records',
    cryptoScriptsHeading: 'Related crypto code snippets',
    storageHeading: 'Storage changes',
    requirementsHeading: 'Analysis requirements',
    noScene: '(no scene hints)',
    noAuth: '(no authentication data)',
    noStreaming: '(no streaming communication)',
    noRequests: '(no request records)',
    noHooks: '(no JS Hook records)',
    noStorage: '(no storage changes)',
    noCryptoHooks: '(no crypto operation records)',
    noCryptoScripts: '(no related crypto code)',
    storageAdded: 'Added',
    storageChanged: 'Changed',
    storageRemoved: 'Removed',
    cryptoCalls: 'calls',
    cryptoSource: 'Source',
    cryptoMoreCalls: 'and {count} more calls',
    cryptoScriptLines: 'lines',
    cryptoScriptMatches: 'Matches',
    requestIndexHeading: 'Complete request index (including filtered requests)',
    requestIndexIntro: (total: number, selected: number) => `This is a summary of all ${total} requests in the session. The deep analysis currently includes ${selected} of them.`,
    requestIndexHint: 'If a filtered request may be relevant, call get_request_detail to inspect the full content.',
    filterSystem: 'You are an HTTP request relevance filter. Given request summaries and an analysis purpose, decide which requests are relevant.\nReturn only a JSON array of relevant request sequence numbers, for example: [1, 3, 5, 8].\nPrefer including more requests over missing relevant ones.\nDo not return anything except the JSON array.',
    filterPurposeHeading: 'Analysis purpose',
    filterSummaryHeading: (count: number) => `Request summaries (${count} total)`,
    filterInstruction: 'Return a JSON array of request sequence numbers relevant to the analysis purpose, including directly related and supporting requests such as authentication.',
    customFocus: (purpose: string) => `User-specified analysis focus: ${purpose}`,
    customBaseline: 'While completing the focus above, also cover this baseline analysis:',
  },
  ru: {
    systemPrompt: 'Ты эксперт по анализу веб-протоколов. Анализируй HTTP-запросы, JS-вызовы и изменения хранилищ, возникшие при действиях пользователя, определяй бизнес-сценарий и формируй структурированный отчёт анализа протокола. Пиши точно и технически. Отвечай на русском языке.',
    toolHint: '\nТы можешь использовать инструмент get_request_detail, чтобы посмотреть полный контент любого запроса, включая отфильтрованные запросы. Если данных для анализа недостаточно, вызывай этот инструмент самостоятельно.',
    intro: (platformName: string) => `Ниже полные данные, захваченные во время действий пользователя на ${platformName}.`,
    sceneHeading: 'Сценарные подсказки',
    authHeading: 'Цепочка аутентификации',
    streamingHeading: 'Потоковая коммуникация',
    requestsHeading: 'Журнал запросов',
    hooksHeading: 'Данные JS Hook',
    cryptoHooksHeading: 'Записи криптоопераций',
    cryptoScriptsHeading: 'Связанные фрагменты криптокода',
    storageHeading: 'Изменения хранилищ',
    requirementsHeading: 'Требования к анализу',
    noScene: '(сценарных подсказок нет)',
    noAuth: '(данных аутентификации нет)',
    noStreaming: '(потоковой коммуникации нет)',
    noRequests: '(записей запросов нет)',
    noHooks: '(записей JS Hook нет)',
    noStorage: '(изменений хранилищ нет)',
    noCryptoHooks: '(записей криптоопераций нет)',
    noCryptoScripts: '(связанного криптокода нет)',
    storageAdded: 'Добавлено',
    storageChanged: 'Изменено',
    storageRemoved: 'Удалено',
    cryptoCalls: 'вызовов',
    cryptoSource: 'Источник',
    cryptoMoreCalls: 'и ещё {count} вызовов',
    cryptoScriptLines: 'строки',
    cryptoScriptMatches: 'Совпадения',
    requestIndexHeading: 'Полный индекс запросов (включая отфильтрованные)',
    requestIndexIntro: (total: number, selected: number) => `Это сводка всех ${total} запросов сессии. В глубоком анализе сейчас участвуют ${selected} из них.`,
    requestIndexHint: 'Если отфильтрованный запрос может быть важен, вызови get_request_detail и изучи полный контент.',
    filterSystem: 'Ты фильтр релевантности HTTP-запросов. По списку кратких запросов и цели анализа выбери релевантные запросы.\nВерни только JSON-массив номеров запросов, например: [1, 3, 5, 8].\nЛучше выбрать больше запросов, чем пропустить важный.\nНе возвращай ничего, кроме JSON-массива.',
    filterPurposeHeading: 'Цель анализа',
    filterSummaryHeading: (count: number) => `Сводка запросов (всего ${count})`,
    filterInstruction: 'Верни JSON-массив номеров запросов, релевантных цели анализа, включая напрямую связанные и вспомогательные запросы, например аутентификацию.',
    customFocus: (purpose: string) => `Фокус анализа, заданный пользователем: ${purpose}`,
    customBaseline: 'Выполняя указанный фокус, также покрой базовый анализ:',
  },
} as const;

function getLocaleText(locale: AppLocale) {
  return LOCALE_TEXT[locale] ?? LOCALE_TEXT.zh;
}

/**
 * PromptBuilder — Builds the analysis prompt from assembled data.
 */
export class PromptBuilder {
  build(
    data: AssembledData,
    platformName: string,
    purpose?: string,
    template?: PromptTemplate,
    allSummaries?: RequestSummary[],
    locale: AppLocale = "zh",
  ): PromptMessages {
    const localeText = getLocaleText(locale);
    const hasToolAccess = allSummaries && allSummaries.length > data.requests.length;
    const hasCustomTemplate = Boolean(template && (!template.isBuiltin || template.isModified));
    const localizedTemplate = hasCustomTemplate
      ? undefined
      : template?.localizations?.[locale];

    const toolHint = hasToolAccess ? localeText.toolHint : "";

    const system = (
      localizedTemplate?.systemPrompt
      ?? (hasCustomTemplate ? template?.systemPrompt : localeText.systemPrompt)
      ?? localeText.systemPrompt
    ) + toolHint;

    const analysisRequirements = localizedTemplate?.requirements
      ?? (hasCustomTemplate ? template?.requirements : undefined)
      ?? this.buildAnalysisRequirements(purpose, locale);
    const requestsSection = this.formatRequests(data.requests, locale);
    const hooksSection = this.formatHooks(data.requests, locale);
    const storageSection = this.formatStorageDiff(data.storageDiff, locale);
    const sceneSection = this.formatSceneHints(data.sceneHints, locale);
    const authSection = this.formatAuthChain(data.authChain, locale);
    const streamingSection = this.formatStreamingRequests(
      data.streamingRequests,
      locale,
    );
    const cryptoHooksSection = this.formatCryptoHooks(data.requests, locale);
    const cryptoScriptsSection = this.formatCryptoScripts(data.cryptoScripts, locale);

    // 完整请求索引（仅当 Phase 1 过滤生效时添加）
    const requestIndexSection = hasToolAccess
      ? this.formatRequestIndex(allSummaries!, data.requests.length, locale)
      : '';

    const user = `${localeText.intro(platformName)}

## ${localeText.sceneHeading}
${sceneSection}

## ${localeText.authHeading}
${authSection}

## ${localeText.streamingHeading}
${streamingSection}

## ${localeText.requestsHeading}
${requestsSection}

## ${localeText.hooksHeading}
${hooksSection}

## ${localeText.cryptoHooksHeading}
${cryptoHooksSection}

## ${localeText.cryptoScriptsHeading}
${cryptoScriptsSection}

## ${localeText.storageHeading}
${storageSection}
${requestIndexSection}
## ${localeText.requirementsHeading}
${analysisRequirements}`;

    return { system, user };
  }

  /**
   * Phase 1：构建轻量级预过滤 prompt，用于 AI 判断请求相关性
   */
  buildFilterPrompt(
    summaries: RequestSummary[],
    sceneHints: SceneHint[],
    purpose?: string,
    template?: PromptTemplate,
    locale: AppLocale = "zh",
  ): PromptMessages {
    const localeText = getLocaleText(locale);
    const hasCustomTemplate = Boolean(template && (!template.isBuiltin || template.isModified));
    const localizedTemplate = hasCustomTemplate
      ? undefined
      : template?.localizations?.[locale];
    const system = localeText.filterSystem;

    const analysisRequirements = localizedTemplate?.requirements
      ?? (hasCustomTemplate ? template?.requirements : undefined)
      ?? this.buildAnalysisRequirements(purpose, locale);
    const sceneSection = this.formatSceneHints(sceneHints, locale);

    const summaryLines = summaries.map(s => {
      const ct = s.contentType ? ` [${s.contentType.split(';')[0].trim()}]` : '';
      return `#${s.seq} ${s.method} ${s.url} -> ${s.status ?? 'pending'}${ct}`;
    }).join('\n');

    const user = `## ${localeText.filterPurposeHeading}
${analysisRequirements}

## ${localeText.sceneHeading}
${sceneSection}

## ${localeText.filterSummaryHeading(summaries.length)}
${summaryLines}

${localeText.filterInstruction}`;

    return { system, user };
  }

  private buildAnalysisRequirements(purpose?: string, locale: AppLocale = "zh"): string {
    if (!purpose || purpose === "auto") {
      return this.getDefaultRequirements(locale);
    }

    const predefinedMap = this.getPredefinedRequirements(locale);

    if (predefinedMap[purpose]) {
      return predefinedMap[purpose];
    }

    const localeText = getLocaleText(locale);
    return `${localeText.customFocus(purpose)}

${localeText.customBaseline}
${this.getDefaultRequirements(locale)}`;
  }

  private getDefaultRequirements(locale: AppLocale): string {
    if (locale === "ru") return RU_DEFAULT_REQUIREMENTS;
    if (locale === "en") return EN_DEFAULT_REQUIREMENTS;
    return DEFAULT_REQUIREMENTS;
  }

  private getPredefinedRequirements(locale: AppLocale): Record<string, string> {
    if (locale === "ru") {
      return {
        "reverse-api": RU_REVERSE_API_REQUIREMENTS,
        "security-audit": RU_SECURITY_AUDIT_REQUIREMENTS,
        performance: RU_PERFORMANCE_REQUIREMENTS,
        "crypto-reverse": RU_CRYPTO_REVERSE_REQUIREMENTS,
      };
    }
    if (locale === "en") {
      return {
        "reverse-api": EN_REVERSE_API_REQUIREMENTS,
        "security-audit": EN_SECURITY_AUDIT_REQUIREMENTS,
        performance: EN_PERFORMANCE_REQUIREMENTS,
        "crypto-reverse": EN_CRYPTO_REVERSE_REQUIREMENTS,
      };
    }
    return {
      "reverse-api": REVERSE_API_REQUIREMENTS,
      "security-audit": SECURITY_AUDIT_REQUIREMENTS,
      performance: PERFORMANCE_REQUIREMENTS,
      "crypto-reverse": CRYPTO_REVERSE_REQUIREMENTS,
    };
  }

  private formatSceneHints(hints: SceneHint[], locale: AppLocale): string {
    if (hints.length === 0) return getLocaleText(locale).noScene;
    return hints
      .map((h) => `- **${h.scene}** [${h.confidence}]: ${h.evidence}`)
      .join("\n");
  }

  private formatAuthChain(chain: AuthChainItem[], locale: AppLocale): string {
    if (chain.length === 0) return getLocaleText(locale).noAuth;
    const sourceLabel = locale === "ru" ? "источник" : locale === "en" ? "source" : "来源";
    const consumersLabel = locale === "ru" ? "используют" : locale === "en" ? "consumers" : "使用者";
    return chain
      .map((a) => {
        const consumers =
          a.consumers.length > 0 ? `\n  ${consumersLabel}: ${a.consumers.join(", ")}` : "";
        return `- **${a.credentialType}** (${sourceLabel}: ${a.source})${consumers}`;
      })
      .join("\n");
  }

  private formatStreamingRequests(requests: FilteredRequest[], locale: AppLocale): string {
    if (requests.length === 0) return getLocaleText(locale).noStreaming;
    return requests.map((r) => `- #${r.seq} ${r.method} ${r.url}`).join("\n");
  }

  private formatRequests(requests: AssembledData["requests"], locale: AppLocale): string {
    if (requests.length === 0) return getLocaleText(locale).noRequests;
    const labels = locale === "ru"
      ? { headers: "Заголовки", body: "Тело запроса", response: "Ответ" }
      : locale === "en"
        ? { headers: "Headers", body: "Body", response: "Response" }
        : { headers: "Headers", body: "Body", response: "Response" };
    return requests
      .map((r) => {
        const lines: string[] = [
          `#${r.seq} ${r.method} ${r.url} → ${r.status || "pending"}`,
        ];
        const important = this.filterHeaders(r.headers);
        if (Object.keys(important).length > 0)
          lines.push(`  ${labels.headers}: ${JSON.stringify(important)}`);
        if (r.body)
          lines.push(
            `  ${labels.body}: ${this.sanitizeBody(r.body, 2000)}`,
          );
        if (r.responseBody)
          lines.push(
            `  ${labels.response}: ${this.sanitizeBody(r.responseBody, 2000)}`,
          );
        return lines.join("\n");
      })
      .join("\n\n");
  }

  private formatHooks(requests: AssembledData["requests"], locale: AppLocale): string {
    const allHooks = requests.flatMap((r) => r.hooks);
    if (allHooks.length === 0) return getLocaleText(locale).noHooks;
    return allHooks
      .map(
        (h) =>
          `[${h.hook_type}] ${h.function_name}: args=${this.sanitizeBody(h.arguments, 500)}${h.result ? ` result=${this.sanitizeBody(h.result, 500)}` : ""}`,
      )
      .join("\n");
  }

  private formatStorageDiff(diff: AssembledData["storageDiff"], locale: AppLocale): string {
    const localeText = getLocaleText(locale);
    const sections: string[] = [];
    for (const [type, d] of Object.entries(diff)) {
      const parts: string[] = [];
      if (Object.keys(d.added).length > 0)
        parts.push(
          `  ${localeText.storageAdded}: ${Object.entries(d.added)
            .map(([k, v]) => `${k}=${v}`)
            .join(", ")}`,
        );
      if (Object.keys(d.changed).length > 0)
        parts.push(
          `  ${localeText.storageChanged}: ${Object.entries(d.changed)
            .map(([k, v]) => `${k}: "${v.old}" → "${v.new}"`)
            .join(", ")}`,
        );
      if (d.removed.length > 0) parts.push(`  ${localeText.storageRemoved}: ${d.removed.join(", ")}`);
      if (parts.length > 0) sections.push(`${type}:\n${parts.join("\n")}`);
    }
    return sections.length > 0 ? sections.join("\n\n") : localeText.noStorage;
  }

  private formatCryptoHooks(requests: AssembledData['requests'], locale: AppLocale): string {
    const localeText = getLocaleText(locale);
    const cryptoHooks = requests.flatMap(r => r.hooks).filter(
      h => h.hook_type === 'crypto' || h.hook_type === 'crypto_lib'
    );
    if (cryptoHooks.length === 0) return localeText.noCryptoHooks;

    // Group by function name
    const groups = new Map<string, typeof cryptoHooks>();
    for (const h of cryptoHooks) {
      const key = h.function_name;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(h);
    }

    const lines: string[] = [];
    for (const [funcName, hooks] of groups) {
      lines.push(`- **${funcName}** (${hooks.length} ${localeText.cryptoCalls})`);
      // Show up to 3 representative calls
      for (const h of hooks.slice(0, 3)) {
        const args = this.sanitizeBody(h.arguments, 200);
        const result = h.result ? this.sanitizeBody(h.result, 200) : '';
        lines.push(`  args=${args}${result ? ` → ${result}` : ''}`);
        if (h.call_stack) {
          const topFrame = h.call_stack.split('\n')[0]?.trim();
          if (topFrame) lines.push(`  ${localeText.cryptoSource}: ${topFrame}`);
        }
      }
      if (hooks.length > 3) {
        lines.push(`  ...${localeText.cryptoMoreCalls.replace("{count}", String(hooks.length - 3))}`);
      }
    }
    return lines.join('\n');
  }

  private formatCryptoScripts(snippets: CryptoScriptSnippet[], locale: AppLocale): string {
    const localeText = getLocaleText(locale);
    if (!snippets || snippets.length === 0) return localeText.noCryptoScripts;
    return snippets.map(s => {
      const patterns = s.matchedPatterns.join(', ');
      return `### ${s.scriptUrl} (${localeText.cryptoScriptLines} ${s.lineRange[0]}-${s.lineRange[1]})\n${localeText.cryptoScriptMatches}: ${patterns}\n\`\`\`javascript\n${s.content}\n\`\`\``;
    }).join('\n\n');
  }

  private formatRequestIndex(summaries: RequestSummary[], analysisCount: number, locale: AppLocale): string {
    const localeText = getLocaleText(locale);
    const lines = summaries.map(s => {
      const ct = s.contentType ? ` [${s.contentType.split(';')[0].trim()}]` : '';
      return `#${s.seq} ${s.method} ${s.url} -> ${s.status ?? 'pending'}${ct}`;
    });
    return `
## ${localeText.requestIndexHeading}
${localeText.requestIndexIntro(summaries.length, analysisCount)}
${localeText.requestIndexHint}

${lines.join('\n')}

`;
  }

  /**
   * Sanitize body content for safe embedding in prompts sent to LLM APIs.
   * Removes control characters and non-printable chars that may break JSON
   * parsing in intermediate proxies (e.g., Go-based API gateways).
   */
  private sanitizeBody(text: string, maxLen: number): string {
    // Remove ASCII control chars (except \n \r \t) and Unicode replacement char
    const cleaned = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F\uFFFD]/g, '');
    if (cleaned.length <= maxLen) return cleaned;
    // Unicode-safe truncation: avoid cutting surrogate pairs
    let end = maxLen;
    const code = cleaned.charCodeAt(end - 1);
    if (code >= 0xD800 && code <= 0xDBFF) end--;
    return cleaned.substring(0, end) + '...';
  }

  private filterHeaders(
    headers: Record<string, string>,
  ): Record<string, string> {
    const important = [
      "authorization",
      "x-token",
      "x-csrf-token",
      "x-request-id",
      "x-signature",
      "content-type",
      "cookie",
      "referer",
      "origin",
      "user-agent",
    ];
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
      if (important.includes(key.toLowerCase())) result[key] = value;
    }
    return result;
  }
}
