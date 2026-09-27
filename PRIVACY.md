# Политика конфиденциальности Block Haram

_Последнее обновление: 27 сентября 2026 г._ · [English version below](#privacy-policy-for-block-haram)

**Коротко: Block Haram не собирает, не передаёт и не продаёт никаких данных. Всё работает только на вашем устройстве.**

## Какие данные обрабатываются

| Данные                                                       | Где хранятся                                | Зачем                                                            |
| ------------------------------------------------------------ | ------------------------------------------- | ---------------------------------------------------------------- |
| Счётчик заблокированных попыток (одно число)                 | `chrome.storage.local` на вашем устройстве  | Показать статистику в окне расширения                            |
| Домены сайтов для взрослых, распознанные на вашем устройстве | `chrome.storage.local` и правила блокировки | Блокировать их при следующих посещениях; удаляются через 30 дней |

Адреса и содержимое остальных страниц не сохраняются. Для распознавания сайтов для взрослых расширение читает заголовок, описание и ключевые слова открытой страницы прямо в браузере; эти данные никуда не отправляются и сразу отбрасываются.

## Сетевые запросы

Само расширение не делает сетевых запросов: нет аналитики, телеметрии, рекламы, сторонних скриптов и шрифтов. Списки блокировки встроены в расширение и обновляются вместе с ним через Chrome Web Store.

На страницах результатов поиска Google, Bing, Яндекса, DuckDuckGo, Brave Search, Yahoo и Startpage расширение добавляет к вашему запросу параметр безопасного поиска, а на YouTube — заголовок `YouTube-Restrict: Strict`. Эти запросы идут к выбранному вами сервису как обычно; расширение их не читает и не пересылает.

## Разрешения

- `declarativeNetRequest` — блокировать сайты для взрослых и включать безопасный поиск средствами самого браузера.
- `storage` — хранить счётчик и распознанные домены локально.
- Доступ ко всем сайтам — показывать страницу блокировки вместо любого сайта для взрослых, включать безопасный поиск и распознавать новые сайты для взрослых.

## Передача третьим лицам

Никому и никогда. Данные не покидают ваше устройство.

## Изменения

Изменения этой политики публикуются в этом файле в репозитории проекта.

---

# Privacy Policy for Block Haram

_Last updated: September 27, 2026_

**In short: Block Haram does not collect, transmit or sell any data. Everything runs on your device only.**

## Data processed

| Data                                             | Where it is stored                        | Why                                               |
| ------------------------------------------------ | ----------------------------------------- | ------------------------------------------------- |
| Count of blocked attempts (a single number)      | `chrome.storage.local` on your device     | Show statistics in the extension popup            |
| Domains of adult sites recognised on your device | `chrome.storage.local` and blocking rules | Block them on later visits; removed after 30 days |

Addresses and contents of other pages are not stored. To recognise adult sites, the extension reads the open page's title, description and keywords inside the browser; this is never sent anywhere and is discarded immediately.

## Network requests

The extension itself makes no network requests: no analytics, telemetry, ads, third-party scripts or fonts. Blocklists are bundled with the extension and updated with it through the Chrome Web Store.

On search result pages of Google, Bing, Yandex, DuckDuckGo, Brave Search, Yahoo and Startpage the extension adds a safe-search parameter to your query, and on YouTube the `YouTube-Restrict: Strict` header. These requests go to the service you chose as usual; the extension neither reads nor forwards them.

## Permissions

- `declarativeNetRequest` — block adult sites and enforce safe search using the browser's own engine.
- `storage` — keep the counter and recognised domains locally.
- Access to all sites — show the block page in place of any adult site, enforce safe search, and recognise new adult sites.

## Sharing with third parties

Never. Data does not leave your device.

## Changes

Changes to this policy are published in this file in the project repository.
