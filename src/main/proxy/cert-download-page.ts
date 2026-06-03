import { readFileSync } from "fs";
import type { CaManager } from "./ca-manager";

/** Magic hostname that triggers the cert download page */
export const CERT_DOWNLOAD_HOST = "cert.anything.test";
export const CERT_DOWNLOAD_FALLBACK_HOST = "cert.anything.local";

export function isCertDownloadHost(host: string): boolean {
  const normalized = host.trim().toLowerCase().replace(/\.$/, "");
  return normalized === CERT_DOWNLOAD_HOST || normalized === CERT_DOWNLOAD_FALLBACK_HOST;
}

/**
 * Detect platform from User-Agent string.
 */
function detectPlatform(ua: string): "ios" | "android" | "desktop" {
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

/**
 * Generate the HTML certificate download page.
 * @param ua User-Agent string for platform detection
 * @param overrideHost Optional host (ip:port or hostname:port) to use for the download link.
 *                     When a LAN device accesses the proxy directly by IP, this ensures the
 *                     download link points back to the same accessible address.
 */
export function generateCertPage(ua: string, overrideHost?: string): string {
  const platform = detectPlatform(ua);
  const defaultHost = platform === "ios" ? CERT_DOWNLOAD_HOST : CERT_DOWNLOAD_FALLBACK_HOST;
  const downloadHost = overrideHost || defaultHost;
  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Anything Analyzer - установка CA-сертификата</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;background:#0f172a;color:#e2e8f0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
.card{background:#1e293b;border-radius:16px;padding:32px 28px;max-width:420px;width:100%;box-shadow:0 25px 50px rgba(0,0,0,.4)}
.logo{text-align:center;margin-bottom:24px}
.logo svg{width:48px;height:48px}
h1{font-size:20px;text-align:center;margin-bottom:8px;color:#f8fafc}
.subtitle{text-align:center;font-size:14px;color:#94a3b8;margin-bottom:28px}
.download-btn{display:block;width:100%;padding:14px;border:none;border-radius:12px;font-size:16px;font-weight:600;cursor:pointer;text-align:center;text-decoration:none;transition:all .2s;margin-bottom:16px}
.download-btn.primary{background:linear-gradient(135deg,#3b82f6,#6366f1);color:#fff}
.download-btn.primary:active{transform:scale(.98);opacity:.9}
.platform-tag{display:inline-block;background:#334155;color:#94a3b8;padding:3px 10px;border-radius:20px;font-size:12px;margin-bottom:20px}
.steps{background:#0f172a;border-radius:12px;padding:20px;margin-top:4px}
.steps h2{font-size:15px;margin-bottom:14px;color:#f1f5f9}
.step{display:flex;gap:12px;margin-bottom:14px;font-size:13px;line-height:1.6;color:#cbd5e1}
.step:last-child{margin-bottom:0}
.step-num{flex-shrink:0;width:22px;height:22px;border-radius:50%;background:#334155;color:#60a5fa;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;margin-top:1px}
.note{margin-top:20px;padding:14px;background:rgba(234,179,8,.08);border:1px solid rgba(234,179,8,.2);border-radius:10px;font-size:12px;color:#fbbf24;line-height:1.6}
.note strong{color:#fcd34d}
.tabs{display:flex;gap:8px;margin-bottom:16px}
.tab{flex:1;padding:8px;border:1px solid #334155;border-radius:8px;background:transparent;color:#94a3b8;font-size:13px;cursor:pointer;text-align:center;transition:all .2s}
.tab.active{background:#334155;color:#f1f5f9;border-color:#475569}
.tab-content{display:none}
.tab-content.active{display:block}
</style>
</head>
<body>
<div class="card">
  <div class="logo">
    <svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="22" stroke="#3b82f6" stroke-width="2"/><path d="M24 12v10l7 7" stroke="#60a5fa" stroke-width="2.5" stroke-linecap="round"/><circle cx="24" cy="24" r="4" fill="#3b82f6"/></svg>
  </div>
  <h1>Установка CA-сертификата</h1>
  <p class="subtitle">Anything Analyzer нужен корневой сертификат, чтобы расшифровывать HTTPS-трафик</p>
  <div style="text-align:center"><span class="platform-tag" id="platformTag">${platform === "ios" ? "iOS" : platform === "android" ? "Android" : "Desktop"}</span></div>

  <a class="download-btn primary" href="http://${downloadHost}/cert.cer" id="downloadBtn">Скачать сертификат</a>

  <div class="tabs">
    <button class="tab${platform === "ios" ? " active" : ""}" onclick="showTab('ios', this)">iOS</button>
    <button class="tab${platform === "android" ? " active" : ""}" onclick="showTab('android', this)">Android</button>
    <button class="tab${platform === "desktop" ? " active" : ""}" onclick="showTab('desktop', this)">Desktop</button>
  </div>

  <div id="tab-ios" class="tab-content${platform === "ios" ? " active" : ""}">
    <div class="steps">
      <h2>Шаги для iOS</h2>
      <div class="step"><span class="step-num">1</span><span>Убедитесь, что iPhone/iPad и компьютер подключены к <strong>одной локальной сети</strong>.</span></div>
      <div class="step"><span class="step-num">2</span><span>Откройте «Настройки» -> «Wi-Fi» и нажмите кнопку информации рядом с текущей сетью.</span></div>
      <div class="step"><span class="step-num">3</span><span>Внизу страницы выберите «Настроить прокси» -> «Вручную», укажите <strong>IP-адрес компьютера</strong> и порт прокси, обычно <strong>8888</strong>, затем сохраните.</span></div>
      <div class="step"><span class="step-num">4</span><span>Откройте эту страницу в Safari и нажмите «Скачать сертификат». Для установки профиля нужен именно Safari.</span></div>
      <div class="step"><span class="step-num">5</span><span>Подтвердите загрузку конфигурационного профиля.</span></div>
      <div class="step"><span class="step-num">6</span><span>После загрузки откройте «Настройки» -> «Основные» -> «VPN и управление устройством».</span></div>
      <div class="step"><span class="step-num">7</span><span>Выберите профиль «Anything Analyzer CA», нажмите «Установить», введите код блокировки и подтвердите установку.</span></div>
      <div class="step"><span class="step-num">8</span><span><strong>Важный шаг:</strong> откройте «Настройки» -> «Основные» -> «Об этом устройстве» -> «Доверие сертификатам».</span></div>
      <div class="step"><span class="step-num">9</span><span>Включите полное доверие для «Anything Analyzer CA» и подтвердите предупреждение.</span></div>
      <div class="step"><span class="step-num">10</span><span>Готово. Откройте любой HTTPS-сайт в Safari и проверьте, что предупреждения о сертификате нет.</span></div>
    </div>
    <div class="note"><strong>Частые проблемы:</strong><br>
    • <strong>Нет пункта «VPN и управление устройством»?</strong> В разных версиях iOS раздел может называться «Профили» или «Управление профилями и устройством».<br>
    • <strong>После установки всё ещё есть ошибка сертификата?</strong> Обычно не включено доверие к корневому сертификату из шагов 8-9.<br>
    • <strong>Скачивание не работает в другом браузере?</strong> Для установки профиля iOS используйте Safari.<br>
    • <strong>После работы</strong> верните Wi-Fi proxy в состояние «Выкл.» или «Автоматически».</div>
  </div>

  <div id="tab-android" class="tab-content${platform === "android" ? " active" : ""}">
    <div class="steps">
      <h2>Шаги для Android</h2>
      <div class="step"><span class="step-num">1</span><span>Убедитесь, что телефон и компьютер подключены к <strong>одной локальной сети</strong>.</span></div>
      <div class="step"><span class="step-num">2</span><span>Откройте настройки Wi-Fi, выберите текущую сеть и перейдите к изменению сети или параметрам прокси.</span></div>
      <div class="step"><span class="step-num">3</span><span>В расширенных настройках выберите proxy «Вручную», укажите <strong>IP-адрес компьютера</strong> и порт прокси, обычно <strong>8888</strong>, затем сохраните.</span></div>
      <div class="step"><span class="step-num">4</span><span>Откройте эту страницу в браузере и скачайте файл <code>.cer</code> на телефон.</span></div>
      <div class="step"><span class="step-num">5</span><span><strong>Рекомендуемый путь:</strong> «Настройки» -> «Безопасность» -> «Шифрование и учётные данные» -> «Установить сертификат» -> «CA-сертификат».</span></div>
      <div class="step"><span class="step-num">6</span><span>Подтвердите системное предупреждение и пройдите проверку PIN, паролем или отпечатком.</span></div>
      <div class="step"><span class="step-num">7</span><span>Выберите скачанный файл <code>anything-analyzer-ca.cer</code>, обычно он находится в папке Downloads.</span></div>
      <div class="step"><span class="step-num">8</span><span>Сообщение об установленном CA-сертификате означает успешную установку.</span></div>
    </div>
    <div class="steps" style="margin-top:12px">
      <h2>Проверка установки</h2>
      <div class="step"><span class="step-num">1</span><span>Откройте «Безопасность» -> «Шифрование и учётные данные» -> «Доверенные сертификаты».</span></div>
      <div class="step"><span class="step-num">2</span><span>Во вкладке пользовательских сертификатов должен быть «Anything Analyzer CA».</span></div>
    </div>
    <div class="steps" style="margin-top:12px">
      <h2>Подсказки для разных Android-прошивок</h2>
      <div class="step"><span class="step-num">•</span><span><strong>Xiaomi/Redmi:</strong> «Пароли и безопасность» -> «Системная безопасность» -> «Шифрование и учётные данные» -> «Установить сертификат».</span></div>
      <div class="step"><span class="step-num">•</span><span><strong>Huawei/Honor:</strong> «Безопасность» -> «Дополнительные настройки безопасности» -> «Шифрование и учётные данные».</span></div>
      <div class="step"><span class="step-num">•</span><span><strong>Samsung:</strong> «Биометрия и безопасность» -> «Другие параметры безопасности» -> «Установить сертификат».</span></div>
      <div class="step"><span class="step-num">•</span><span><strong>Google Pixel:</strong> «Безопасность» -> «Шифрование и учётные данные» -> «Установить сертификат».</span></div>
      <div class="step"><span class="step-num">•</span><span><strong>Не нашли пункт?</strong> В поиске настроек введите «сертификат» или «учётные данные».</span></div>
    </div>
    <div class="note"><strong>Особенности Android:</strong><br>
    • <strong>Android 7.0+:</strong> пользовательские CA-сертификаты обычно доверяются браузерами, но многие приложения их не принимают. Это нормальное ограничение безопасности Android.<br>
    • <strong>Для доверия всех приложений</strong> обычно нужны root-права или перенос сертификата в системное хранилище.<br>
    • <strong>Требуется блокировка экрана?</strong> Android требует PIN, пароль или графический ключ для установки CA-сертификата.<br>
    • <strong>После работы</strong> верните Wi-Fi proxy в состояние «Нет».</div>
  </div>

  <div id="tab-desktop" class="tab-content${platform === "desktop" ? " active" : ""}">
    <div class="steps">
      <h2>Шаги для desktop</h2>
      <div class="step"><span class="step-num">1</span><span>Проще всего нажать «Установить сертификат» прямо в настройках Anything Analyzer.</span></div>
      <div class="step"><span class="step-num">2</span><span>Также можно скачать сертификат и установить его вручную в системное хранилище доверенных корневых сертификатов.</span></div>
      <div class="step"><span class="step-num">3</span><span>На macOS откройте Keychain Access, найдите сертификат, откройте «Trust» и установите «Always Trust».</span></div>
    </div>
  </div>
</div>
<script>
function showTab(name, el){
  document.querySelectorAll('.tab-content').forEach(e=>e.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(e=>e.classList.remove('active'));
  document.getElementById('tab-'+name).classList.add('active');
  if (el) el.classList.add('active');
}
</script>
</body>
</html>`;
}

/**
 * Get the CA certificate content as PEM-encoded Buffer for download.
 */
export function getCertFileContent(caManager: CaManager): Buffer {
  const certPath = caManager.getCaCertPath();
  return readFileSync(certPath);
}

/**
 * Get the CA certificate content as DER-encoded Buffer for mobile download (.cer).
 */
export function getCertDerContent(caManager: CaManager): Buffer {
  return caManager.getCaCertDer();
}
