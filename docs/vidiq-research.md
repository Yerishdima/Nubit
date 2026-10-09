# vidIQ — полная инвентаризация функций, лимитов и цен (октябрь 2026)

> Цель документа: собрать максимально полный и актуальный перечень функций vidIQ (расширение, YouTube Studio, веб-приложение), тарифы и лимиты 2026 года, известные принципы расчёта метрик, слабые места и краткий контекст по конкурентам — как основу для проектирования конкурирующего продукта.
>
> Метод: прямой доступ к vidiq.com / support.vidiq.com из этой среды заблокирован (DNS), поэтому данные собраны через ~50 целевых поисковых запросов по сниппетам официальных страниц vidIQ (support.vidiq.com, vidiq.com/features, vidiq.com/plans, vidiq.com/blog) и сторонних обзоров 2026 года. Всё, что не подтверждено официальным источником или где источники расходятся, помечено **(unverified)** с указанием конфликтующих значений.

---

## Summary (кратко)

1. vidIQ — это три поверхности: браузерное расширение **vidIQ Vision for YouTube** (Chrome/Firefox/Edge, ~3 млн пользователей, рейтинг 4.5, версия 3.219.1 от 16.09.2026), плавающая панель внутри **YouTube Studio** и **веб-приложение/дашборд** (app.vidiq.com) + мобильное приложение iOS/Android.
2. Ядро расширения — **Scorecard** на странице просмотра: вкладки Views (данные видео), Overview (данные канала), AI Coach; плюс отдельный **Shorts Scorecard** (с лета 2025).
3. В Studio расширение даёт **Optimize Score** (0–100; официальные веса: заголовок 48 %, превью 48 %, описание 2,5 %, теги 1 %, время публикации 0,5 %), Title Score (1–100), генераторы заголовков/описаний/тегов, Magic Fill, SEO Scorecard-чеклист, Keyword Inspector, Thumbnail Preview, Best Time to Post.
4. Веб-приложение: Daily Ideas, AI Coach (режимы Fast / Deep Thinking / Max Mode), Competitors, Subscribers, Trend Alerts, Keywords, Outliers, Most Viewed, Channel Audit, Optimize, Thumbnails, Title/Description/Script generators, Clipping, Shorts/Video Generator, Generate, Create/Blueprints, Learn, Achievements, vidIQ MCP, vidIQ for Instagram.
5. Монетизация в 2026 — **единый пул AI-кредитов**: Free 150/мес, Boost 2 000 (1 канал) / 2 500 / 3 000, Max 6 000 / 8 000 / 10 000, Coaching 6 000. Стоимость действий: AI Coach 10/25/35 кредитов за сообщение, превью 22, заголовки 3, описание 1, скрипт 1/мин, Clipping 9/мин входного видео.
6. Цены: Free $0; Boost ≈ $19/мес помесячно или $16.58/мес при годовой оплате ($199/год) — **(unverified: часть источников даёт $39/мес помесячно)**; Max $49/мес помесячно или $39/мес годовой ($468/год) — **(unverified: часть источников говорит «только годовая»)**; Boost + Coaching ≈ $99/мес при годовой оплате; Enterprise — по запросу. Тариф Pro — legacy, для новых пользователей не продаётся.
7. Жёсткие лимиты Free: 3 Daily Ideas/день, 3 конкурента, 3 результата в разделах ключевых слов, 6 видео в Outliers без расширенных фильтров, 3 Remix/день, 3 тега по умолчанию без «Boost This Video», нет Best Time to Post / Subscriber Analysis / Controversial Keywords.
8. Формулы метрик не публикуются; известны только принципы: Keyword Overall Score = f(объём поиска за 30 дней, конкуренция в выдаче), Outlier Score = просмотры видео / средние просмотры канала за сопоставимый период (множитель), VPH = скорость набора просмотров (обновляется во времени), SEO Score = чеклист (≥5 тегов, объём тегов, ≥5 ключевых слов в заголовке и описании, «triple keywords»).
9. Главные жалобы: нестабильные/неточные значения объёма поиска, «общие» советы AI Coach, быстро сгорающие кредиты, постепенный перенос функций за paywall, замедление браузера расширением, проблемы с автопродлением/возвратом (Trustpilot ≈ 3.8–4.2 из 1 300+ отзывов), слабые фильтры Outliers, отсутствие A/B-тестов и массового редактирования тегов.
10. Конкуренты закрывают именно эти дыры: TubeBuddy (A/B-тесты, bulk-инструменты, дешевле), 1of10 (outlier-бейджи прямо в YouTube + AI-превью), OutlierKit (нишевый outlier-анализ, нормализация по размеру канала, бесплатное расширение), ViewStats (MrBeast; outlier-поиск, A/B, история превью, бесплатный тариф).

---

## 1. Расширение на YouTube (watch / search / home / channel)

Расширение официально называется **vidIQ Vision for YouTube**. Scorecard появляется справа на странице просмотра. Общая логика доступа: базовый оверлей бесплатный, но глубина данных и ряд блоков открываются на платных тарифах (vidIQ не публикует построчный список free/paid для расширения, поэтому графа «Free/Paid» ниже собрана из support-статей и обзоров).

### 1.1. Страница просмотра — vidIQ Scorecard

| Функция (EN) | Что показывает | Free / Paid | Источник |
|---|---|---|---|
| Scorecard — вкладка **Views** | Данные по видео (см. строки ниже) | Free (базово) | https://support.vidiq.com/en/articles/9696241-the-vidiq-scorecard ; https://support.vidiq.com/en/articles/9868197-vidiq-extension-overview |
| Scorecard — вкладка **Overview** | Данные по каналу (см. 1.4) | Free (базово) | те же |
| Scorecard — вкладка **AI Coach** | Чат по этому видео / каналу / любым вопросам о YouTube; тратит AI-кредиты | Free (150 кредитов/мес), больше на платных | https://support.vidiq.com/en/articles/9868197-vidiq-extension-overview |
| Views graph (график просмотров) | Просмотры за последние 24 ч / первые 7 дней / первые 28 дней / всё время; на графике отмечаются смены превью и заголовка; можно скачать даты публикации прошлых превью | Free (базовый график); история изменений — **(unverified, вероятно paid)** | https://support.vidiq.com/en/articles/9696241-the-vidiq-scorecard |
| Views / Likes / Comments | Счётчики просмотров, лайков, комментариев (в support-статье детально не описаны, подтверждены обзорами) | Free | https://alanspicer.com/vidiq-chrome-extension-guide/ |
| VPH (Views Per Hour) | «Трендит ли видео прямо сейчас» — скорость набора просмотров | Free на странице видео; «VPH для всех видео / исторический график VPH» — paid **(unverified)** | https://support.vidiq.com/en/articles/108672-what-is-vph-views-per-hour ; https://outlierkit.com/resources/youtube-analytics-chrome-extension/ |
| Engagement (%) | «Discovered engagement» как процент от общего числа просмотров | Free | https://support.vidiq.com/en/articles/9696241-the-vidiq-scorecard |
| Outlier (score) | Просмотры видео относительно средних просмотров канала за сопоставимый период (множитель, напр. 5x) | Free | там же; https://support.vidiq.com/en/articles/9660010-outliers |
| SEO Score | Насколько полно видео оптимизировано: количество тегов, «объём» тегов, ключевые слова в заголовке/описании; при наведении — полная разбивка и подсказки | Free | https://support.vidiq.com/en/articles/9696241-the-vidiq-scorecard ; https://vidiq.com/features/scorecard/ |
| Video Tags (с рейтингом) | Список тегов видео, ranking-оценка каждого тега и позиция видео в поиске YouTube по этому тегу; копирование в один клик | Free (ограниченно), полный список — paid **(unverified)** | https://support.vidiq.com/en/articles/9696241-the-vidiq-scorecard ; https://outlierkit.com/resources/youtube-analytics-chrome-extension/ |
| «Best tags» / сравнение с популярными тегами | Сравнение тегов видео с популярными тегами по теме (feature page: «tag performance comparison against popular tags»). Отдельного блока «Best tags» в support-документации не найдено | **(unverified)** | https://vidiq.com/features/scorecard/ |
| Channel Tags | Теги/ключевые слова, заданные владельцем канала | Free | https://support.vidiq.com/en/articles/9696241-the-vidiq-scorecard |
| Social (Facebook / Reddit / Twitter) | Активность видео в соцсетях; официально — Facebook и Reddit; Twitter упоминается только в листинге Chrome Web Store **(unverified)** | Free | https://vidiq.com/features/scorecard/ ; https://chromewebstore.google.com/detail/vidiq-vision-for-youtube/pachckjkecffpdphbpmfolblodfkgbhl |
| Reddit engagement | Апвоуты, комментарии, посты на Reddit (во вкладке Overview) | Free | https://support.vidiq.com/en/articles/9696241-the-vidiq-scorecard |
| Controversial Keywords | Флаги «спорных» слов в заголовке/описании/тегах: само слово, тип проблемы, где находится (для защиты от демонетизации) | **Boost и выше** | https://support.vidiq.com/en/articles/9696241-the-vidiq-scorecard |
| vidIQ Score (legacy) | Оценка «вероятности продвижения видео» (описание из листинга магазина; в актуальных support-статьях не фигурирует) | **(unverified)** | https://www.crx4chrome.com/extensions/pachckjkecffpdphbpmfolblodfkgbhl/ |
| Average Watch Time | Упомянут в листинге магазина как метрика Scorecard **(unverified)** | **(unverified)** | https://www.crx4chrome.com/extensions/pachckjkecffpdphbpmfolblodfkgbhl/ |
| Thumbnail (превью) | Показ превью, история смен (см. Views graph); отдельный инструмент Thumbnail Preview — см. раздел 2 | Free | https://support.vidiq.com/en/articles/9829132-preview-in-search-results |
| Most Viewed (ссылка из Tools menu) | Открывает инструмент «самые просматриваемые видео» (см. 3) | Free (ограничено) | https://support.vidiq.com/en/articles/8619340-most-viewed |
| Remix (кнопка у видео) | Генерирует новые заголовки/идеи видео на основе этого ролика под ваши темы; при первом запуске просит задать темы; только для long-form | Free: 3 генерации/день; paid: без лимита | https://support.vidiq.com/en/articles/9899331-remix ; https://vidiq.com/blog/post/vidiq-remix/ |
| Comment tools | Фильтры комментариев (с ответами/без, вопросы, нецензурная лексика, тональность, ключевые слова), шаблоны ответов с подстановкой имени, AI-ответ (1 кредит за ответ — по данным конкурента) | Free (фильтры) **(unverified для 2026)** | https://vidiq.com/blog/post/youtube-comment-filters-with-vidiq/ ; https://kripeshadwani.com/vidiq-review/ ; https://www.commentshark.com/blog/commentshark-vs-vidiq |

