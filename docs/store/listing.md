# Chrome Web Store: тексты для карточки и формы публикации

Всё ниже копируется в [панель разработчика](https://chrome.google.com/webstore/devconsole) как есть.
Название и краткое описание берутся из `_locales/*/messages.json` (ключи `extName`, `extDescription`).

## Store listing

**Category:** Tools (Инструменты)
**Language:** Русский (основной), English, العربية — локализованные поля заполняются из `_locales` автоматически.

### Подробное описание (ru)

Block Haram защищает ваш взор: блокирует сайты для взрослых прямо в браузере и не даёт отключить защиту в момент слабости.

Что умеет:
• Блокирует более 500 000 сайтов для взрослых из четырёх проверенных списков — вместо сайта открывается спокойная страница с аятом из Корана.
• Блокирует адалт-картинки и видео, встроенные в обычные сайты.
• Распознаёт новые адалт-сайты, которых ещё нет в списках, по их заголовку и меткам, и запоминает их.
• Принудительно включает безопасный поиск в Google, Bing, Яндексе, DuckDuckGo, Brave Search, Yahoo, Startpage и безопасный режим YouTube.
• Не имеет кнопки отключения.

Быстро и приватно:
• Блокировка выполняется движком самого браузера (declarativeNetRequest) — без замедления страниц.
• Никакой телеметрии, аналитики и рекламы. Расширение не отправляет никуда ни одного байта.

Для максимальной защиты на Windows расширение можно закрепить политиками браузера, чтобы его нельзя было удалить, и отключить режим инкогнито — инструкция в репозитории проекта.

### Detailed description (en)

Block Haram guards your gaze: it blocks adult websites right in the browser and has no off switch for moments of weakness.

What it does:
• Blocks over 500,000 adult websites from four curated lists — a calm page with a Quran verse appears instead.
• Blocks adult images and videos embedded in ordinary sites.
• Recognises new adult sites that are not on the lists yet by their titles and labels, and remembers them.
• Enforces safe search on Google, Bing, Yandex, DuckDuckGo, Brave Search, Yahoo, Startpage and YouTube Restricted Mode.
• Has no disable button.

Fast and private:
• Blocking runs inside the browser's own engine (declarativeNetRequest), so pages don't slow down.
• No telemetry, analytics or ads. The extension never sends a single byte anywhere.

For maximum protection on Windows, the extension can be locked in with browser policies so it cannot be removed, and Incognito can be disabled — see the project repository.

### Graphics

Сгенерируйте командой `npm run store:assets` (папка `store-assets/`):

| Файл                  | Куда                            |
| --------------------- | ------------------------------- |
| `screenshot-*-ru.png` | Screenshots (1280×800), русский |
| `screenshot-*-en.png` | Screenshots (1280×800), English |
| `promo-small.png`     | Small promo tile (440×280)      |
| `promo-marquee.png`   | Marquee promo tile (1400×560)   |
| иконка 128×128        | берётся из пакета расширения    |

## Privacy practices

**Single purpose:**
Blocks adult (pornographic) websites and enforces safe search in the browser.

**Permission justifications:**

| Permission                      | Justification                                                                                                                                                                                                                                                |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `declarativeNetRequest`         | Blocks adult domains from bundled static rulesets, redirects blocked pages to the extension's block page, and enforces safe search (query parameters on search engines, `YouTube-Restrict` header on YouTube).                                               |
| `storage`                       | Stores, locally only, the number of blocked attempts and the domains of adult sites recognised on the device (expire after 30 days).                                                                                                                         |
| Host permissions (`<all_urls>`) | Required by declarativeNetRequest to redirect any adult site to the block page and to modify search requests, and by the content script that recognises adult pages missing from the lists by reading the page title, description and rating labels locally. |

**Remote code:** No, I am not using remote code. All JavaScript is bundled in the package.

**Data usage:** Не отмечайте ни одного типа данных — расширение ничего не собирает. Поставьте все три подтверждения (не продаётся, не используется для посторонних целей, не используется для кредитоспособности).

**Privacy policy URL:** `https://github.com/IR-Full/haram-block/blob/main/PRIVACY.md`

**Homepage URL / Support URL:** `https://github.com/IR-Full/haram-block`

## Distribution

**Visibility:** Public. **Regions:** All regions.
**Mature content:** No — расширение не показывает контент для взрослых, а блокирует его.
