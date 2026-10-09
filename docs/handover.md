# Передача проекта: что сделано, что проверено, как продолжать

Ветка: `claude/keen-hopper-n5ip7f`. Готовая сборка: `extension/dist` (и архив `release/nubit-extension.zip`).

## Состояние на момент передачи

### Проверено автоматически (проходит)
- `npm test` — 26 юнит‑тестов: парсеры YouTube (ytInitialData, player response, lockup view model, компактные даты «5y ago»), метрики (VPH, outlier, SEO, оценка названия), markdown, история чата, провайдеры (Chat Completions и Responses API — потоковый разбор, вызовы инструментов, картинки), конкуренты.
- `xvfb-run node scripts/smoke.mjs` — расширение загружается в Chromium; настройки сохраняются (Claude, Atlas, свой провайдер); боковая панель и вкладка «Конкуренты» рисуются; на **имитации** страницы видео появляется карточка и значки VPH; на имитации поиска — значки и панель запроса; на **имитации** формы Studio — тулбар, оценка в поле названия, вставка описания и тегов (через Enter / запятую в chip‑bar); SDK Claude запускается в service worker.
- Парсеры прогнаны на **настоящих** HTML страницах поиска и канала YouTube (`scripts/real-check.mjs` + ручные проверки): просмотры, каналы, длительности, возраст и VPH читаются верно.
- Atlas API: запрос `GET https://aiberloga.website/v1/models` доходит до сервиса (с тестовым ключом — 401), адрес и заголовки верные.

### НЕ проверено (нужен реальный браузер с аккаунтом)
1. **Настоящий YouTube в браузере**: из облака Google отдаёт капчу. Нужно открыть любое видео с установленным расширением и убедиться, что карточка встала в правую колонку (`#secondary-inner`), лайки/комментарии/подписчики читаются из DOM (селекторы в `extension/src/content/extract.ts` → `domWatchExtras`), значки на превью видны, панель на странице поиска появляется.
2. **Настоящий YouTube Studio**: селекторы полей — `extension/src/content/studio.ts` → `SEL` (title `#title-textarea #textbox`, description `#description-textarea #textbox`, теги `#tags-container #text-input` / `ytcp-free-text-chip-bar`, чипы `ytcp-chip`). Если тулбар не появился — не найдено поле названия; если теги не добавляются — не найден input чип‑бара (тогда панель копирует теги в буфер и пишет подсказку). Селектор превью — `THUMB_SEL` там же.
3. **Качество ответов ИИ**: промпты в `extension/src/background/prompts.ts` (`ACTION_PROMPTS`, системный промпт `buildSystemPrompt`). Studio‑действия требуют ответа строго JSON — если модель оборачивает в текст, панель покажет сырой текст (парсер `parseJson` вырезает ```json```‑ограждения и первый `{…}`).
4. **Atlas по живому ключу**: протокол по умолчанию Responses API; при 404 расширение само переключится на Chat Completions (`providers/index.ts` → `withProtocolFallback`). Если Atlas отвечает ошибкой другого кода — смотреть текст ошибки в чате.
5. **Локальный помощник** (Windows): `native-host/install.bat` не запускался на Windows; протокол и команды проверены на Linux.

## Как собрать и проверить
```sh
cd extension
npm install
npm run typecheck && npm test
npm run build                      # → dist/
xvfb-run node scripts/smoke.mjs    # Linux; на Windows: node scripts/smoke.mjs (откроет окно Chromium)
node scripts/real-check.mjs        # настоящий YouTube (нужна сеть без капчи)
```
Загрузка в Chrome: `chrome://extensions` → режим разработчика → «Загрузить распакованное» → `extension/dist`. После каждого `npm run build` — кнопка ⟳ у расширения.

## Где что лежит
- `extension/src/background/index.ts` — service worker: сообщения, порт чата, алармы конкурентов.
- `background/agent.ts` — цикл «модель → инструменты → модель»; `tools.ts` — инструменты модели; `youtube.ts` + `ytparse.ts` — данные YouTube (API v3 или разбор страниц); `keyword.ts` — анализ запроса и «сейчас набирают»; `competitors.ts` — конкуренты и сигналы.
- `background/providers/` — Claude (официальный SDK), OpenAI‑совместимые (Chat Completions / Responses API), Atlas с автопереключением протокола.
- `content/index.ts` — страница YouTube: карточка (`overlay.ts`), значки (`badges.ts`), панель поиска (`searchpanel.ts`), извлечение из DOM (`extract.ts`), мост в MAIN world (`main.ts`/`bridge.ts`).
- `content/studio.ts` — YouTube Studio: тулбар, Optimize Score, автоанализ темы, вставка в поля, Magic Fill, шаблоны тегов, оценка превью.
- `sidepanel/` — чат и вкладка «Конкуренты»; `options/` — настройки.
- `shared/metrics.ts` — все формулы (VPH, outlier, вовлечённость, SEO‑чек‑лист, оценка названия, спрос/конкуренция).
- `docs/vidiq-research.md` — что умеет vidIQ (из их справки); `docs/plan.md` — сопоставление и очередь работ.

## Типичные поломки и куда смотреть
| Симптом | Где чинить |
|---|---|
| Карточка не появилась на видео | `content/index.ts` → `mountOverlay` (контейнеры `#secondary-inner`, `#below`); `main.ts` → `getPlayerResponse` |
| Лайки/комментарии «—» | `extract.ts` → `domWatchExtras` (aria‑label кнопки лайка, `#owner-sub-count`, `ytd-comments-header-renderer #count`) |
| Значки не на всех превью | `badges.ts` → `LIST_SELECTOR`, `thumbContainer`; `extract.ts` → `domListVideo` (строки «views / ago») |
| Тулбар в Studio не виден | `studio.ts` → `SEL.title` |
| Теги не вставляются | `studio.ts` → `addTags` (Enter, затем запятая) |
| Outlier «—» | фон: `youtube.ts` → `channelStats` (страница `/videos` канала; при капче/consent — ошибка в тултипе) |
| Ошибка провайдера | текст ошибки в чате: 401 — ключ; 404 — протокол/адрес; «Could not reach» — сеть или нет host‑permission |

## Очередь дальнейших работ
См. `docs/plan.md` (график просмотров и лог смен названия, карточка Shorts, симулятор выдачи с превью, ремикс/перевод/разбор комментариев, поиск outliers с фильтрами, публичный аудит канала, генерация превью через image‑API, режим без ключа на Gemini Nano, YouTube Analytics OAuth, нарезка клипов через ffmpeg).