### 1.2. Shorts Scorecard (внутри плеера Shorts)

| Функция (EN) | Что показывает | Free / Paid | Источник |
|---|---|---|---|
| Shorts Scorecard | Статистика прямо в ленте Shorts, без выхода из плеера (введён в Summer 2025 Drop) | Free | https://support.vidiq.com/en/articles/10453678-the-vidiq-shorts-scorecard ; https://vidiq.com/blog/post/summer-2025-drop/ |
| Outlier Score (Shorts) | Сравнение с типичными просмотрами канала | Free | там же |
| Views Graph (Shorts) | 24 ч / 7 дней / 28 дней / всё время | Free | там же |
| Views Per Hour (Shorts) | Моментум в реальном времени | Free | там же |
| Engagement Rate (Shorts) | Процент вовлечённости | Free | там же |
| Ограничение | Для Shorts с ≈50 и менее просмотрами данные могут не отображаться | — | там же |

### 1.3. Страница результатов поиска и главная (home feed)

| Функция (EN) | Что показывает | Free / Paid | Источник |
|---|---|---|---|
| Search companion / панель справа на выдаче | Высокоуровневые метрики ключевого слова, трендовые видео по запросу, связанные запросы (related search words); панель можно свернуть | Free (базово), глубина — paid | https://vidiq.com/blog/post/vidiq-pro-and-youtube-keyword-tool/ ; https://vidiq.com/blog/post/vidiq-tools-youtube/ |
| Overall (Keyword) Score | 0–100: совокупная оценка «объём vs конкуренция»; диапазоны Very low 0–19, Low 20–39, Medium 40–59 и выше | Free | https://support.vidiq.com/en/articles/9421214-keywords-research |
| Search volume | Оценка месячных поисков на YouTube (скользящее окно 30 дней) | Free (оценка) | там же |
| Competition | Оценка конкуренции в выдаче по запросу | Free | там же |
| Related keywords / related queries | Связанные запросы с Related Score | Free (несколько), полный список — paid | там же; https://ahrefs.com/blog/fr/youtube-keyword-tools |
| Keyword stats / tags of top-ranking videos («Inline keywords») | Теги верхних видео в выдаче показываются прямо в результатах поиска | Free **(unverified)** | https://backlinko.com/hub/content/vidiq ; https://ahrefs.com/blog/fr/youtube-keyword-tools |
| Top channels / «какой автор чаще всего в выдаче» | Панель показывает, какие каналы/авторы чаще всего ранжируются по запросу, и «как часто видео по запросу “перерабатываются”» | Free **(unverified)** | https://vidiq.com/blog/post/vidiq-tools-youtube/ ; https://vidiq.com/compare/vidiq-vs-keywords-everywhere/ |
| Query trend graph (график тренда запроса) | Официально упоминается только «trend direction» (направление тренда) для ключевого слова; наличие 12-месячного графика в расширении **не подтверждено** | **(unverified)** | https://vidiq.com/features/keyword-tools/ |
| «Keywords in title» highlighting | Подсветка ключевых слов в заголовках выдачи — **не найдено ни в одном источнике (unverified / возможно отсутствует)** | **(unverified)** | — |
| VPH overlay в выдаче | «Views Per Hour прямо под заголовком видео в результатах поиска» (сторонние обзоры; официально не подтверждено) | Free **(unverified)** | https://outlierkit.com/resources/youtube-analytics-chrome-extension/ ; https://alanspicer.com/vidiq-chrome-extension-guide/ |
| VPH под превью на главной | Под большинством видео на home-странице показывается VPH | Free | https://support.vidiq.com/en/articles/9868197-vidiq-extension-overview ; https://alanspicer.com/vidiq-chrome-extension-guide/ |
| Outlier badges на главной / в сетке канала | Множитель относительно среднего канала (напр. 1.6x); цветовые пороги по стороннему источнику: чёрный <2x, синий 2–5x, фиолетовый 5–10x, красный >10x **(unverified)** | Free | https://marketingagent.blog/2026/05/11/tutorial-viral-youtube-growth-with-vidiq-outlier-detection/ ; https://alanspicer.com/vidiq-outlier-score-vph-explained/ |
| Tools menu (кнопка IQ) | Быстрый доступ: Daily Ideas, Keyword Research, Competitors, Trend Alerts, Most Viewed, Channel Audit, Achievements, Live Analytics | Free (вход), функции — по тарифу | https://support.vidiq.com/en/articles/9868197-vidiq-extension-overview ; https://www.anygen.io/showcase/vidiq-extension/index.html |
| Thumbnail Preview (в выдаче) | См. раздел 2 — превью своего видео среди реальной выдачи | Free **(unverified)** | https://support.vidiq.com/en/articles/9829132-preview-in-search-results |

### 1.4. Страница канала / вкладка Overview

| Функция (EN) | Что показывает | Free / Paid | Источник |
|---|---|---|---|
| Channel picture, name, handle | Идентификация канала | Free | https://support.vidiq.com/en/articles/9696241-the-vidiq-scorecard |
| Total Videos Uploaded | Количество публичных видео | Free | там же |
| Channel Age | Возраст канала | Free | там же |
| Subscribers + historical graph | Всего подписчиков и график роста во времени | Free (график — глубина истории по тарифу **(unverified)**) | там же |
| Views + historical graph | Всего просмотров и график | Free | там же |
| Channel Tags | Теги канала | Free | там же |
| Upload frequency / videos published in date range | Channel Research tool на странице канала: VPH канала, subscriber rank, число видео за выбранный период | Free **(unverified)** | https://vidiq.com/blog/post/vidiq-tools-youtube/ |
| Average views / Views Comparison | Просмотры видео за первые 28 дней vs среднее канала; Outlier относительно среднего | Free **(unverified)** | https://vidiq.com/blog/post/vidiq-tools-youtube/ |
| «View Trending Videos» | Топ-6 трендовых видео канала с их VPH | Free (6 видео) | https://kripeshadwani.com/vidiq-review/ |
| Reddit engagement | Апвоуты / комментарии / посты | Free | https://support.vidiq.com/en/articles/9696241-the-vidiq-scorecard |
| Controversial Keywords | См. 1.1 | Boost+ | там же |
| Achievements (в расширении) | Ближайшие вехи канала (см. 3) | Free | https://vidiq.com/features/achievements/ |

---

## 2. Помощники в YouTube Studio (загрузка / редактирование)

Расширение добавляет **плавающую панель (floating toolbar)** — слева при загрузке и снизу при редактировании; каждая иконка открывает свою панель. Официальный список инструментов панели: Optimize Score, Title Suggestions, Description Suggestions, Thumbnail Suggestions, Tag Suggestions, Best Time to Post, Magic Fill, Description Suggestion Preferences.

| Функция (EN) | Что показывает / делает | Free / Paid | Источник |
|---|---|---|---|
| **Optimize Score** | Оценка 0–100 оптимизации видео; анализирует заголовок, описание, превью, теги, время публикации. Официальные веса: Title 48 %, Thumbnail 48 %, Description 2,5 %, Tags 1 %, Scheduled post time 0,5 %. Обновляется автоматически; разбивка — по иконке IQ | Free (оценка); расширенные подсказки — paid | https://support.vidiq.com/en/articles/13892020-uploading-and-editing-on-youtube-with-vidiq |
| **SEO Scorecard** (чеклист перед публикацией) | Список actionable-пунктов: Tag count (≥5 тегов), Tag volume (теги с высоким volume), Keywords in title (≥5), Keywords in description (≥5), Triple Keywords (рекомендованные ключи одновременно в заголовке, тегах и описании); плюс проверка Controversial keywords | Free (чеклист); Controversial — Boost+ | https://support.vidiq.com/en/articles/9868197-vidiq-extension-overview ; https://support.vidiq.com/en/articles/9696241-the-vidiq-scorecard |
| **Title Score** | 1–100 в реальном времени в правом верхнем углу поля заголовка; цветовые зоны 0–40 красный, 41–80 жёлтый, 81–100 зелёный; показывает число символов | Free | https://support.vidiq.com/en/articles/10099905-title-suggestions ; https://support.vidiq.com/en/articles/8972670-optimize |
| **Title Suggestions** | 4 AI-варианта заголовка по введённому тексту, у каждого свой score; Suggestion Preferences — описание видео, целевое ключевое слово, «эмоция» (Curiosity, Comparison и т. п.); кнопка обновить | Free: базово; «больше заголовков и фидбек» — paid | https://support.vidiq.com/en/articles/10099905-title-suggestions |
| **Description Suggestions / AI Description Generator** | Ввод ключевых слов (до 100 символов через запятую) + подсказки ключей из тегов видео → 3 варианта описания с учётом заголовка; Insert / Copy; Change Keywords; refresh; переключатель Highlight Controversial Keywords; Description Suggestion Preferences (о чём видео, ключи, эмоция) | Free (1 кредит за генерацию) | https://support.vidiq.com/en/articles/10106669-ai-description-generator ; https://support.vidiq.com/en/articles/13928456-features-credits-by-plan |
| **Tag Suggestions / Recommended Tags** | Список рекомендованных тегов открывается по кнопке **Boost This Video**; сортировка по Relevancy (по умолчанию), Overall score, Volume **(сортировка по score/volume — unverified)**; замок на списке без клика | Free/Pro: только 3 тега по умолчанию, без refresh и без «Boost This Video»; Boost+: полный список | https://support.vidiq.com/en/articles/10106651-recommended-tags |
| **Keyword Inspector** | Кнопка в секции тегов: открывает Keyword Research по конкретному тегу — объём, конкуренция, related keywords, вопросы | Free: до 5 ключей за раз, по 5 related на каждый **(unverified)** | https://support.vidiq.com/en/articles/9868197-vidiq-extension-overview ; https://kripeshadwani.com/vidiq-review/ |
| **Magic Fill** | AI анализирует видео и заполняет заголовок, описание и теги; всё можно отредактировать до сохранения | Paid **(unverified; тратит кредиты)** | https://support.vidiq.com/en/articles/13892020-uploading-and-editing-on-youtube-with-vidiq |
| **Search preview** | Показывает, как видео будет ранжироваться по выбранному ключевому слову | Free **(unverified)** | https://support.vidiq.com/en/articles/9868197-vidiq-extension-overview |
| **Thumbnail Preview** | Реалистичный макет YouTube с вашим превью и заголовком; слева — выбор «окружения»: свои видео, трендовые / высокопроизводительные видео, выдача по запросу; доступен на странице загрузки и во вкладке Details существующего видео | Free **(unverified)** | https://support.vidiq.com/en/articles/9829132-preview-in-search-results |
| **Thumbnail Suggestions / оценка превью** | Оценка и грейд превью, резюме «что работает / что сделать кликабельнее»; генерация превью — 22 кредита | Фидбек по превью — paid | https://support.vidiq.com/en/articles/8972670-optimize ; https://support.vidiq.com/en/articles/13892020-uploading-and-editing-on-youtube-with-vidiq |
| **Best Time to Post** («Schedule Post» в панели) | Анализ активности аудитории канала (из YouTube Analytics), окно пиковой активности в вашем часовом поясе; данные появляются через несколько дней после подключения канала; собственного планировщика нет — только рекомендация | Paid (Boost+); в таблице Features & Credits помечено как недоступное на Free | https://support.vidiq.com/en/articles/108673-best-time-to-post ; https://support.vidiq.com/en/articles/13928456-features-credits-by-plan |
| **Controversial keyword check** | Проверка «спорных» слов на странице загрузки | Boost+ | https://vidiq.com/features/scorecard/ |
| End screens / Cards checks | На странице загрузки отдельных проверок не найдено; в Channel Audit есть проверка карточек/конечных заставок и их CTR | Channel Audit — см. 3 | https://support.vidiq.com/en/articles/10141815-channel-audit |
| Tag-утилиты (autocomplete, tag templates, competitor tag reveal, tag translator) | Описаны в стороннем гайде; в актуальной support-документации не найдены **(unverified / legacy)** | **(unverified)** | https://alanspicer.com/ultimate-guide-vidiq-2026/ |
| Video Manager bulk options | В менеджере видео: массовое редактирование заголовков/описаний по списку видео; **Bulk Download Meta** — выгрузка метаданных в таблицу; массовое редактирование **тегов не подтверждено** | Paid **(unverified)** | https://vidiq.com/blog/post/vidiq-tools-youtube/ ; https://tubeast.com/can-vidiq-bulk-change-description |
| A/B testing | Собственного A/B-движка нет; vidIQ рекомендует нативный YouTube «Test & Compare»; часть обзоров пишет «limited A/B testing» **(конфликт)** | — | https://thumbnailtest.com/guides/vidiq-vs-thumbnailtest/ ; https://vidiq.com/blog/post/youtube-launches-new-thumbnail-testing-tool/ |

---

## 3. Инструменты веб-приложения (app.vidiq.com) и мобильного приложения

Структура нового дашборда (support-статья обновлена ~сентябрь 2026): левая панель — **Home**, **Optimize**, **Chat** (AI Coach), **Research** (ключевые слова + outliers), **More Tools** → Daily Ideas, Competitors, Subscribers, Learn, Create, Thumbnails, Clipping, Scriptwriter, Generate; плюс Plans / Account Settings / Channel Settings. Отдельно из Tools menu расширения доступны Trend Alerts, Most Viewed, Channel Audit, Achievements.

| Функция (EN) | Что показывает / делает | Free / Paid | Источник |
|---|---|---|---|
| **Home / Feed Cards** | Персональные карточки: Title suggestions, Thumbnail ideas, Trending Keyword (растущие темы ниши), Niche Outliers (видео ниши, которые сильно выше среднего), Missing Description (готовое описание для видео без него), «today's highlights, suggestions, wins»; вверху — подписчики и просмотры канала | Free | https://support.vidiq.com/en/articles/13188399-feed-cards-breakdown ; https://support.vidiq.com/en/articles/9820526-navigating-your-new-dashboard |
| **Daily Ideas — Personalized** | AI анализирует ваши видео и похожие каналы → идеи видео с **View Prediction** (Very High / High / Medium / Low); обновляются ежедневно | Free 3/день; Pro (legacy) 10/день; Boost / Max / Coaching 50/день | https://support.vidiq.com/en/articles/7993395-personalized-and-customized-video-ideas ; https://support.vidiq.com/en/articles/13928456-features-credits-by-plan |
| **Daily Ideas — Customized** | Идеи по заданному ключевому слову + данным канала; только в веб-версии (внизу страницы Ideas) | Free: 3 за всё время; paid: без лимита | там же |
| **AI Coach** (Chat) | Чат с доступом к данным подключённого канала (библиотека видео, метрики, аудитория), деталям видео и поиску YouTube; аудит канала, идеи заголовков, стратегия, базовые скрипты, критика контента. Режимы: **Fast** (10 кредитов, простые запросы), **Deep Thinking** (25 кредитов; + инсайты по конкурентам, более сильные заголовки, стратегия), **Max Mode** (35 кредитов; полный аудит, конкурентное исследование, многослойные данные; только Max и Coaching; «5x more powerful»). Ограничения: не «смотрит» видео; данные с задержкой до 3 дней; для персонализации нужно ≥2 видео за последние 60 дней; не гарантирует результат | Free (в рамках 150 кредитов); Deep Thinking — Boost+; Max Mode — Max/Coaching; Max «до 3x больше разговоров» | https://support.vidiq.com/en/articles/8017871-ai-coach ; https://support.vidiq.com/en/articles/15195757-getting-the-best-results-from-vidiq-ai-coach ; https://vidiq.com/plans/ |
| **Competitors** | Добавление каналов-конкурентов. Channel Stats: просмотры и прирост подписчиков за 7 / 14 / 28 дней + тоталы для вас и конкурентов; «Top videos from your competitors» (Shorts и long-form) с сортировкой по views / VPH / outlier score; графики просмотров, подписчиков, средних дневных просмотров/подписчиков, числа публичных видео (по обзору) | Free: 3 конкурента; paid: 20 (официально). Сторонние: Boost 20–25, Max 50 / unlimited **(unverified)** | https://support.vidiq.com/en/articles/9456917-competitors ; https://vidiq.com/features/outliers/ |
| **Subscribers** (Subscriber insights) | Выборка подписчиков: какие другие каналы они смотрят/на кого подписаны, какие видео смотрят, когда наиболее активны; «Top videos watched by your subscribers», «Top channels your subscribers are subscribing to»; здесь же Best Time to Post | Boost и выше (Subscriber Analysis недоступен на Free) | https://support.vidiq.com/en/articles/9562745-understand-your-audience-with-subscribers ; https://support.vidiq.com/en/articles/108673-best-time-to-post |
| **Trend Alerts** | Email-оповещения по ключевым словам, категориям и конкурентам; имя алерта, порог VPH, частота (daily / weekly / monthly); Competitor Watch List — уведомление, когда видео конкурента набирает обороты. Триггер «скачок 3–5x VPH» — только по стороннему гайду **(unverified)** | Boost+ | https://vidiq.com/features/trend-alerts/ ; https://alanspicer.com/vidiq-trend-alerts-guide/ |
| **Keywords Research** (Research → Keywords) | Для запроса: Overall Score, Search volume, Competition; вкладки Related Keywords (с Related Score), Matching Terms, Questions; топ-видео по запросу (топ-10 трендовых с просмотрами и engagement) и ведущие каналы; разделы Keywords For You, Rising Keywords (сегодня / неделя / месяц; языки EN, RU, ES, PT; рост объёма в %), Top Search Terms for Your Channel; Filter Topic; «trend direction» | Free: по 3 результата в Keywords For You / Rising / Top Search Terms (сторонние: по 4 в Related/Matching/Questions); Filter Topic — paid; paid — без лимита | https://support.vidiq.com/en/articles/9421214-keywords-research ; https://vidiq.com/features/keyword-tools/ |
| **Outliers** (Research → Outliers) | Поиск видео, резко превышающих норму канала. Фильтры (официально): Outlier Score 0–100+ (множитель), Views per hour 0–1K+, Video length 0–60+ мин, Subscribers 0–10M+, Views (слайдер), период (This week / This month / Last 3 months / Last 6 months / Last year / All time); сторонние добавляют video format и keywords **(unverified)**; Remix идей в контент | Free: до 6 видео на поиск, без Advanced Filters; Boost+: неограниченные поиски и все фильтры | https://support.vidiq.com/en/articles/9660010-outliers ; https://vidiq.com/features/outliers/ |
| **Most Viewed** | Самые популярные видео (с ключевым словом или без) за 48 ч / 7 дней / 30 дней / 6 месяцев; сортировка views / VPH (velocity) / engagement rate; фильтры: тип контента, VPH, просмотры, категория, страна, подписчики канала, vidIQ score; доступен только через расширение | Сортировка — Pro+/paid; фильтр по стране — paid | https://support.vidiq.com/en/articles/8619340-most-viewed ; https://vidiq.com/features/most-viewed/ |
| **Channel Audit** | Stats at a Glance (просмотры, изменение подписчиков, watch time за 30/60/90 дней с сравнением периодов); Content to Double Down On — ранжирование видео по VPH, engagement rate, subscribers gained, total/avg watch time, audience retention, traffic sources; Underperforming — наименьший watch time, retention, просмотры, потеря подписчиков, likes ratio; top search terms, Endscreen click rate, Card performance; чеклист метаданных (title 20–60 символов, description 300+, tags 200+, cards, endscreens, thumbnails, playlists); «missed opportunities» | Free: часть разделов; paid: до 20 результатов в каждом разделе | https://support.vidiq.com/en/articles/10141815-channel-audit ; https://vidiq.com/features/channel-audit/ |
| Free Channel Audit (vidiq.com/audit, публичный) | 5 сигналов по последним видео: регулярность загрузок, SEO, engagement rate, views-to-subscriber ratio, posting regularity | Free (без аккаунта) | https://vidiq.com/audit/ |
| **Optimize** (дашборд) | Окно по каждому long-form видео: вкладки titles / thumbnails / SEO / review; редактирование заголовка со score и счётчиком символов; генерация заголовков; грейд превью и резюме улучшений | Free: базово; сортировка, доп. заголовки/превью, фидбек по заголовкам и превью — paid | https://support.vidiq.com/en/articles/8972670-optimize |
| **Thumbnails** (AI Thumbnail Maker) | Генерация превью по промпту; Attach — своё фото, объекты, несколько лиц (реакции), reference-превью с YouTube; **Likeness** («Use my face in thumbnails», face-swap); редактор: текст, изображения, удаление фона, позиция/прозрачность; JPEG/PNG; модель Nano Banana (Fall 2025 Drop) **(unverified привязка)** | 22 кредита за генерацию / регенерацию / правку; Free — ограниченно (150 кредитов ≈ 6 превью) | https://support.vidiq.com/en/articles/10152120-thumbnails ; https://support.vidiq.com/en/articles/13946970-best-practices-getting-the-most-out-of-vidiq-thumbnails ; https://vidiq.com/blog/category/product-updates/ |
| **Title Generator** | До 3 заголовков за генерацию, каждый со score; в один клик → превью или скрипт | 3 кредита за генерацию | https://vidiq.com/ai-title-generator/ ; https://support.vidiq.com/en/articles/13928456-features-credits-by-plan |
| **Description Generator** | См. раздел 2 | 1 кредит | https://support.vidiq.com/en/articles/13928456-features-credits-by-plan |
| **Script Writer** | Выбор длины 5 / 10 / 15 / 20 / 30 минут; анализирует стилистически похожие видео и воспроизводит структуру/темп; интро, секции, CTA | 1 кредит за минуту выбранной длины | https://support.vidiq.com/en/articles/11526189-script-writer |
| **Clipping** | Загрузка .mp4 до 30 ГБ, 4K, до 10 ч; нужны лица и речь; желательно >3 мин; сегмент ≥30 с; длина клипа Any / Short 20–45 с / Medium 45–60 с / Long 60+ с; субтитры (вкл. по умолчанию, редактируемый стиль: шрифт, цвет, размер, позиция); выбор языка для транскрипции; экспорт 1080p вертикально | 9 кредитов за минуту входного видео; Max: «до 11 часов clipping и генераций» | https://support.vidiq.com/en/articles/11519169-clipping ; https://vidiq.com/plans/ |
| **Shorts Generator** | Генерация Shorts из материала; делит пул кредитов с Clipping | 2 кредита/сек (support «Features breakdown by plan») — **конфликт**: другой сниппет даёт 20 кредитов/сек **(unverified)** | https://support.vidiq.com/en/articles/9554210-features-breakdown-by-plan ; https://support.vidiq.com/en/articles/13928456-features-credits-by-plan |
| **Video Generator** | Text-to-video 1–15 с (зависит от модели); стоимость кредитов зависит от модели и длительности; неудачная генерация не списывает кредиты | Кредиты (ставка не найдена) | https://support.vidiq.com/en/articles/13564834-video-generator ; https://vidiq.com/ai-video-generator/ |
| **Generate** | Из одной идеи: заголовки, описание, теги, outline/скрипт, AI-превью (редактируемые, скачиваемые), превью AI-озвучки; Refine — стиль хука (challenge, claim, fact, problem, promise, question); сохранение/избранное | Кредиты; полный доступ с аккаунтом | https://support.vidiq.com/en/articles/9829101-generate ; https://vidiq.com/generate/ |
| **Create / Blueprints** | «Topic of the Day», high-performing видео для вдохновения; Blueprint — пошаговый план видео (идея → заголовок → превью → скрипт), сохранение и шеринг ссылкой; вкладка Outline | Free: до 3 сохранённых blueprint; доп. заголовки/превью и Outline — paid | https://support.vidiq.com/en/articles/9010754-blueprints ; https://support.vidiq.com/en/articles/8991775-create |
| **Learn** | Уроки по росту канала; на Boost — «masterclasses from top creators» | Free (уроки); masterclasses — Boost+ | https://support.vidiq.com/en/articles/9820526-navigating-your-new-dashboard ; https://vidiq.com/plans/ |
| **Achievements** | 6 вех: подписчики, просмотры, загрузки, лайки, часы просмотра, комментарии; главная — ближайшая ожидаемая веха; генерация сертификата для соцсетей | Free | https://vidiq.com/features/achievements/ |
| **Historical data** | Графики подписчиков/просмотров канала в Scorecard; публичные страницы vidiq.com/youtube-stats с дневной таблицей (подписчики, просмотры, прирост, оценка дохода); «исторические данные по популярным видео» — paid (legacy Pro); лимит «12 месяцев на Free» — по одному обзору **(unverified)** | Free (ограниченно) / paid | https://addons.mozilla.org/en-US/firefox/addon/vidiq-vision-youtube/ ; https://vidiq.com/youtube-stats/ |
| **Views per hour на дашборде** | VPH в Channel Audit, Competitors (сортировка топ-видео), Outliers, Most Viewed, Trend Alerts (порог) | Free / paid по инструменту | см. соответствующие строки |
| **Bulk editing** | Только через Video Manager в Studio (см. раздел 2); отдельного bulk-инструмента для тегов нет | — | https://vidiq.com/blog/post/vidiq-tools-youtube/ |
| **Scheduled publishing** | Нет собственного планировщика; только рекомендация времени (Best Time to Post / Schedule Post) | — | https://support.vidiq.com/en/articles/108673-best-time-to-post |
| **Comments management** | См. раздел 1.1 (фильтры, шаблоны, AI-ответ) | Free / кредиты | https://vidiq.com/blog/post/youtube-comment-filters-with-vidiq/ |
| **A/B testing** | Отсутствует (см. раздел 2) | — | https://thumbnailtest.com/guides/vidiq-vs-thumbnailtest/ |
| **vidIQ MCP** | Подключение ChatGPT (официальное приложение), Claude, Cursor, Codex к данным vidIQ (135M+ каналов, 12B+ видео): исследование каналов, анализ видео, тренды, оценка превью/заголовков, аналитика | Все тарифы «на период запуска»; 5 кредитов за вызов; 0 — баланс/список каналов/фидбек/категории трендов; 10 — Video Watch / Reel Watch | https://support.vidiq.com/en/articles/15082430-vidiq-mcp ; https://vidiq.com/blog/post/chatgpt-youtube-vidiq-ai-coach/ |
| **vidIQ for Instagram** (май 2026) | Анализ последних Reels, идеи на основе трендов, генерация обложек Reels | Все тарифы (кредиты) | https://vidiq.com/blog/post/vidiq-for-instagram/ ; https://support.vidiq.com/en/articles/14975681-vidiq-for-instagram |
| **vidIQ Viral (TikTok app)** | Отдельное приложение: трендовые звуки/музыка | Free | https://vidiq.com/tiktok/ |
| **Mobile app (iOS / Android)** | «vidIQ for YouTube & Instagram»: Feed с Daily Ideas, keyword research с объёмом, создание превью, оценка заголовков/превью, Trend Alerts, AI Coach; Customized Ideas недоступны в мобильном приложении; Android 2.8.8 (27.09.2026) | Free / по тарифу | https://vidiq.com/mobile-app/ ; https://apps.apple.com/us/app/vidiq-for-youtube-instagram/id1458235345 ; https://play.google.com/store/apps/details?id=com.vidiq.app |
| **Enterprise admin** | Multi-channel dashboard, seats для команды, роли и права (вкл. read-only), добавление/удаление участников по каналу, cross-channel reporting, приоритетный onboarding/поддержка, персональное обучение; для >5 каналов / нескольких менеджеров; есть per-seat add-on | Enterprise (по запросу) | https://support.vidiq.com/en/articles/8058473-vidiq-enterprise-introduction ; https://support.vidiq.com/en/articles/11186522-granting-read-only-access-to-team-members-enterprise-plan ; https://enterprise.vidiq.com/packages |

---

## 4. Тарифы и лимиты 2026

На 2 октября 2026 официальная страница vidiq.com/plans показывала карточки: **Free $0**, **Boost**, **Max**, **Boost + Coaching**, **Enterprise**. Тариф **Pro** — legacy (в help-центре ещё есть строки «Pro: 1 000 кредитов, 10 идей/день»), новым пользователям не предлагается. Бесплатного trial платных тарифов нет — тестировать можно только Free.

### 4.1. Цены

| Тариф | Помесячно | При годовой оплате | Примечания / конфликты |
|---|---|---|---|
| Free | $0 | $0 | Постоянный бесплатный план |
| Boost | **$19/мес** (comparedge, outlierkit, 1of10-pricing) — **(unverified: 1of10-review указывает $39/мес помесячно; UK-обзор £24.50)** | **$16.58/мес = $199/год** (сходится у большинства) | 1 канал; за 2–3 канала — больше кредитов (см. 4.2) |
| Max | **$49/мес** (comparedge, outlierkit) — **(unverified: 1of10 пишет «только годовая оплата»)** | **$39/мес = $468/год** | Макс. 3 канала на self-serve |
| Boost + Coaching | не предлагается помесячно **(unverified)** | **≈ $99/мес = ≈ $1 188/год** (1of10, onetube, toolsforhumans) — **конфликт: G2 показывает $199/мес** | Boost + 1-на-1 сессии с коучем vidIQ, персональный план роста, аудит, фидбек по превью/заголовкам/стратегии; число сессий не публикуется |
| Enterprise | по запросу | по запросу | Бренды, агентства, MCN; >5 каналов / несколько пользователей; per-seat add-on |
| Pro (legacy) | ≈ $7.50–10/мес (устаревшие данные) | — | Снят с продажи для новых пользователей |

### 4.2. AI-кредиты (официальная таблица «Features & Credits by Plan»)

| Тариф | Кредитов/мес | Примечания |
|---|---|---|
| Free | 150 | Обновляются в годовщину регистрации |
| Pro (legacy, 1 канал) | 1 000 | — |
| Boost | 2 000 (1 канал) / 2 500 (2 канала) / 3 000 (3 канала) | Обновляются в дату апгрейда |
| Max | 6 000 / 8 000 / 10 000 (1 / 2 / 3 канала) | Top-up (докупка) кредитов доступна только Max и Coaching |
| Coaching | 6 000 — **конфликт: сторонний обзор даёт 2 000** **(unverified)** | — |

Правила: кредиты плана не переносятся на следующий месяц; add-on кредиты (докупленные/бонусные) не сгорают и расходуются после плановых; один пул на все AI-инструменты.

**Стоимость действий (официально):** AI Coach Fast 10 / Deep Thinking 25 / Max Mode 35 за сообщение; Thumbnails 22 за генерацию/регенерацию/правку; Title Generator 3 (до 3 заголовков); Description Generator 1; Script Writer 1/мин; Clipping 9/мин входного видео; Shorts Generator 2/сек (**(unverified)** — другой сниппет: 20/сек); MCP 5 за вызов (0 / 10 для отдельных инструментов); AI comment reply 1 **(unverified, по данным конкурента)**.

### 4.3. Лимиты и гейтинг функций по тарифам

| Функция | Free | Boost | Max | Coaching | Источник |
|---|---|---|---|---|---|
| Personalized Daily Ideas | 3/день | 50/день | 50/день | 50/день | support 13928456, 7993395 |
| Customized Daily Ideas | 3 за всё время | без лимита | без лимита | без лимита | support 7993395 |
| Competitors | 3 | 20 | 20 (сторонние: 50/unlimited **unverified**) | 20 | support 9456917 |
| Keyword Research — результаты в разделах | 3 (Keywords For You / Rising / Top Search Terms); 4 в Related/Matching/Questions **(unverified)** | без лимита | без лимита | без лимита | support 9421214 |
| Filter Topic (ключевые слова) | нет | да | да | да | support 9421214 |
| Outliers | 6 видео/поиск, без Advanced Filters | без лимита + фильтры | то же | то же | support 9660010; vidiq.com/features/outliers |
| Most Viewed — сортировка / фильтр по стране | нет | да | да | да | support 8619340 |
| Remix | 3/день | без лимита | без лимита | без лимита | support 9899331 |
| Recommended Tags / Boost This Video | 3 тега по умолчанию, без refresh | полный список | полный | полный | support 10106651 |
| Controversial Keywords | нет | да | да | да | support 9696241 |
| Best Time to Post | нет | да | да | да | support 13928456 |
| Subscriber Analysis (top videos/channels подписчиков) | нет | да | да | да | support 9562745 |
| Trend Alerts | нет **(unverified)** | да | да | да | vidiq.com/features/trend-alerts |
| Channel Audit | ограниченно | до 20 результатов/раздел | то же | то же | vidiq.com/features/channel-audit |
| Optimize: сортировка, доп. заголовки/превью, фидбек | нет | да | да | да | support 8972670 |
| Blueprints (сохранённые) | 3 | без лимита | без лимита | без лимита | support 9010754 |
| AI Coach Deep Thinking | нет **(unverified)** | да | да | да | vidiq.com/plans |
| AI Coach Max Mode | нет | нет | да | да | support 8017871 |
| AI Coach «conversations» | базово | базово | «до 3x» | — | vidiq.com/plans |
| Clipping / генерации | кредиты | кредиты | «до 11 часов» | — | vidiq.com/plans |
| Top-up кредитов | нет | нет | да | да | support 14979673 |
| Masterclasses (Learn) | нет (только lessons) | да | да | да | vidiq.com/plans |
| vidIQ MCP | да (launch period) | да | да | да | support 15082430 |
| Каналов в аккаунте | 1 | до 3 | до 3 | — | vidiq.com/plans |

Официальное описание Boost: «30+ advanced tools», 2 000 кредитов, thumbnail creation, personalized ideas, unlimited trends research, optimization tools, unlimited subscriber insights, AI Coach with deep thinking, masterclasses. Max: «everything in Boost», 6 000 кредитов, до 3x AI Coach conversations, «5x more powerful Max Mode AI», до 11 часов clipping и генераций.

---

## 5. Как считаются метрики (что известно)

| Метрика | Официально известно | Сторонние гипотезы (unverified) | Источник |
|---|---|---|---|
| **SEO Score** (Scorecard) | Отражает «насколько полно видео оптимизировано»: количество тегов, объём (volume) тегов, ключевые слова в заголовке и описании. Чеклист: ≥5 тегов; теги с высоким volume; ≥5 ключевых слов в заголовке; ≥5 в описании; Triple Keywords (рекомендованные ключи в заголовке + тегах + описании). Часть score «performance» определяется общей результативностью видео; один сниппет support-статьи говорит о делении score поровну между «контролируемой» и «performance» частью **(unverified)** | Alan Spicer: ~30 % keyword в заголовке, ~25 % качество описания, ~20 % стратегия тегов, ~15 % релевантность тегов — оценки автора, не vidIQ; «0–100 с учётом engagement-сигналов» — тоже сторонние | https://support.vidiq.com/en/articles/9696241-the-vidiq-scorecard ; https://alanspicer.com/vidiq-seo-score-explained/ |
| **Optimize Score** (Studio) | 0–100; веса: Title 48 %, Thumbnail 48 %, Description 2,5 %, Tags 1 %, Scheduled post time 0,5 % | — | https://support.vidiq.com/en/articles/13892020-uploading-and-editing-on-youtube-with-vidiq |
| **Title Score** | 1–100 в реальном времени; формула не раскрыта; зоны 0–40 / 41–80 / 81–100 | MCP-описание: «clickability, clarity, viewer appeal» | https://support.vidiq.com/en/articles/10099905-title-suggestions ; https://support.vidiq.com/en/articles/15082430-vidiq-mcp |
| **Keyword Overall Score** | 0–100, два входа: Competition (vidIQ смотрит на видео, конкурирующие за запрос, и объём конкуренции в выдаче) и Volume (оценка месячных поисков на YouTube по скользящему окну 30 дней; диапазоны объёма рассчитываются относительно ключа с максимальным объёмом); 100 = «идеально»: минимальная конкуренция + максимальный объём; диапазоны Very low 0–19, Low 20–39, Medium 40–59 (выше — High/Very high) | Ahrefs: vidIQ заявлял, что competition учитывает суммарные engagement (YouTube, Reddit, Twitter, Facebook), view velocity и просмотры конкурирующих видео; эвристика «>50 хорошо, >60 отлично» — не официальная | https://support.vidiq.com/en/articles/9421214-keywords-research ; https://vidiq.com/blog/post/youtube-new-keyword-research-tool/ ; https://ahrefs.com/blog/fr/youtube-keyword-tools |
| **Related Score** | Насколько связанное ключевое слово близко к исходному; выше = сильнее связь | — | https://support.vidiq.com/en/articles/9421214-keywords-research |
| **Outlier Score** | «Сравнивает число просмотров видео со средними просмотрами канала за сопоставимый период»; выражается множителем (5x, 10x); feature page: «based on views, velocity, and performance vs. a channel's usual baseline»; в Outliers фильтр 0–100+ | Spicer: учитывает возраст видео (поправка на время), тренды ниши и траекторию роста канала; OutlierKit: «стандартные отклонения от среднего канала» — противоречит формулировке vidIQ; цветовые пороги <2x / 2–5x / 5–10x / >10x | https://support.vidiq.com/en/articles/9696241-the-vidiq-scorecard ; https://vidiq.com/features/outliers/ ; https://alanspicer.com/vidiq-outlier-score-vph-explained/ ; https://outlierkit.com/resources/outlier-scores/ |
| **VPH (Views Per Hour)** | «View velocity» — скорость набора просмотров, показатель «взлетающих» видео; обновляется во времени (у старого видео тоже может расти); формула (среднее за всё время vs скользящее окно) не раскрыта | Spicer: «сколько просмотров набирает прямо сейчас» (видео 1 ч, 5K просмотров, 1 200 VPH); эвристика «100+ — трендит» | https://support.vidiq.com/en/articles/108672-what-is-vph-views-per-hour ; https://alanspicer.com/vidiq-outlier-score-vph-explained/ |
| **Engagement** | «Discovered engagement» как процент от общего числа просмотров (лайки/комментарии/… к просмотрам) | — | https://support.vidiq.com/en/articles/9696241-the-vidiq-scorecard |
| **View Prediction** (Daily Ideas) | Категории Very High / High / Medium / Low относительно потенциальной результативности; метод не раскрыт | — | https://support.vidiq.com/en/articles/7993395-personalized-and-customized-video-ideas |
| **Best Time to Post** | На основе активности аудитории канала (когда подписчики онлайн), в локальном часовом поясе; требуется несколько дней данных | Spicer: агрегация данных YouTube Analytics за недели/месяцы | https://support.vidiq.com/en/articles/108673-best-time-to-post |
| **Trend Alerts trigger** | Порог VPH, задаваемый пользователем | «скачок 3–5x в час» — только у Spicer | https://vidiq.com/features/trend-alerts/ |
| **Thumbnail score** | Грейд + текстовое резюме; MCP: «clickability, clarity, viewer appeal» | Третьи стороны: читаемость, контраст, композиция, прогноз CTR | https://support.vidiq.com/en/articles/8972670-optimize |
| **Channel Audit — ранжирование** | По VPH, engagement rate, subscribers gained, watch time, retention, traffic sources; пороги метаданных: title 20–60 символов, description 300+, tags 200+ | — | https://support.vidiq.com/en/articles/10141815-channel-audit |

Общий вывод: vidIQ раскрывает только **входы** и несколько **весов** (Optimize Score), но не формулы. Для конкурирующего продукта это означает: воспроизвести «похожие» метрики легко (множитель к медиане канала, скорость просмотров по дельтам, чеклист метаданных), а конкурентным преимуществом может стать **прозрачность** формул.

---

## 6. Слабые места, на которые жалуются пользователи

| Проблема | Детали | Источник |
|---|---|---|
| Неточный / нестабильный объём поиска | Пользователь на Boost видел до 3 разных значений для одного ключа; цифры не совпадают с данными YouTube; vidIQ сам называет их оценками; score «directional, not precise» | https://www.blackhatworld.com/seo/is-vidiq-search-volume-reliable.1041675/ ; https://ytgrowth.io/blog/vidiq-review |
| «Общие» советы AI Coach | Советы generic/scripted, «не понимает нишу»; для персонализации нужно ≥10–15 видео и ≥2 загрузки за 60 дней; данные с задержкой до 3 дней; не «смотрит» видео | https://1of10.com/blog/vidiq-review/ ; https://www.trustpilot.com/review/vidiq.com ; https://vidailab.com/vidiq-ai-coach-2026/ |
| Кредиты быстро сгорают | Переход на кредитную модель без явного предупреждения; 22 кредита за каждую регенерацию превью; Free 150 кредитов ≈ 6 превью; не переносятся | https://www.trustpilot.com/review/vidiq.com ; https://1of10.com/blog/vidiq-review/ |
| Paywall creep | В 2022–2024 функции из Free тихо перенесены в платные; бесплатный keyword tool выдаёт «горстку» результатов; расширение показывает «видимые, но заблокированные» цифры | https://1of10.com/blog/vidiq-review/ ; https://ytgrowth.io/blog/vidiq-review |
| Замедление браузера | «Major user complaint» по версии конкурента; независимых бенчмарков нет | https://outlierkit.com/blog/best-youtube-keyword-research-tools |
| Биллинг и отмена | Автопродление годовых планов ($468 / $948) без уведомления, отказ в возврате, «отменил, но списали»; Trustpilot vidiq.com ≈ 3.8–4.2 (1 300+ отзывов), app.vidiq.com 2.6 (7 отзывов) | https://www.trustpilot.com/review/vidiq.com ; https://saasflags.com/products/vidiq/is-it-a-scam |
| Outliers слабее специализированных тулов | Ограниченные нишевые фильтры, перекос на крупные каналы, «слишком специфичные фильтры возвращают нерелевантное», нет базы outliers по всему YouTube | https://outlierkit.com/blog/best-youtube-outlier-finder-tools ; https://1of10.com/blog/vidiq-review/ |
| Идеи и превью слабее, чем у 1of10 | 1of10: «keyword research best in class, но ideas и thumbnails слабее» (конкурент) | https://1of10.com/blog/vidiq-review/ |
| Channel Audit поверхностный | Указывает на короткие описания/отсутствие тегов, но не отвечает на вопрос, совпадает ли стратегия с спросом | https://humbleandbrag.com/blog/best-youtube-channel-tools |
| Перегрузка информацией / UI | «Объём информации может перегрузить новичков; больше оценок ≠ лучшие видео»; Remix навязывает рекомендованное превью (единичный отзыв Capterra) | https://sanishtech.com/reviews/vidiq-review/ ; https://www.capterra.com/p/182133/vidIQ/reviews/ |
| Отсутствие A/B-тестов и bulk-тегов | Нет собственного A/B (в отличие от TubeBuddy/ViewStats); нет массового редактирования тегов, Bulk Find/Replace | https://outlierkit.com/resources/vidiq-vs-tubebuddy/ ; https://thumbnailtest.com/guides/vidiq-vs-tubebuddy/ |
| Non-predictive scores | SEO/Keyword score не предсказывают ранжирование и просмотры (сами vidIQ пишут это в support) | https://support.vidiq.com/en/articles/10106651-recommended-tags |
| Устаревшая документация | Ряд support-статей 1–2 года, названия кнопок/лимиты расходятся с UI | support.vidiq.com (метаданные статей) |

---

## 7. Конкуренты (контекст)

| Продукт | Чем отличается от vidIQ | Цена (2026, unverified — источники расходятся) | Источник |
|---|---|---|---|
| **TubeBuddy** | Единственный крупный инструмент с настоящим A/B-тестированием заголовков/превью/описаний/тегов (план Legend); bulk-инструменты (Bulk Find/Replace, Bulk Thumbnail Overlays, Scheduled Publish); слабее в keyword/competitor research и AI-идеях; тоже расширение | Вход ≈ $3.60–4.50/мес, Pro ≈ $12/мес, Legend ≈ $27/мес (годовая) | https://outlierkit.com/resources/vidiq-vs-tubebuddy/ ; https://thumbnailtest.com/guides/vidiq-vs-tubebuddy/ ; https://www.tubebuddy.com/blog/tubebuddy-vs-vidiq/ |
| **1of10** | Outlier-бейджи с множителем (напр. 7.1x) прямо в интерфейсе YouTube (browse-time discovery); AI Title Generator и полноценный AI thumbnail generator с поиском/редактором; позиционируется как «ideas + packaging» | Basic $19/мес ($180/год) или $29/мес ($349/год); Pro $69–89/мес ($828/год), 1 000 кредитов | https://1of10.com/blog/1of10-vs-outlierkit/ ; https://outlierkit.com/blog/1of10-vs-vidiq |
| **OutlierKit** | Исследовательский фокус: нишевый outlier-анализ с нормализацией по размеру канала, «почему видео перевыполнило», low-competition и high-RPM keywords, hook strength, trend prediction, AI script analysis; цветные outlier-оценки на превью во вкладке Videos любого канала; бесплатное расширение без аккаунта; API | Hobby $29/мес или $199/год (100 кредитов), Pro $49/мес или $299/год (500 кредитов, API, Competitor Studio), Max $199/мес или $999/год (2 000 кредитов) | https://outlierkit.com/resources/outlierkit-vs-vidiq/ ; https://outlierkit.com/blog/best-youtube-outlier-finder-tools |
| **ViewStats** | Со-основан MrBeast; Outlier Video Search (сравнение с последними 9 загрузками канала), A/B Tests, Thumbnail Search, Video Alerts, Collections, Creator Dashboard, Competitors; расширение с графиком просмотров во времени и историей смен превью; реальный бесплатный тариф; жалобы на логин/лаги (по данным конкурента) | Free Basic; Pro $49.99/мес (≈$39.99/мес годовая); Business от $249/мес | https://outlierkit.com/resources/vidiq-vs-viewstats/ ; https://outlierkit.com/resources/viewstats-chrome-extension/ ; https://1of10.com/compare/viewstats-alternatives |

Выводы для продукта-конкурента: vidIQ выигрывает широтой (всё-в-одном + AI Coach + Studio-панель), но проигрывает по (а) прозрачности и точности метрик, (б) глубине outlier-анализа, (в) A/B и bulk-инструментам, (г) честности ценообразования/кредитов. Ниша «прозрачные формулы + сильные outliers + честный free-tier + bulk/A/B» остаётся незакрытой одним продуктом.

---

## Sources (все использованные URL)

### Официальные vidIQ — support.vidiq.com
- https://support.vidiq.com/en/articles/9696241-the-vidiq-scorecard
- https://support.vidiq.com/en/articles/10453678-the-vidiq-shorts-scorecard
- https://support.vidiq.com/en/articles/9868197-vidiq-extension-overview
- https://support.vidiq.com/en/articles/13892020-uploading-and-editing-on-youtube-with-vidiq
- https://support.vidiq.com/en/articles/9906017-uploading-and-editing-with-vidiq
- https://support.vidiq.com/en/articles/10099905-title-suggestions
- https://support.vidiq.com/en/articles/10106669-ai-description-generator
- https://support.vidiq.com/en/articles/10106651-recommended-tags
- https://support.vidiq.com/en/articles/9829132-preview-in-search-results
- https://support.vidiq.com/en/articles/108673-best-time-to-post
- https://support.vidiq.com/en/articles/108672-what-is-vph-views-per-hour
- https://support.vidiq.com/en/articles/8972670-optimize
- https://support.vidiq.com/en/articles/9820526-navigating-your-new-dashboard
- https://support.vidiq.com/en/articles/13188399-feed-cards-breakdown
- https://support.vidiq.com/en/articles/7993395-personalized-and-customized-video-ideas
- https://support.vidiq.com/en/articles/8017871-ai-coach
- https://support.vidiq.com/en/articles/15195757-getting-the-best-results-from-vidiq-ai-coach
- https://support.vidiq.com/en/articles/9456917-competitors
- https://support.vidiq.com/en/articles/9562745-understand-your-audience-with-subscribers
- https://support.vidiq.com/en/articles/9421214-keywords-research
- https://support.vidiq.com/en/articles/9660010-outliers
- https://support.vidiq.com/en/articles/8619340-most-viewed
- https://support.vidiq.com/en/articles/10141815-channel-audit
- https://support.vidiq.com/en/articles/10152120-thumbnails
- https://support.vidiq.com/en/articles/13946970-best-practices-getting-the-most-out-of-vidiq-thumbnails
- https://support.vidiq.com/en/articles/10099973-ai-thumbnail-builder
- https://support.vidiq.com/en/articles/11526189-script-writer
- https://support.vidiq.com/en/articles/11519169-clipping
- https://support.vidiq.com/en/articles/13564834-video-generator
- https://support.vidiq.com/en/articles/9829101-generate
- https://support.vidiq.com/en/articles/9010754-blueprints
- https://support.vidiq.com/en/articles/8991775-create
- https://support.vidiq.com/en/articles/9899331-remix
- https://support.vidiq.com/en/articles/13928456-features-credits-by-plan
- https://support.vidiq.com/en/articles/9554210-features-breakdown-by-plan
- https://support.vidiq.com/en/articles/14979673-running-out-of-ai-credits-your-options-for-getting-more
- https://support.vidiq.com/en/articles/15082430-vidiq-mcp
- https://support.vidiq.com/en/articles/14975681-vidiq-for-instagram
- https://support.vidiq.com/en/articles/8058473-vidiq-enterprise-introduction
- https://support.vidiq.com/en/articles/11186522-granting-read-only-access-to-team-members-enterprise-plan
- https://support.vidiq.com/en/articles/11187169-how-to-invite-users-to-your-vidiq-enterprise-plan
- https://support.vidiq.com/en/articles/11328085-top-5-boost-features-every-1-1-coaching-creator-should-be-using
- https://support.vidiq.com/en/collections/4327400-mastering-vidiq-tools

### Официальные vidIQ — vidiq.com
- https://vidiq.com/plans/
- https://vidiq.com/extension/
- https://vidiq.com/features/scorecard/
- https://vidiq.com/features/keyword-tools/
- https://vidiq.com/features/outliers/
- https://vidiq.com/features/most-viewed/
- https://vidiq.com/features/channel-audit/
- https://vidiq.com/features/trend-alerts/
- https://vidiq.com/features/daily-ideas/
- https://vidiq.com/features/achievements/
- https://vidiq.com/features/ai-youtube-coach/
- https://vidiq.com/features/script-writer/
- https://vidiq.com/generate/
- https://vidiq.com/ai-title-generator/
- https://vidiq.com/ai-description-generator/
- https://vidiq.com/ai-video-generator/
- https://vidiq.com/youtube-thumbnail-maker/
- https://vidiq.com/audit/
- https://vidiq.com/mobile-app/
- https://vidiq.com/tiktok/
- https://vidiq.com/youtube-stats/
- https://vidiq.com/compare/vidiq-vs-keywords-everywhere/
- https://vidiq.com/blog/post/vidiq-tools-youtube/
- https://vidiq.com/blog/post/vidiq-outliers-tool/
- https://vidiq.com/blog/post/vidiq-remix/
- https://vidiq.com/blog/post/youtube-new-keyword-research-tool/
- https://vidiq.com/blog/post/vidiq-pro-and-youtube-keyword-tool/
- https://vidiq.com/blog/post/summer-2025-drop/
- https://vidiq.com/blog/post/vidiq-for-instagram/
- https://vidiq.com/blog/post/chatgpt-youtube-vidiq-ai-coach/
- https://vidiq.com/blog/post/youtube-comment-filters-with-vidiq/
- https://vidiq.com/blog/post/youtube-launches-new-thumbnail-testing-tool/
- https://vidiq.com/blog/post/find-your-popular-youtube-subscribers/
- https://vidiq.com/blog/post/your-complete-youtube-channel-audit-guide-with-vidiq/
- https://vidiq.com/blog/category/product-updates/
- https://enterprise.vidiq.com/packages

### Магазины расширений / приложений
- https://chromewebstore.google.com/detail/vidiq-vision-for-youtube/pachckjkecffpdphbpmfolblodfkgbhl
- https://addons.mozilla.org/en-US/firefox/addon/vidiq-vision-youtube/
- https://www.crx4chrome.com/extensions/pachckjkecffpdphbpmfolblodfkgbhl/
- https://apps.apple.com/us/app/vidiq-for-youtube-instagram/id1458235345
- https://play.google.com/store/apps/details?id=com.vidiq.app

### Сторонние обзоры и сравнения (2026)
- https://1of10.com/blog/vidiq-review/
- https://1of10.com/blog/vidiq-pricing/
- https://1of10.com/blog/1of10-vs-outlierkit/
- https://1of10.com/compare/viewstats-alternatives
- https://outlierkit.com/resources/vidiq-pricing/
- https://outlierkit.com/resources/vidiq-review/
- https://outlierkit.com/resources/youtube-analytics-chrome-extension/
- https://outlierkit.com/resources/vidiq-vs-tubebuddy/
- https://outlierkit.com/resources/vidiq-vs-viewstats/
- https://outlierkit.com/resources/outlierkit-vs-vidiq/
- https://outlierkit.com/resources/viewstats-chrome-extension/
- https://outlierkit.com/resources/outlier-scores/
- https://outlierkit.com/resources/vidiq-mcp/
- https://outlierkit.com/blog/best-youtube-outlier-finder-tools
- https://outlierkit.com/blog/best-youtube-keyword-research-tools
- https://outlierkit.com/blog/vidiq-alternatives
- https://outlierkit.com/blog/1of10-vs-vidiq
- https://comparedge.com/tools/vidiq-ai/pricing
- https://top50aitools.com/pricing/vidiq
- https://onetube.io/blog/vidiq-pricing-2026
- https://www.toolsforhumans.ai/ai-tools/vidiq
- https://www.tubeanalytics.net/blog/vidiq-free-vs-paid
- https://www.g2.com/products/vidiq/pricing
- https://www.trustradius.com/products/vidiq/pricing
- https://alanspicer.com/vidiq-chrome-extension-guide/
- https://alanspicer.com/vidiq-seo-score-explained/
- https://alanspicer.com/vidiq-outlier-score-vph-explained/
- https://alanspicer.com/vidiq-trend-alerts-guide/
- https://alanspicer.com/vidiq-best-time-to-post/
- https://alanspicer.com/vidiq-pricing-2026/
- https://alanspicer.com/ultimate-guide-vidiq-2026/
- https://ahrefs.com/blog/fr/youtube-keyword-tools
- https://backlinko.com/hub/content/vidiq
- https://kripeshadwani.com/vidiq-review/
- https://vidailab.com/vidiq-ai-coach-2026/
- https://vidailab.com/vidiq-ai-coach-youtube-growth/
- https://sanishtech.com/reviews/vidiq-review/
- https://tecdigi.net/vidiq-review-2026/
- https://ytgrowth.io/blog/vidiq-review
- https://thumbnailtest.com/guides/vidiq-vs-tubebuddy/
- https://thumbnailtest.com/guides/vidiq-vs-thumbnailtest/
- https://www.tubebuddy.com/blog/tubebuddy-vs-vidiq/
- https://www.commentshark.com/blog/commentshark-vs-vidiq
- https://marketingagent.blog/2026/05/11/tutorial-viral-youtube-growth-with-vidiq-outlier-detection/
- https://www.anygen.io/showcase/vidiq-extension/index.html
- https://humbleandbrag.com/blog/best-youtube-channel-tools
- https://tubeast.com/can-vidiq-bulk-change-description
- https://gregpreece.com/articles/opusclip-vs-vidiq

### Отзывы пользователей
- https://www.trustpilot.com/review/vidiq.com
- https://www.trustpilot.com/review/app.vidiq.com
- https://www.capterra.com/p/182133/vidIQ/reviews/
- https://www.g2.com/products/vidiq/reviews
- https://www.blackhatworld.com/seo/is-vidiq-search-volume-reliable.1041675/
- https://saasflags.com/products/vidiq/is-it-a-scam
- https://yttalk.com/threads/vidiq-question.247812/
