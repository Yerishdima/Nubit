# vidIQ — полная инвентаризация функций, лимитов и цен (9 октября 2026)

> Цель: исчерпывающий и актуальный перечень функций vidIQ (расширение, YouTube Studio, веб-приложение, мобильное приложение), тарифы и лимиты 2026 года, известные принципы расчёта метрик, слабые места и краткий контекст по конкурентам — как основа для проектирования конкурирующего продукта.
>
> Метод: сначала ~50 поисковых запросов (сниппеты), затем — **прямое чтение первоисточников через curl**: весь help-центр support.vidiq.com (коллекции «Mastering vidIQ Tools», «Getting Started», «Enterprise», «Coaching», «Account & Billing» — 55 статей), страницы vidiq.com (/plans с встроенным JSON цен, /features, /extension, /features/*), enterprise.vidiq.com/packages. Всё, что подтверждено только сторонними обзорами или где источники расходятся, помечено **(unverified)** с указанием конфликтующих значений. Даты обновления support-статей указаны там, где важны (часть статей 2020–2024 гг. и может не отражать текущий UI).

---

## Summary (кратко)

1. vidIQ — три поверхности: браузерное расширение **vidIQ Vision for YouTube** (Chrome / Firefox / Edge; «20M+ creators», рейтинг 4.6 при 70K+ отзывов по данным vidiq.com), плавающая панель внутри **YouTube Studio** и **веб-приложение** app.vidiq.com + мобильное приложение iOS/Android («vidIQ for YouTube & Instagram»). С 2026 г. расширение работает и на Instagram.
2. Ядро расширения — **Scorecard** на странице просмотра (вкладки Views / Overview / AI Coach), **Shorts Scorecard**, VPH и Outlier Score под видео на главной и в сетках каналов, кнопка **Remix**, Comment Tool, Advanced Embed / Add Competitor, Tools menu (Daily Ideas, Keywords, Competitors, Trend Alerts, Most Viewed, Channel Audit, Achievements).
3. В Studio: **Optimize Score** 0–100 с официальными весами (Title 48 %, Thumbnail 48 %, Description 2,5 %, Tags 1 %, Scheduled Post Time 0,5 %), Title Score 1–100, Title / Description / Thumbnail / Tag Suggestions, Magic Fill, Keyword Inspector, Tag Templates и перевод тегов, Best Time to Post («Schedule Post»), Thumbnail Preview (симулятор Home / Search / Suggested / Mobile), Controversial Keywords, Promote on Instagram Story.
4. Веб-приложение: Home Feed (Insight Cards), Optimize (Title / Thumbnail / SEO / Review с мультимодальным Content Score), AI Coach (Fast / Deep Thinking / Max Mode), Research (Keywords; Outliers с вкладками Videos / Shorts / Channels / Thumbnails), Daily Ideas, Competitors, Subscribers, Learn, Create / Blueprints, Thumbnails, Clipping, Script Writer, Generate, Video Generator, Shorts Generator, History, vidIQ MCP, vidIQ for Instagram.
5. Монетизация — **единый пул AI-кредитов** + per-plan лимиты. Кредиты: Free 150; Boost 2 000 / 2 500 / 3 000 (1/2/3 канала); Max 6 000 / 8 000 / 10 000; Coaching 6 000; Enterprise 20 000 на пользователя. Стоимость действий (официально): AI Coach 10 / 25 / 35 за сообщение, превью 22, Clipping 9 за минуту входного видео, Shorts Generator 20 за секунду, скрипт 1/мин, заголовки 3, описание 1, Remix 3, AI-ответ на комментарий 1.
6. Цены (USD, из JSON страницы /plans, 09.10.2026): Free $0; **Boost $19/мес или $199/год** (2 канала $29 / $276; 3 канала $39 / $372); **Max $49/мес или $468/год** (2 канала $89 / $852; 3 канала $129 / $1 236); **Boost + 1:1 Chat Coaching $199/мес или $1 188/год**; **Coaching VIP $399/мес или $3 830/год**; **Enterprise $799/мес**, **Enterprise Pro $2 500/мес**, Enterprise Pro + Strategy — по запросу. Pro ($5/мес, $60/год) — legacy, на странице не показывается.
7. Жёсткие лимиты Free (официальная таблица): 3 результата/поиск в Keywords, 8 в Outliers, 3 Daily Ideas/день, 3 Customized Ideas за всё время, 3 конкурента, 3 Blueprint, Search Panel 3 результата, Keyword Inspector 1 ключ, Recommended Tags 3, Ranked Tag Score до 3 тегов/видео, Trending Videos 6, CSV-экспорт 10 видео, Channel Audit 3 секции, Feed-карточки с 12-часовой задержкой; нет Best Time to Post, Subscriber Analysis, Controversial Keywords, переводов; водяной знак на клипах и Stories.
8. Формулы не публикуются, но раскрыты принципы: **SEO Score = 50 % «Actionable» (чеклист: ≥5 тегов, объём тегов, ≥5 ключей в заголовке, ≥5 в описании, Triple Keywords) + 50 % «Performance»** (ranked tags, high-volume tags); **Keyword Overall Score = f(Competition, Search Volume за 30 дней)** с цветными диапазонами 0–19 / 20–39 / 40–59 / 60–79 / 80–100 и относительными брекетами объёма; **Outlier Score = просмотры видео / средние просмотры канала за сопоставимый период** (10 000 при среднем 1 000 = 10x; цвета <2x / 2–5x / 5–10x / >10x); **VPH = view velocity**, обновляется во времени; **Engagement (TER) = (лайки + комментарии + шеры) / просмотры**, 2–5 % — норма.
9. Главные слабости: неточные/нестабильные объёмы поиска и отсутствие фильтра по стране в Keywords, «общие» и иногда вымышленные ответы AI Coach (vidIQ сам документирует фабрикации, потерю контекста и «поддакивание»), быстро сгорающие кредиты без возврата за неудачный результат, paywall creep, задержки данных (аналитика до 48 ч, дашборд 24 ч), отсутствие собственного A/B-теста для creators (только в Enterprise Pro), нет bulk-редактирования тегов, нет паузы/возвратов, Trustpilot ≈ 3.8–4.2.
10. Конкуренты закрывают эти дыры: TubeBuddy (A/B, bulk-инструменты, дешевле), 1of10 (outlier-бейджи + AI-упаковка), OutlierKit (нишевой outlier-анализ, бесплатное расширение), ViewStats (MrBeast; outliers, A/B, история превью, настоящий free-tier).

---

## 1. Расширение на YouTube (watch / search / home / channel)

Официальное название — **vidIQ Vision for YouTube** (сертифицировано для Chrome, Firefox, Edge; Safari/Brave не поддерживаются). Колонка Free/Paid построена по официальной таблице «Features & Credits by Plan» (обновлена 08.10.2026) и support-статьям.

### 1.1. Страница просмотра — vidIQ Scorecard (правая панель)

| Функция (EN) | Что показывает | Free / Paid | Источник |
|---|---|---|---|
| **Video Scorecard** (3 вкладки: Views, Overview, AI Coach) | Панель справа от плеера; данные по видео, по каналу и чат | Free (все тарифы) | https://support.vidiq.com/en/articles/9696241-the-vidiq-scorecard ; https://support.vidiq.com/en/articles/13928456-features-credits-by-plan |
| Views tab → **Engagement** | «Discovered engagement» как процент от общего числа просмотров | Free | https://support.vidiq.com/en/articles/9696241-the-vidiq-scorecard |
| Views tab → **Outlier** | Просмотры видео относительно средних просмотров канала за сопоставимый период (множитель) | Free | там же |
| Views tab → **VPH (Views Per Hour)** | «Трендит ли видео прямо сейчас» | Free | там же; https://support.vidiq.com/en/articles/108672-what-is-vph-views-per-hour |
| Views tab → **Views Graph** | Просмотры за последние 24 ч / первые 7 дней / первые 28 дней / всё время | Free | https://support.vidiq.com/en/articles/9696241-the-vidiq-scorecard |
| Views tab → **Thumbnail and Title changes** | Смены превью и заголовка отмечены на графике и в блоке под ним; можно скачать прошлые превью и увидеть даты их публикации | Free **(глубина истории по тарифу — unverified)** | там же; https://vidiq.com/features/scorecard/ |
| **Real-Time Stats** | Живые счётчики (просмотры/лайки/комментарии) — в таблице планов отдельная строка «Real-Time Stats ✔» | Free | https://support.vidiq.com/en/articles/13928456-features-credits-by-plan |
| Overview tab → Channel picture / Name / Handle | Идентификация канала | Free | https://support.vidiq.com/en/articles/9696241-the-vidiq-scorecard |
| Overview tab → **Total Videos Uploaded**, **Channel Age** | Число публичных видео; возраст канала | Free | там же |
| Overview tab → **Subscribers + historical graph**, **Views + historical graph** | Тоталы и графики роста подписчиков и публичных просмотров | Free | там же |
| Overview tab → **Controversial Keywords** | Спорные/чувствительные слова в Title / Description / Tags: слово, характер проблемы, где находится («защита от демонетизации») | **Boost+** (в статье «Boost only»; в таблице — Boost/Max/Coaching) | там же; https://support.vidiq.com/en/articles/13928456-features-credits-by-plan |
| Overview tab → **Reddit Engagement** | Апвоуты, комментарии, посты на Reddit по видео/теме | Free | https://support.vidiq.com/en/articles/9696241-the-vidiq-scorecard |
| **Social** (Facebook + Reddit) | Feature page: «engagement across YouTube, Facebook, and Reddit»; Twitter в актуальных источниках не упоминается | Free | https://vidiq.com/features/scorecard/ |
| Overview tab → **Channel Tags** | Теги канала, заданные владельцем | Free | https://support.vidiq.com/en/articles/9696241-the-vidiq-scorecard |
| Overview tab → **Video Tags** с **Ranked Tag Score** | Теги видео, их ranking-оценка и позиция видео в поиске YouTube по тегу (#2 = второе место в выдаче) | Free: до 3 ранжированных тегов на видео; paid: без лимита | там же; https://support.vidiq.com/en/articles/13928456-features-credits-by-plan |
| **SEO Score** (при наведении — разбивка) | «Насколько полно оптимизировано видео»: 50 % Actionable (tag count, tag volume, keywords in title/description, triple keywords) + 50 % Performance (ranked tags, high-volume tags); feature page упоминает «15-point optimization checklist» | Free | https://support.vidiq.com/en/articles/9696241-the-vidiq-scorecard ; https://vidiq.com/features/scorecard/ |
| «Best tags» / сравнение тегов с популярными | Feature page: «see how your tags perform against popular ones»; отдельного блока «Best tags» в support-доках нет | Free **(unverified как отдельный блок)** | https://vidiq.com/features/scorecard/ |
| **Channel Analytics** (в Scorecard) | Feature page: «total views, subscribers, and daily averages» — понять, разовый ли это хит | Free | https://vidiq.com/features/scorecard/ |
| **Historical tab** | Feature page: таймлайн просмотров/engagement с момента загрузки | Free **(unverified: в support-статье отдельной вкладки нет)** | https://vidiq.com/features/scorecard/ |
| **AI Coach tab** | Пресеты для текущего видео: «How do I get more subscribers?», «Give me 3 similar ideas», «Summarize this video», «Analyze the hook», «Why did this video do well/poorly?»; тратит кредиты | Free (150 кредитов/мес) | https://support.vidiq.com/en/articles/9696241-the-vidiq-scorecard |
| **vidIQ Score** (legacy) | «Вероятность продвижения видео в Related / Search / Recommended» — есть на vidiq.com/extension и в Most Viewed, но не в Scorecard-доках | **(unverified, legacy)** | https://vidiq.com/extension/ ; https://support.vidiq.com/en/articles/8619340-most-viewed |
| **Advanced Embed & Add Competitors** (под видео) | Расширенная ссылка для embed; добавить канал в Competitors одним кликом | Free | https://support.vidiq.com/en/articles/9868197-vidiq-extension-overview |
| **Comment Tool** (под видео) | Фильтрация комментариев; AI-ответы («Comments Replies» 1 кредит, «Comments Analysis» — переменная стоимость) | Free + кредиты | там же; https://support.vidiq.com/en/articles/13928456-features-credits-by-plan |
| **Remix** (рядом с кнопкой Subscribe) | Генерация заголовков/идей на основе этого видео под ваши темы (см. 1.3) | Free 3/день; paid без лимита; 3 кредита за использование | https://support.vidiq.com/en/articles/9899331-remix |

### 1.2. Shorts Scorecard (в плеере Shorts, с лета 2025)

| Функция (EN) | Что показывает | Free / Paid | Источник |
|---|---|---|---|
| Views, **Outlier Score** | Просмотры и отклонение от типичных просмотров канала | Free | https://support.vidiq.com/en/articles/10453678-the-vidiq-shorts-scorecard |
| **Views Graph** | 24 ч / первые 7 дней / первые 28 дней / всё время | Free | там же |
| Upload Date, **VPH**, **Engagement Rate (%)** | Дата, скорость набора, вовлечённость | Free | там же |
| Remix | Переработка Short (сама функция Remix — только long-form, см. 1.3) | Free | там же |
| **Channel Information** (по клику на имя) | Имя и дата создания; просмотры за 28 дней и всё время; подписчики за 28 дней и всё время; Monthly Uploads (публичные загрузки за 30 дней, Shorts + long-form); Total uploads | Free | там же |
| Ограничение | Shorts с ≈50 и менее просмотрами могут не иметь данных; панель можно свернуть | — | там же |

### 1.3. Главная (home feed), результаты поиска, страницы каналов

| Функция (EN) | Что показывает | Free / Paid | Источник |
|---|---|---|---|
| **Tools Menu** | Прямой доступ к Daily Ideas, Keyword Research, Competitors, Trend Alerts, Most Viewed, Channel Audit, Achievements | Free (вход), функции — по тарифу | https://support.vidiq.com/en/articles/9868197-vidiq-extension-overview |
| **Live Analytics** | Живая аналитика своего канала из панели | Free | там же |
| **Achievements** (иконка трофея) | Последние достижения канала | Free | там же |
| **Views Per Hour** под видео | VPH под большинством видео на главной | Free (все тарифы) | там же; https://support.vidiq.com/en/articles/13928456-features-credits-by-plan |
| **Outlier Score** под видео | Под «исключительными» видео — множитель относительно среднего канала; в Studio и на YouTube отображается рядом с датой публикации/просмотрами; цвета: чёрный <2x, синий 2–5x, фиолетовый 5–10x, красный >10x | Free (все тарифы) | https://support.vidiq.com/en/articles/9868197-vidiq-extension-overview ; https://support.vidiq.com/en/articles/9660010-outliers |
| **Remix** (hover на карточке) | Появляется на карточках главной, выдачи, страниц каналов; при первом запуске — настройка тем (или темы из Create); окно: Preferences, Refresh, Copy, Generate (→ веб-приложение), Keyword Score рядом с каждым заголовком; только long-form | Free 3/день; paid без лимита; 3 кредита | https://support.vidiq.com/en/articles/9899331-remix |
| **Search Panel** (панель на странице выдачи) | Официальная таблица: «Search Panel: 3 results (Free) / Unlimited»; «Top Keywords: 3 / Unlimited»; «Trending Videos: 6 / Unlimited»; «Filters: Limited / Full Access». Содержимое по блогам vidIQ: метрики ключа, трендовые видео по запросу, related search words, какой автор чаще в выдаче | Free (3 результата) / paid | https://support.vidiq.com/en/articles/13928456-features-credits-by-plan ; https://vidiq.com/blog/post/vidiq-tools-youtube/ |
| Keyword score / Search volume / Competition в выдаче | Keyword Inspector «появляется прямо в YouTube»: search volume, competition, related queries | Free: 1 ключ за поиск; paid: 5 | https://vidiq.com/features/keyword-tools/ ; https://support.vidiq.com/en/articles/13928456-features-credits-by-plan |
| **Competitor Insights / Inline tags** | «See what tags your competitors are using directly in YouTube search results. Copy and adapt» | Free (ограничено) | https://vidiq.com/features/keyword-tools/ |
| **Compare Thumbnail in Search** | Сравнение своего превью прямо в выдаче (Thumbnail Preview, см. 2) | Free: 3 за всё время; paid: без лимита | https://support.vidiq.com/en/articles/13928456-features-credits-by-plan |
| **CSV Export** | Экспорт данных по видео из расширения | Free: 10 видео; paid: без лимита | там же |
| **Title & Description Translations** | Перевод заголовков/описаний | Free: нет; paid: 500 | там же |
| Query trend graph в расширении | Официально только «trend direction» и «Rising Keywords» (рост в %); 12-месячного графика в документации нет | **(unverified / скорее отсутствует)** | https://vidiq.com/features/keyword-tools/ |
| «Keywords in title» highlighting в выдаче | Не найдено ни в одном источнике | **(unverified / скорее отсутствует)** | — |
| Страница канала: Channel Research / Trending Videos | Сетка канала с VPH и Outlier-бейджами; «Trending Videos» (6 на Free); Remix на карточках | Free (6) / paid | https://support.vidiq.com/en/articles/13928456-features-credits-by-plan ; https://support.vidiq.com/en/articles/9899331-remix |
| Instagram (расширение) | Скорость воспроизведения Reels 1x–2x; Outlier Score (лайки vs типичные лайки автора) и VPH (по plays и возрасту) на Reels и сетках; Discovery-фильтры (views, followers, likes, comments, VPH, outlier, дата) и сортировки; создание Stories на десктопе | Free (часть пресетов/метрик — login или paid); водяной знак на Stories на Free | https://support.vidiq.com/en/articles/14975681-vidiq-for-instagram |

---

## 2. Помощники в YouTube Studio (загрузка / редактирование)

Расширение добавляет **плавающую панель (floating toolbar)**: слева при загрузке, снизу при редактировании. Официальный список инструментов (статья от 04.03.2026): Optimize Score, Title Suggestions, Description Suggestions, Thumbnail Suggestions, Tag Suggestions, Best Time to Post, Magic Fill, Description Suggestion Preferences; плюс Thumbnail Preview, SEO Scorecard, Controversial Keyword, Search (preview rank), Keyword Inspector, Boost This Video, Recommended Tags, Promote on Instagram Story. Рекомендация vidIQ: дождаться окончания обработки видео; для видео без речи — добавить контекст вручную.

| Функция (EN) | Что показывает / делает | Free / Paid | Источник |
|---|---|---|---|
| **Optimize Score** (иконка IQ) | 0–100 в реальном времени; веса: Title 48 %, Thumbnail 48 %, Description 2,5 %, Tags 1 %, Scheduled Post Time 0,5 % (title + thumbnail = 96 %); обновляется при изменениях; клик по иконке — разбивка | Free (все тарифы) | https://support.vidiq.com/en/articles/13892020-uploading-and-editing-on-youtube-with-vidiq |
| **SEO Scorecard** (чеклист перед публикацией) | «Actionable insights»: Tag count ≥5; Tag volume (теги с высоким volume); Keywords in title ≥5; Keywords in description ≥5; Triple Keywords (рекомендованные ключи одновременно в заголовке, тегах и описании); + проверка Controversial Keyword | Free (Controversial — paid) | https://support.vidiq.com/en/articles/9868197-vidiq-extension-overview ; https://support.vidiq.com/en/articles/9696241-the-vidiq-scorecard |
| **Title Score** | 1–100 в правом верхнем углу поля заголовка, обновляется при вводе; цвета 0–40 красный / 41–80 жёлтый / 81–100 зелёный; счётчик символов | Free | https://support.vidiq.com/en/articles/10099905-title-suggestions ; https://support.vidiq.com/en/articles/8972670-optimize |
| **Title Suggestions** | 4 AI-варианта по введённому заголовку, у каждого свой score; **Suggestion Preferences**: описание видео (можно на другом языке), Target Keyword, Emotion (None, Comparison, Credibility, Curiosity, Desire, Extreme, List, Negativity, Question, Time); refresh | Free (базово); «больше заголовков и фидбек» — paid | https://support.vidiq.com/en/articles/10099905-title-suggestions |
| **Description Suggestions / AI Description Generator** | Ключи до 100 символов через запятую + Recommended Keywords из тегов → 3 варианта с учётом заголовка; Insert / Copy / Change Keywords / refresh; переключатель **Highlight Controversial Keywords**; **Description Suggestion Preferences** (о чём видео, целевые ключи, эмоция); в подсказках подсвечиваются ключи с keyword score | 1 кредит за описание | https://support.vidiq.com/en/articles/10106669-ai-description-generator ; https://support.vidiq.com/en/articles/13892020-uploading-and-editing-on-youtube-with-vidiq |
| **AI Thumbnail Suggestions / AI Thumbnail Builder** | Три режима: **Quick Generate** (автоматически по контенту, визуальным паттернам и performance-данным), **Generate New Concept** (открывает Thumbnail Generator: текст, свои изображения, кадры из видео, прошлые превью), **Start from a Frame** (Capture Frame → AI-вариации); Tweak → Thumbnail Editor (текст: шрифт, цвет, яркость, обводка; изображения: позиция, прозрачность, удаление фона) | 22 кредита за генерацию/регенерацию/правку | https://support.vidiq.com/en/articles/13892020-uploading-and-editing-on-youtube-with-vidiq ; https://support.vidiq.com/en/articles/10099973-ai-thumbnail-builder |
| **Tag Suggestions / Recommended Tags** | Список по кнопке **Boost This Video** (иначе фиолетовый замок); «+» добавляет тег; сортировка: Relevancy (по умолчанию), Overall (keyword score), vidIQ Keyword Volume, vidIQ Competition Score; **Tag Templates** (сохранённые наборы), **Translate** (источник/auto-detect → целевой язык), **Keyword Inspector**, **Copy tags**, Refresh, ручной ввод | Free/Pro: только 3 тега по умолчанию, без refresh и без «Boost This Video»; Boost+: без лимита | https://support.vidiq.com/en/articles/10106651-recommended-tags ; https://support.vidiq.com/en/articles/13928456-features-credits-by-plan |
| **Keyword Inspector** | Исследование отдельного тега: search volume, competition, related queries; «works similarly to Keyword Research tool» | Free: 1 ключ/поиск; paid: 5 | https://support.vidiq.com/en/articles/10106651-recommended-tags ; https://support.vidiq.com/en/articles/13928456-features-credits-by-plan |
| **Magic Fill** | Один клик: анализ видео → заполнение Title, Description, Tags AI-подсказками; всё редактируемо до сохранения | Кредиты **(ставка не опубликована; unverified)** | https://support.vidiq.com/en/articles/13892020-uploading-and-editing-on-youtube-with-vidiq |
| **Search** (preview how you rank) | «Preview how you rank by the chosen keyword» | Free **(unverified)** | https://support.vidiq.com/en/articles/9868197-vidiq-extension-overview |
| **Thumbnail Preview** (upload и Details tab) | Реалистичный макет YouTube. Слева: загрузить/сгенерировать превью, несколько вариантов заголовка, выбор канала, **Choose competition** (свои видео / трендовые / по поисковому запросу / конкуренты по имени или URL / коллекции), full-screen. Снизу: **View selector** (Home / Search / Suggested / Mobile / Thumbnail), **Position** (First / Third / Random), Shuffle, Dark Mode, **Save Changes** (сохраняет title/метаданные/превью прямо в видео), Close | Free: «Compare Thumbnail in Search» 3 за всё время; paid: без лимита | https://support.vidiq.com/en/articles/9829132-thumbnail-preview ; https://support.vidiq.com/en/articles/13928456-features-credits-by-plan |
| **Best Time to Post** («Schedule Post») | Анализ активности аудитории → окно пиковой активности и рекомендуемое время в локальном часовом поясе; в Studio — раздел в Details видео; в веб — вкладка Subscribers; совет избегать :00 и :30 и публиковать до пика; данные появляются через несколько дней; отличие от YouTube «When your viewers are on YouTube» — учитывает «most active and engaged»; **собственного планировщика нет** | **Boost+** (на Free недоступно) | https://support.vidiq.com/en/articles/108673-best-time-to-post ; https://support.vidiq.com/en/articles/13928456-features-credits-by-plan |
| **Controversial Keyword** check | Проверка спорных слов на странице загрузки | Boost+ | https://support.vidiq.com/en/articles/9868197-vidiq-extension-overview |
| **Promote on Instagram Story** | На странице Details/Edit видео: Story из клипа (1–60 с, по умолчанию 15 с) или из превью (с заголовком и ссылкой «Watch full video»); открывает редактор Stories на Instagram.com | Free (с водяным знаком) / paid | https://support.vidiq.com/en/articles/14975681-vidiq-for-instagram |
| End screens / Cards checks | На странице загрузки нет; в Channel Audit есть «Videos Without Cards / End Screens», End screen Click Rates, Card Click Rates | см. 3 | https://support.vidiq.com/en/articles/10141815-channel-audit |
| Bulk editing | В актуальной документации **нет** bulk-редактора; старый блог упоминал Video Manager с массовыми опциями и «Bulk Download Meta» | **(unverified / legacy)** | https://vidiq.com/blog/post/vidiq-tools-youtube/ |
| A/B testing | Для creators-тарифов отсутствует; «A/B tests» есть только в **Enterprise Pro** ($2 500/мес) | Enterprise Pro | https://support.vidiq.com/en/articles/8058473-vidiq-enterprise-introduction |

---

## 3. Веб-приложение (app.vidiq.com) и мобильное приложение

Структура дашборда (статья обновлена ~сентябрь 2026): левая панель — **Home** (Feed), **Optimize**, **Chat** (AI Coach), **Research** (Keywords + Outliers), **More Tools** (Daily Ideas, Competitors, Subscribers, Learn, Create, Thumbnails, Clipping, Scriptwriter, Generate), **History**; внизу — аватар с Plans / Account Settings / Channel Settings / Affiliate Center / Help / язык / Dark Mode / Channels.

| Функция (EN) | Что показывает / делает | Free / Paid | Источник |
|---|---|---|---|
| **Home / Feed (Insight Cards)** | Вверху — подписчики и Total Public Views; карточки: **Title Suggestions**, **Thumbnail Insights**, **Add Missing Tags**, **Add Missing Descriptions** (готовое описание, публикуется из карточки), **Trending Keywords**, **Niche Outliers**, **New Traffic From Related Videos**, **Milestones & Achievements**; действия: Apply/Publish, Regenerate, Ask vidIQ (AI Coach с контекстом карточки), Dismiss (навсегда) | Free: новые карточки заблокированы на 12 ч (таймер); paid: сразу | https://support.vidiq.com/en/articles/13188399-feed-cards-breakdown ; https://support.vidiq.com/en/articles/9820526-navigating-your-new-dashboard |
| **Daily Ideas — Personalized** | AI анализирует ваши видео и похожие каналы; у каждой идеи **View Prediction** (Very High / High / Medium / Low) и сортировка по нему; Save (💙) / Dismiss (❌), вкладки Saved / Dismissed, Restore All; новому каналу — до 24 ч; оптимизировано под английский | Free 3/день; Pro (legacy) 10/день; Boost / Max / Coaching 50/день | https://support.vidiq.com/en/articles/7993395-personalized-and-customized-video-ideas ; https://support.vidiq.com/en/articles/13928456-features-credits-by-plan |
| **Daily Ideas — Customized** | Идеи по заданному ключу + данным канала; только веб (внизу страницы Ideas) | Free: 3 поиска за всё время (по 3 результата); Pro: 10 за всё время; Boost+: без лимита (по 10 результатов) | там же |
| **AI Coach** (Chat / New Chat) | Режимы: **Fast** (10 кр.; данные канала, детали видео, поиск YouTube), **Deep Thinking** (25 кр.; + competitor insights, продвинутые заголовки, стратегия), **Max Mode** (35 кр.; аудиты, конкурентные исследования, многослойные данные; только Max/Coaching). Пресеты: Give me video ideas, Get more views, Channel audit, Review my latest video, AI Coach abilities*, Current Trends*, Competitor Analysis*, vidIQ Tools* (* — только в Deep Thinking). История чатов (переименование/удаление). Вложения: до 50 изображений или 50 reference-видео в час (свои, рекомендованные, трендовые, публичные). Генерация в чате: превью, клипы, AI-видео (по тем же тарифам кредитов). Ограничения: не «смотрит» видео; аналитика с задержкой до 48 ч; не анализирует private/scheduled; Shorts менее точно; без livestreams; память только внутри чата; не помогает с аккаунтом/биллингом | Free (150 кр.) / Boost / Max (Max Mode, «до 3x conversations») | https://support.vidiq.com/en/articles/8017871-ai-coach ; https://support.vidiq.com/en/articles/15195757-getting-the-best-results-from-the-vidiq-ai-coach ; https://vidiq.com/plans/ |
| **Optimize** | Список видео, сортировка Most Recent / Lowest Title Score / Lowest Thumbnail Score; переключатель Long-form / Shorts (для Shorts — только title/description/tags); **Upload & Optimize Draft Videos** (до 2 ГБ и 45 мин). Окно видео: **1. Title** (edit + score + символы, Generate Suggested Titles), **2. Thumbnails** (грейд + резюме + разбивка по критериям: Emotional Triggers, Eye-catching Elements, Uncluttered Composition, Color & Contrast, Curiosity Elicitation, Brevity, Clarity, Facial Features, Resolution & Aspect Ratio, Visual Harmony, Unique Concept, Creative Execution, Topic Match; редактор, генерация, Likeness, Preview: Home / Search / Mobile / Next-to-videos, Light/Dark, Refresh), **3. SEO** (описание и теги), **4. Review** — мультимодальный Content Analysis (≤45 мин): Overall Content Score 0–100, Key Findings, Hook (30–60 с), Re-Hooks & Pacing, B-roll & Editing; кнопка Publish применяет изменения к видео на YouTube (повторная авторизация) | Free: базово; сортировка, доп. заголовки/превью, фидбек по заголовкам и превью, больше видео — paid | https://support.vidiq.com/en/articles/8972670-optimize |
| **Research → Keywords** | Для запроса: **Overall Score**, **Search Volume**, **Competition**; вкладки **Related Keywords** (с Related Score), **Matching Terms**, **Questions**; разделы **Keywords For You** (по данным канала + Manage), **Top Search Terms for Your Channel** (вклад в просмотры и watch time), **Rising Keywords** (Topic-фильтр paid; языки EN/RU/ES/PT; Today / This week / This month), **Saved**; CSV-экспорт и сохранение (только веб); Trending Videos по ключу — **только в мобильном приложении** (в веб — через Outliers); нет фильтра по стране; «-» = ещё не рассчитано | Free: 3 результата/поиск (и по 3 в Keywords For You / Rising / Top Search Terms; по 4 в Related / Matching / Questions); paid: без лимита | https://support.vidiq.com/en/articles/9421214-keywords-research ; https://support.vidiq.com/en/articles/13928456-features-credits-by-plan |
| **Research → Outliers** | Вкладки **Videos / Shorts / Channels / Thumbnails** (поиск превью по фразе или изображению). Фильтры: Outlier Score 0–100+, Views 0–10M+, Subscribers 0–10M+, Views Per Hour 0–1K+, Video Length 0–60+ мин, Publishing Date (This week / This month / Last 3 months / Last 6 months / Last year / All time). Карточка: embed, просмотры, дата, Outlier Score, VPH, Engagement, подписчики, средние просмотры канала. Быстрые действия: Give me ideas (→ Create/Blueprint), Find similar videos, Open in YouTube, Add as competitor | Free: 8 результатов/поиск по таблице планов (**конфликт**: feature page FAQ говорит «up to 6 videos per search»), без Advanced Filters; Boost+: без лимита | https://support.vidiq.com/en/articles/9660010-outliers ; https://support.vidiq.com/en/articles/13928456-features-credits-by-plan ; https://vidiq.com/features/outliers/ |
| **Competitors** | **Top videos from your competitors** (Shorts + long-form): сортировка Views / VPH / Date published; период Past 48 hours / This week / This month / All time; включать/исключать свой канал. **Compare Performance**: 30 / 60 / 12 месяцев (по умолчанию 60); метрики Views, Subscribers, Public Videos, Average Daily Views, Average Subscribers/Day, Average Public Videos/Day; представление Total / Cumulative / Daily (на мобильном: 48h/7d/30d; Subscribers/VPH/Views). **Channel Stats**: просмотры и прирост подписчиков за 7 / 14 / 28 дней + тоталы. Добавление по handle или имени; отрицательные значения при удалении/аудитах YouTube | Free 3; Boost 20; **Max 50**; Coaching 20 | https://support.vidiq.com/en/articles/9456917-competitors ; https://support.vidiq.com/en/articles/13928456-features-credits-by-plan |
| **Subscribers** (Subscriber Analysis) | **Top videos watched by your subscribers**; **Top channels your subscribers are subscribing to** (→ добавить в Competitors); Best Time to Post; данные через 24–48 ч, «Not enough data» для маленьких каналов | Boost+ (нет на Free и Pro) | https://support.vidiq.com/en/articles/9562745-subscribers |
| **Trend Alerts** | Email-алерты по ключевым словам, категориям и конкурентам (Competitor Watch List); порог VPH; частота daily / every 2 days / weekly / monthly; настройки хранятся в аккаунте; настраивается из расширения в Studio | **Boost+ (unverified: feature page «Try Trend Alerts Free», в таблице планов строки нет)** | https://vidiq.com/features/trend-alerts/ |
| **Channel Audit** (через расширение) | **Stats at a Glance** (views / subscribers / minutes за 30, 60, 90 дней с сравнением; смена периода — Boost+). **Content to Double Down On** (за 90 дней): Views, Subscribers Gained, Competitors (by VPH), Total Watch Time, Avg. Watch time, Top Retention %, Top Playlists, Top suggested (non-owned), Top search terms, End screen Click Rates, Card Click Rates. **Content That Could Use Work**: Lowest Avg. Watch time, Lowest Retention %, Lowest Views. **Average Metrics** (30/60/90): Title Length 20–60 симв., Description >300, Tags >200 симв. суммарно, Playlists ≥1, Actionable SEO Score (>40), Videos Without Cards / End Screens / High-Res Thumbnails / Not Added to Playlists, Posting Schedule | Free: 3 секции, ограниченный период; paid: без лимита, до 20 результатов на секцию | https://support.vidiq.com/en/articles/10141815-channel-audit ; https://vidiq.com/features/channel-audit/ |
| **Most Viewed** (только расширение) | С ключом или без; сортировка Views / Views per Hour (velocity) / Engagement Rate; период 48 ч / 7 дней / 30 дней / 6 месяцев; фильтры: Channel Subscribers, Content-Type, Views, Views per Hour, Category, Country, vidIQ Score; у видео: Views, Engagement Rate, vidIQ Score | Free: пред-заполненный список без сортировки/фильтров (страна = текущая); Pro (legacy): фильтры + ключ (FAQ противоречит: «filters only on Boost»); Boost+: всё | https://support.vidiq.com/en/articles/8619340-most-viewed ; https://vidiq.com/features/most-viewed/ |
| **Thumbnails** (AI Thumbnail Maker) | Старт: **Upload a Video** (файл MP4/MOV/QuickTime, ссылка YouTube, рекомендованные/трендовые видео), **Text Input**, **Attach** (своё фото, объекты, несколько лиц, reference-превью; JPEG/PNG). Генерирует 1 превью. Редактор: Text, Image, Sticker (стрелки, подсветки), **Face swap**, Undo/Redo, Download HD; **Smart Commands**; **Likeness** (лицо сразу в генерации) vs Face Swap (после) | 22 кредита за генерацию/регенерацию/правку | https://support.vidiq.com/en/articles/10152120-thumbnails ; https://support.vidiq.com/en/articles/13946970-best-practices-getting-the-most-out-of-vidiq-thumbnails |
| **Title Generator** / **Description Generator** | Standalone-генераторы (также публичные free-страницы vidiq.com/ai-title-generator и др.) | 3 кредита (до 3 заголовков) / 1 кредит | https://support.vidiq.com/en/articles/13928456-features-credits-by-plan |
| **Script Writer** (Create → Script Writer) | Идея → длина 5 / 10 / 15 / 20 / 30 мин → тон (Casual, Informative, Persuasive, Storytelling или свой) → уточняющий вопрос → 3 концепции → генерация 2–3 мин (анализ похожих видео, структура/темп, intro-sections-CTA, фактчек) → правки, регенерация интро, тон-подсказки («Sound more like MrBeast») → Copy / Download .txt / Revert | 1 кредит за минуту длины | https://support.vidiq.com/en/articles/11526189-script-writer |
| **Clipping** | .mp4 до 30 ГБ, 4K, до 10 ч; нужны лица и речь; желательно >3 мин; unlisted/scheduled/public; промпт (опц.); длина Any / Short 20–45 с / Medium 45–60 с / Long 60+ с; язык (Auto, DE, EN, ES, FR, IT, PT, VI, TR, RU, HI, JA); субтитры вкл. по умолчанию + редактор стиля + пресеты; выбор фрагмента ≥30 с; обработка 20–30 мин, email; у клипа **virality score**; Publish to YouTube Shorts (title, description, now/schedule, privacy) / Publish to Instagram (Meta OAuth) / Edit / Download; редактор: Layout (Fill/Fit/Split), Audio dB, Cuts, Captions (18 пресетов, типографика, fill, effects, stroke, max lines, Script-редактирование слов и таймингов); экспорт 1080p вертикально | 9 кредитов/мин входного видео (без выбора фрагмента тарифицируется всё видео); Free — водяной знак; Max «до 11 часов clipping и генераций» | https://support.vidiq.com/en/articles/11519169-clipping ; https://vidiq.com/plans/ |
| **Shorts Generator** | Генерация Shorts; делит пул кредитов с Clipping | **20 кредитов за секунду выходного видео** (таблица от 08.10.2026) | https://support.vidiq.com/en/articles/13928456-features-credits-by-plan |
| **Video Generator** (More tools) | Text-to-video: сцена, стиль, персонаж/спикер, скрипт, тон; длительность 4 / 8 / 12 / 15 с (1–15 с по модели); 720p/1080p portrait и landscape; без редактирования; Publish to YouTube / Remix / Download / Delete; блок по safety/copyright — кредиты возвращаются | Кредиты зависят от модели/длины/разрешения (8-сек клип «well over 100 credits» по MCP-доке) | https://support.vidiq.com/en/articles/13564834-video-generator ; https://support.vidiq.com/en/articles/15082430-vidiq-mcp |
| **Generate** (Create → Generate) | «Make a video about…» → список идей с заголовками, описаниями и превью; **Likeness** («Use my face in thumbnails»). Окно кастомизации: Related Keywords (с Overall score), Title (Refine: shorter/longer/tone), Description (Refine по ключам), Tags (с score), Thumbnail (edit/download), **Hook** (Refine: Challenge / Claim / Fact / Problem / Promise / Question), **Outline** (Hook, Introduction, Problem/Challenge, Exploration/Development, Climax/Key Moment), Script, **Voiceover** (после скрипта; скачать/перегенерировать); Preview thumbnail; вкладки All Videos / Favorites | Free: 3 генерации; paid: без лимита (+ кредиты за медиа) | https://support.vidiq.com/en/articles/9829101-generate |
| **Create / Blueprints** | **Topic of the Day**; Saved Daily Ideas; модули по 4 результата: Start From Your Idea, Jump on Emerging Trends, Answer Your Audience*, Reinvent Viral Videos (с outlier score), More Topics for You, Create Evergreen Content*, Try Out Top Search Terms, Fill Content Gaps* (высокий спрос / низкая конкуренция), Double Down on Your Top Videos, Videos Sending You Traffic* (* — paid); темы канала и «Fine Tune Feed» 1 раз в день. **Blueprint**: Title (≤100 симв.; Optimize рекомендует <70), Generate more titles (paid), до 4 превью, Outline (Duration 3–5 / 5–10 / 10+ мин; Video Type: Basic, Let's Play, Review, News Updates, Listicle, Challenge, Storytelling, Documentary, Commentary, Tutorial, Entertainment, Vlog — paid), Preview + share-ссылка | Free: ограниченные модули, 3 сохранённых blueprint; paid: все модули, без лимита | https://support.vidiq.com/en/articles/8991775-create ; https://support.vidiq.com/en/articles/9010754-blueprints |
| **Learn** | vidIQ Lessons (все тарифы) + Industry Professional Lessons / «Masterclasses from top creators» (paid) | Free / Boost+ | https://support.vidiq.com/en/articles/13928456-features-credits-by-plan ; https://vidiq.com/plans/ |
| **Achievements** | Вехи по subscribers, views, uploads, likes, hours watched, comments; Top Performing Month; Top Performing Video; шеринг в соцсети в один клик; скачивание | Free (все тарифы) | https://vidiq.com/features/achievements/ |
| **History** | Список недавно просмотренных/сгенерированных элементов | Free | https://support.vidiq.com/en/articles/9820526-navigating-your-new-dashboard |
| **vidIQ MCP** | Подключение ChatGPT (официальное приложение), Claude (connector directory или custom connector https://mcp.vidiq.com/mcp), Cursor, VS Code, Gemini CLI, Grok, Perplexity, OpenClaw (API-ключ). База 135M+ каналов и 12B+ видео. Инструменты: keyword research, outliers, channel/video stats, comments, transcripts, title/thumbnail scoring, title ideas, Video Watch (покадровый анализ), Reel Watch, channel analytics; генерация превью, музыки, озвучки, скриптов, клипов, AI-видео; при входе через аккаунт — обновление title/description/tags/privacy/schedule/thumbnail существующих видео, публикация Reels, правка списка конкурентов (с подтверждением). Загрузка нового видео на YouTube — нет; импорт своего MP4 ≤200 МБ | Все тарифы (Free, Boost, Max). Кредиты: 0 — баланс, каналы, статус задач, закладки, список конкурентов, категории трендов, голоса, импорт файла, фидбек; 5 — research-инструменты и обновление видео/превью; 10 — анализ Shorts/Reels; 25 — Video Watch; 22 — превью; 25 — музыка/трек; 14 — озвучка за 1 000 символов; 1/мин — скрипт; 9/мин — клипы; AI-видео — по модели | https://support.vidiq.com/en/articles/15082430-vidiq-mcp |
| **vidIQ for Instagram** | AI Coach по публичному handle (без OAuth): анализ 6 последних Reels по «Five Forces» (The Stop, The Gap, The Momentum, The Feeling, The Reach; Strong/Moderate/Weak), идеи по 7 категориям хуков (Contrarian, Results, Transformation, Experiment, Reactive, Pattern Interrupt, Relatable), обложки Reels; только Reels (не Stories/посты, не TikTok); нет приватной аналитики | Все тарифы (кредиты) | https://support.vidiq.com/en/articles/14975681-vidiq-for-instagram |
| **Mobile app** (iOS / Android) | Ideas, Keywords (объём 0–100, Trending Videos по ключу — только здесь), Outliers, Competitors (48h/7d/30d), Subscribers, Create, Optimize, Coach Chat; Customized Ideas недоступны; AI Coach — более старая версия, чем в вебе | Free / по тарифу | https://support.vidiq.com/en/articles/9421214-keywords-research ; https://support.vidiq.com/en/articles/8017871-ai-coach ; https://vidiq.com/mobile-app/ |
| Scheduled publishing / A/B / bulk | Нет собственного планировщика (только рекомендация времени; Clipping умеет schedule-публикацию Shorts); A/B — только Enterprise Pro; bulk-инструментов нет | — | см. раздел 2 |
| **Enterprise admin** | Multi-channel admin dashboard (обновление ~24 ч), Admin → Members (приглашения, роли, read-only), логотип/favicon, SSO, RBAC, DPA; фичи: Prompt library, Video changelog, Portfolio performance, SEO & GEO intelligence, Slack integration, Claude/ChatGPT integration; Pro: Creator discovery, Separate workspaces (beta), Revival lab, Packaging score, **A/B tests**, Ideas score | Enterprise | https://support.vidiq.com/en/articles/8058473-vidiq-enterprise-introduction ; https://enterprise.vidiq.com/packages |

---

## 4. Тарифы и лимиты 2026

### 4.1. Цены (USD, США; из JSON `customPageData.plans` страницы vidiq.com/plans на 09.10.2026)

Страница показывает карточки Free / Boost / Max / Enterprise с переключателем Monthly / Yearly; число каналов выбирается через dropdown AI-кредитов на карточке Boost/Max (цена меняется). Большинство конфигураций помечены `is_experimental: true` — vidIQ проводит ценовые эксперименты, поэтому сторонние сайты видят разные цифры.

| Тариф | Помесячно | Годовая оплата | Примечания |
|---|---|---|---|
| Free | $0 | $0 | 1 канал; постоянный бесплатный план |
| **Boost** 1 канал | **$19/мес** (`boost-lite-v4-1`) | **$199/год** = $16.58/мес (`boost-v4-2`, флаг **7-дневного free trial**) | 2 000 кредитов |
| Boost 2 канала | $29/мес | $276/год ($23/мес) | 2 500 кредитов |
| Boost 3 канала | $39/мес | $372/год ($31/мес) | 3 000 кредитов (объясняет сторонние «$39/мес за Boost») |
| **Max** 1 канал | **$49/мес** (`max-1-new`) | **$468/год** = $39/мес (`max-2-new`) | 6 000 кредитов |
| Max 2 канала | $89/мес | $852/год ($71/мес) | 8 000 кредитов |
| Max 3 канала | $129/мес | $1 236/год ($103/мес) | 10 000 кредитов |
| **Boost + 1:1 Chat Coaching** | **$199/мес** (`boost-1-on-1-coaching-v2-1`) | **$1 188/год** = $99/мес (`boost-1-on-1-coaching-v3-2`) | Объясняет «$199/мес» на G2 и «$99/мес» в обзорах |
| **Coaching VIP** | $399/мес (`…vip-new-1`) | $3 830/год ≈ $319/мес (`…vip-new-2`) | legacy-варианты $299/мес и $2 388/год |
| «coaching-lite» (экспериментальная) | $49/мес | $468/год | **(unverified — что это за тариф, в документации нет)** |
| Pro (legacy) | $5/мес (`pro-v2-1`) | $60/год (`pro-v3-2`) | На странице не отображается; help-центр ещё описывает лимиты Pro |
| Legacy Boost Plus (5 каналов) | $149/мес | $894/год | не продаётся |
| **Enterprise** | **$799/мес** | — | 3 full-access seats (+$69/мес за seat), до 5 каналов (+$49/мес за канал), 45-мин onboarding, 20 000 кредитов на пользователя |
| **Enterprise Pro** | **$2 500/мес** | — | до 8 seats, до 20 каналов, daily-доступ к стратегу, pro-инструменты (A/B tests и др.) |
| Enterprise Pro + YouTube Strategy | по запросу | — | выделенный стратег, bi-weekly 60-мин звонки, 90-дневный план |

Биллинг: автопродление до отмены; **возвратов за неиспользованные дни нет**; **паузы для обычных планов нет** (для Coaching — пауза до 3 месяцев); при апгрейде остаток зачисляется как кредит; отмена — через «Manage Plan → Cancel Subscription» (полный downgrade-wizard) либо через App Store / Google Play; промокод действует только на первый период.

### 4.2. AI-кредиты

| Тариф | Кредитов/мес | Примечания |
|---|---|---|
| Free | 150 | Обновляются в годовщину регистрации |
| Pro (legacy, 1 канал) | 1 000 | — |
| Boost | 2 000 / 2 500 / 3 000 (1 / 2 / 3 канала) | Один общий баланс на аккаунт, не на канал |
| Max | 6 000 / 8 000 / 10 000 | Top-up (разовые пакеты и auto-refill) — только Max и Coaching, только при оплате через vidIQ (не App Store / Google Play), не во всех регионах |
| Coaching | 6 000 | — |
| Enterprise | 20 000 на пользователя | enterprise.vidiq.com/packages |

Правила: плановые кредиты не переносятся; add-on (купленные/бонусные) не сгорают и тратятся после плановых; расширение «переходит на кредитную систему», часть пользователей ещё видит legacy-лимиты; кредиты за «неидеальный» результат не возвращаются, за технически провалившуюся генерацию — возвращаются.

**Стоимость действий (официальная таблица, 08.10.2026):** AI Coach Regular/Fast 10, Deep Thinking 25, Max Mode 35 (за сообщение); Thumbnails 22 (генерация / регенерация / правка); Script Writer 1 за минуту; Clipping 9 за минуту входного видео; Shorts Generator 20 за секунду выходного видео; Title Generator 3 (до 3 заголовков); Description Generator 1; Remix 3; Comments Replies 1; Comments Analysis — varies. Через MCP дополнительно: research-вызовы 5, Video Watch 25, Shorts/Reels-анализ 10, музыка 25/трек, озвучка 14 за 1 000 символов, обновление видео 5.

### 4.3. Лимиты и гейтинг по тарифам (официальная таблица «Plan-Based Access»)

**Веб-приложение**

| Функция | Free | Boost | Max | Coaching |
|---|---|---|---|---|
| Homepage (Feed) | карточки доступны через 12 ч | полный доступ | полный | полный |
| Keyword Research | 3 результата/поиск | без лимита | без лимита | без лимита |
| Outliers | 8 результатов/поиск | без лимита | без лимита | без лимита |
| Personalized Daily Ideas | 3/день | 50/день | 50/день | 50/день |
| Customized Daily Ideas | 3 за всё время | без лимита | без лимита | без лимита |
| Competitors Tracking | до 3 | до 20 | **до 50** | до 20 |
| Create Modules | ограниченно | все | все | все |
| Blueprints | до 3 сохранённых | без лимита | без лимита | без лимита |
| vidIQ Lessons | ✔ | ✔ | ✔ | ✔ |
| Industry Professional Lessons | — | ✔ | ✔ | ✔ |
| Best Time to Post | — | ✔ | ✔ | ✔ |
| Subscriber Analysis | — | ✔ | ✔ | ✔ |

**Расширение**

| Функция | Free | Boost / Max / Coaching |
|---|---|---|
| Optimize Score, Video Scorecard, Shorts Scorecard, Real-Time Stats, Outlier Score, VPH, Achievements, Advanced Embed | ✔ | ✔ |
| Search Panel | 3 результата | без лимита |
| Filters | ограниченно | полный доступ |
| Keyword Inspector (keywords/search) | 1 | 5 |
| Most Viewed | ограниченные фильтры | без лимита |
| Channel Audit | 3 секции, ограниченный период | без лимита (до 20 результатов/секция) |
| CSV Export | 10 видео | без лимита |
| Trending Videos | 6 | без лимита |
| Top Keywords | 3 | без лимита |
| Recommended Tags | 3 | без лимита |
| Compare Thumbnail in Search | 3 за всё время | без лимита |
| Ranked Tag Score | до 3 на видео | без лимита |
| Controversial Keywords | — | ✔ |
| Title & Description Translations | — | 500 |

**Прочие гейты из статей:** Remix 3/день на Free; Generate 3 генерации на Free; Clipping и Instagram Stories на Free — с водяным знаком; Deep Thinking — «Boost+» по странице планов; Max Mode — Max/Coaching; Max: «up to 3x AI Coach conversations», «5x more powerful Max Mode AI», «up to 11 hours of short clipping and generations»; Trend Alerts — Boost+ **(unverified)**; каналов: Free 1, Boost/Max до 3, Enterprise 5–20+.

**Coaching (детали):** доступно только в US, UK, CA, IE, AU, NZ и для англоязычных каналов; один канал на план; **Chat Coaching** — асинхронно, до 5 сообщений за раунд (видео ≤5 мин, текст ≤750 символов, скриншоты, ссылки YouTube), ответ за 24–48 ч Пн–Пт; **VIP** — + регулярные 30-мин видеозвонки (intro, 30-day check-in, далее каждые 30–60 дней) и безлимитные сообщения; включает Boost 1-channel; смена коуча по запросу; уведомления только push.

---

## 5. Как считаются метрики (что известно официально)

| Метрика | Официально | Сторонние гипотезы (unverified) | Источник |
|---|---|---|---|
| **SEO Score** (Scorecard) | **50 % Actionable + 50 % Performance.** Actionable: Tag count (≥5 тегов), Tag volume (теги с высоким volume), Keywords in title (≥5), Keywords in description (≥5), Triple Keywords (рекомендованные ключи в заголовке + тегах + описании). Performance: «полностью определяется результативностью видео» — **Ranked tags** (видео высоко в выдаче по тегу; #2 = второе место) и **High-volume tags** (тег с высоким спросом, по которому видео в топ-10). Channel Audit советует держать «Actionable SEO Score» >40 и называет Optimize Score более новой метрикой | Alan Spicer: 30/25/20/15 % — оценки автора | https://support.vidiq.com/en/articles/9696241-the-vidiq-scorecard ; https://support.vidiq.com/en/articles/10141815-channel-audit |
| **Optimize Score** (Studio) | 0–100; Title 48 %, Thumbnail 48 %, Description 2,5 %, Tags 1 %, Scheduled Post Time 0,5 % | — | https://support.vidiq.com/en/articles/13892020-uploading-and-editing-on-youtube-with-vidiq |
| **Title Score / Thumbnail Score** | 1–100; формула не раскрыта; цвета 0–40 / 41–80 / 81–100; критерии фидбека по превью: Emotional Triggers, Eye-catching Elements, Uncluttered Composition, Color & Contrast, Curiosity Elicitation, Brevity, Clarity, Facial Features, Resolution & Aspect Ratio, Visual Harmony, Unique Concept, Creative Execution, Topic Match; MCP: «clickability, clarity, viewer appeal» | — | https://support.vidiq.com/en/articles/8972670-optimize ; https://support.vidiq.com/en/articles/15082430-vidiq-mcp |
| **Content Score** (Optimize → Review) | 0–100 «engagement potential» по мультимодальному анализу (визуал, аудио, монтаж); Hook, Re-Hooks & Pacing, B-roll & Editing; ≤45 мин | — | https://support.vidiq.com/en/articles/8972670-optimize |
| **Keyword Overall Score** | 0–100 из **Competition** (видео, конкурирующие за запрос, и объём конкуренции в выдаче; может быть дробным) и **Search Volume** (оценка месячных поисков по скользящему окну 30 дней). Диапазоны: Very low 0–19 (red), Low 20–39 (orange), Medium 40–59 (yellow), High 60–79 (lime), Very High 80–100 (green). Competition — число (веб) и High/Medium/Low. Volume — число (веб), 0–100 (мобайл) и High/Medium/Low; **брекеты относительные**: берётся ключ с максимальным объёмом и от него считаются диапазоны (100 000 и 1 000 000 могут быть в одном High); меняются от месяца к месяцу | Ahrefs: competition учитывает engagement на YouTube/Reddit/Twitter/Facebook, velocity, просмотры конкурентов | https://support.vidiq.com/en/articles/9421214-keywords-research |
| **Related Score** | Топическая близость связанного ключа к исходному | — | там же |
| **Rising Keywords** | «Significant increases in search volume»; на публичной странице — рост в % vs предыдущий период за 7 дней (напр. +21 137 %) | — | https://vidiq.com/features/keyword-tools/ |
| **Outlier Score** | «Просмотры видео / средние просмотры канала за сопоставимый период». Пример: канал со средним 1 000 → видео с 10 000 = **10x**; канал со средним 10M → видео с 10M = 1x. Цвета: <2x чёрный, 2–5x синий, 5–10x фиолетовый, >10x красный. Feature page: «based on views, velocity, and performance vs. a channel's usual baseline». Instagram: лайки Reel vs типичные лайки автора | Spicer: поправка на возраст, тренды ниши; OutlierKit: «стандартные отклонения» — противоречит vidIQ | https://support.vidiq.com/en/articles/9660010-outliers ; https://vidiq.com/features/outliers/ ; https://support.vidiq.com/en/articles/14975681-vidiq-for-instagram |
| **VPH (Views Per Hour)** | «View velocity»; обновляется во времени (старое видео может «разогреваться»); используется как сигнал ранжирования; формула окна не раскрыта. Instagram-VPH: оценка по play count и возрасту | Spicer: «сколько просмотров прямо сейчас» | https://support.vidiq.com/en/articles/108672-what-is-vph-views-per-hour ; https://support.vidiq.com/en/articles/14975681-vidiq-for-instagram |
| **Engagement Rate (TER)** | True Engagement Rate = (лайки + комментарии + шеры) / просмотры; 2–5 % хорошо, выше — отлично, ниже 2 % — проблема; в Scorecard — «discovered engagement as % of total views» | — | https://support.vidiq.com/en/articles/108670-what-s-engagement-rate |
| **View Prediction** (Daily Ideas) | Very High / High / Medium / Low; «predictive modeling» по просмотрам многих чужих видео в первые дни после публикации; относительный, не гарантия | — | https://support.vidiq.com/en/articles/7993395-personalized-and-customized-video-ideas |
| **Virality score** (Clipping) | У каждого клипа; формула не раскрыта | — | https://support.vidiq.com/en/articles/11519169-clipping |
| **Weight Class** (legacy, 2020) | Соотношение размера канала и competition score тега: green — выше конкуренции, yellow — внутри, red — ниже; «перцентиль канала среди YouTube» | — | https://support.vidiq.com/en/articles/438242-the-weight-class |
| **Best Time to Post** | По активности аудитории (когда «most active and engaged»), локальный часовой пояс, агрегировано по всем регионам; несколько дней на сбор | — | https://support.vidiq.com/en/articles/108673-best-time-to-post |
| **Channel Audit пороги** | Title 20–60 символов; Description >300; Tags >200 символов суммарно; ≥1 плейлист; Actionable SEO >40; загрузки ≥1/нед | — | https://support.vidiq.com/en/articles/10141815-channel-audit |
| Instagram «Five Forces» | The Stop / The Gap / The Momentum / The Feeling / The Reach — Strong / Moderate / Weak, сопоставляется с engagement | — | https://support.vidiq.com/en/articles/14975681-vidiq-for-instagram |

Вывод: vidIQ раскрывает **входы и часть весов**, но не формулы. Для конкурирующего продукта воспроизводимы: множитель к среднему/медиане канала за сопоставимый период + цветовые брекеты, VPH по дельтам просмотров, TER, чеклист метаданных, Optimize-подобные веса. Конкурентное преимущество — **прозрачные и воспроизводимые формулы** (vidIQ сам признаёт, что score «directional»).

---

## 6. Слабые места, на которые жалуются пользователи (и которые vidIQ признаёт сам)

| Проблема | Детали | Источник |
|---|---|---|
| Объём поиска неточен/нестабилен | Пользователь на Boost видел 3 разных значения одного ключа; «directional, not precise»; vidIQ: все цифры — оценки, брекеты относительные и меняются ежемесячно; нет фильтра по стране/языку в Keywords | https://www.blackhatworld.com/seo/is-vidiq-search-volume-reliable.1041675/ ; https://support.vidiq.com/en/articles/9421214-keywords-research |
| AI Coach «общий», фабрикует | Официальная статья: может «fabricate details about your content», терять контекст в длинных чатах, подтверждать правило и нарушать его, плохо понимать отрицания, «поддакивать» при раздражении; не «смотрит» видео; аналитика с задержкой до 48 ч; Shorts менее точно; livestreams нет; память только в чате; обзоры: «generic advice, credit system drains fast» | https://support.vidiq.com/en/articles/15195757-getting-the-best-results-from-the-vidiq-ai-coach ; https://support.vidiq.com/en/articles/8017871-ai-coach ; https://1of10.com/blog/vidiq-review/ |
| Кредиты | 22 за каждую регенерацию превью (Free 150 ≈ 6 превью); Shorts Generator 20/сек; Clipping тарифицирует всё видео без выбора фрагмента (60 мин = 540 кредитов); AI-видео 8 с — «well over 100 credits»; кредиты за «неидеальный» результат не возвращаются; не переносятся; Top-up только Max/Coaching; переход на кредиты без явного предупреждения (Trustpilot) | https://support.vidiq.com/en/articles/13928456-features-credits-by-plan ; https://support.vidiq.com/en/articles/15082430-vidiq-mcp ; https://www.trustpilot.com/review/vidiq.com |
| Paywall creep / «витрина» | Функции перенесены из Free в paid (2022–2024); Free показывает «видимые, но заблокированные» цифры; Feed-карточки на Free заблокированы на 12 ч; 3 результата в Keywords и Search Panel; водяные знаки на клипах/Stories | https://1of10.com/blog/vidiq-review/ ; https://ytgrowth.io/blog/vidiq-review ; https://support.vidiq.com/en/articles/13188399-feed-cards-breakdown |
| Биллинг и отмена | Автопродление без уведомления, «no refunds or credits for unused days», паузы нет, отмена через полный downgrade-wizard; Trustpilot ≈ 3.8–4.2 (1 300+ отзывов), app.vidiq.com 2.6 (7 отзывов); жалобы на списания $468 / $948 после «отмены» | https://support.vidiq.com/en/articles/442414-why-was-i-charged-without-notification ; https://support.vidiq.com/en/articles/9406455-can-i-pause-my-paid-subscription ; https://www.trustpilot.com/review/vidiq.com |
| Непрозрачные и «плавающие» цены | На /plans десятки экспериментальных конфигураций (`is_experimental`) — разные пользователи видят разные цены; обзоры расходятся ($19 vs $39 за Boost; $99 vs $199 за Coaching); Pro ещё описан в help-центре, но не продаётся | https://vidiq.com/plans/ (JSON) ; https://alanspicer.com/vidiq-pricing-2026/ |
| Задержки данных | Дашборд Enterprise обновляется ~24 ч; Subscribers 24–48 ч; Best Time to Post «несколько дней»; Competitors показывает 0 за день и скачок на следующий; отрицательные просмотры при аудитах YouTube | https://support.vidiq.com/en/articles/9456917-competitors ; https://support.vidiq.com/en/articles/9562745-subscribers |
| Outliers слабее специализированных тулов | Нерелевантные результаты при узких фильтрах (vidIQ сам это описывает), NSFW-результаты «потому что это есть на YouTube», Free 6–8 результатов; конкуренты: «limited niche filters, leans on large channels» | https://support.vidiq.com/en/articles/9660010-outliers ; https://outlierkit.com/blog/best-youtube-outlier-finder-tools |
| Нет A/B-тестов и bulk-инструментов | A/B только в Enterprise Pro ($2 500/мес); bulk find/replace, bulk-теги, overlay — нет (TubeBuddy есть) | https://support.vidiq.com/en/articles/8058473-vidiq-enterprise-introduction ; https://outlierkit.com/resources/vidiq-vs-tubebuddy/ |
| Фрагментация платформ | Trending Videos по ключу — только в мобильном приложении; Customized Ideas — только веб; Most Viewed и Channel Audit — только через расширение; AI Coach в мобайле — старая версия; Keyword Volume на мобайле 0–100 вместо чисел | https://support.vidiq.com/en/articles/9421214-keywords-research ; https://support.vidiq.com/en/articles/8017871-ai-coach |
| Языки | Daily Ideas «optimized for English inputs»; Rising Keywords только EN/RU/ES/PT; Coaching только 6 англоязычных стран и английские каналы; Video Generator «works best in English» | https://support.vidiq.com/en/articles/7993395-personalized-and-customized-video-ideas ; https://support.vidiq.com/en/articles/10990358-frequently-asked-questions-vidiq-1-1-coaching-plan |
| Замедление браузера | «Major user complaint» по версии конкурента; независимых бенчмарков нет | https://outlierkit.com/blog/best-youtube-keyword-research-tools |
| Устаревшая документация и расхождения | Статьи 2020–2024 (VPH, Engagement, Weight Class, Recommended Tags, Title Suggestions); Outliers Free 6 vs 8; Most Viewed «Pro: all filters» vs FAQ «filters only on Boost»; Coaching 2 000 vs 6 000 кредитов в обзорах | support.vidiq.com (даты статей) |
| Scores не предсказывают результат | vidIQ: «Boost This Video / many tags does not guarantee higher views», «scores and suggestions don't guarantee views» | https://support.vidiq.com/en/articles/10106651-recommended-tags ; https://support.vidiq.com/en/articles/16976033-getting-started-with-vidiq |

---

## 7. Конкуренты (контекст)

| Продукт | Чем отличается от vidIQ | Цена 2026 (сторонние данные, unverified) | Источник |
|---|---|---|---|
| **TubeBuddy** | Настоящее A/B-тестирование заголовков/превью/описаний/тегов (план Legend); bulk-инструменты (Bulk Find/Replace, Bulk Thumbnail Overlays, Scheduled Publish); слабее в keyword/competitor research и AI-идеях; тоже расширение | Вход ≈ $3.60–4.50/мес, Pro ≈ $12/мес, Legend ≈ $27/мес (годовая) | https://outlierkit.com/resources/vidiq-vs-tubebuddy/ ; https://thumbnailtest.com/guides/vidiq-vs-tubebuddy/ ; https://www.tubebuddy.com/blog/tubebuddy-vs-vidiq/ |
| **1of10** | Outlier-бейджи с множителем (7.1x) прямо в интерфейсе YouTube (browse-time discovery); AI Title Generator и полноценный AI thumbnail generator с поиском и редактором; «ideas + packaging» | Basic $19/мес ($180/год) или $29/мес ($349/год); Pro $69–89/мес ($828/год), 1 000 кредитов | https://1of10.com/blog/1of10-vs-outlierkit/ ; https://outlierkit.com/blog/1of10-vs-vidiq |
| **OutlierKit** | Нишевый outlier-анализ с нормализацией по размеру канала, «почему видео перевыполнило», low-competition и high-RPM keywords, hook strength, trend prediction, AI script analysis; цветные outlier-оценки во вкладке Videos любого канала; бесплатное расширение без аккаунта; API | Hobby $29/мес или $199/год (100 кредитов), Pro $49/мес или $299/год (500, API, Competitor Studio), Max $199/мес или $999/год (2 000) | https://outlierkit.com/resources/outlierkit-vs-vidiq/ ; https://outlierkit.com/blog/best-youtube-outlier-finder-tools |
| **ViewStats** | Со-основан MrBeast; Outlier Video Search (сравнение с последними 9 загрузками), A/B Tests, Thumbnail Search, Video Alerts, Collections, Creator Dashboard, Competitors; расширение с графиком просмотров во времени и историей смен превью; реальный free-tier; жалобы на логин/лаги (по данным конкурента) | Free Basic; Pro $49.99/мес (≈$39.99 годовая); Business от $249/мес | https://outlierkit.com/resources/vidiq-vs-viewstats/ ; https://outlierkit.com/resources/viewstats-chrome-extension/ ; https://1of10.com/compare/viewstats-alternatives |

Вывод для продукта-конкурента: vidIQ выигрывает широтой (всё-в-одном + AI Coach + Studio-панель + MCP), но проигрывает по (а) прозрачности и точности метрик, (б) глубине outlier-анализа, (в) A/B и bulk-инструментам для обычных creators, (г) честности ценообразования/кредитов/возвратов, (д) локализации (не-английские ниши). Незакрытая ниша: «прозрачные формулы + сильные outliers с нормализацией + честный free-tier + bulk/A/B + мультиязычность».

---

## Sources (все использованные URL)

### Официальные vidIQ — support.vidiq.com (прочитаны целиком через curl)
- https://support.vidiq.com/en/ (индекс) и коллекции: /en/collections/4327400-mastering-vidiq-tools , /en/collections/2149485-getting-started-with-vidiq , /en/collections/2845820-vidiq-enterprise , /en/collections/3918997-account-and-billing , /en/collections/13569820-coaching
- https://support.vidiq.com/en/articles/13928456-features-credits-by-plan
- https://support.vidiq.com/en/articles/9696241-the-vidiq-scorecard
- https://support.vidiq.com/en/articles/10453678-the-vidiq-shorts-scorecard
- https://support.vidiq.com/en/articles/9868197-vidiq-extension-overview
- https://support.vidiq.com/en/articles/13892020-uploading-and-editing-on-youtube-with-vidiq
- https://support.vidiq.com/en/articles/9906017-uploading-and-editing-with-vidiq
- https://support.vidiq.com/en/articles/10099905-title-suggestions
- https://support.vidiq.com/en/articles/10106669-ai-description-generator
- https://support.vidiq.com/en/articles/10106651-recommended-tags
- https://support.vidiq.com/en/articles/10099973-ai-thumbnail-builder
- https://support.vidiq.com/en/articles/9829132-thumbnail-preview
- https://support.vidiq.com/en/articles/108673-best-time-to-post
- https://support.vidiq.com/en/articles/108672-what-is-vph-views-per-hour
- https://support.vidiq.com/en/articles/108670-what-s-engagement-rate
- https://support.vidiq.com/en/articles/438242-the-weight-class
- https://support.vidiq.com/en/articles/8972670-optimize
- https://support.vidiq.com/en/articles/9820526-navigating-your-new-dashboard
- https://support.vidiq.com/en/articles/13188399-feed-cards-breakdown
- https://support.vidiq.com/en/articles/7993395-personalized-and-customized-video-ideas
- https://support.vidiq.com/en/articles/8017871-ai-coach
- https://support.vidiq.com/en/articles/15195757-getting-the-best-results-from-the-vidiq-ai-coach
- https://support.vidiq.com/en/articles/9456917-competitors
- https://support.vidiq.com/en/articles/9562745-subscribers
- https://support.vidiq.com/en/articles/9421214-keywords-research
- https://support.vidiq.com/en/articles/9660010-outliers
- https://support.vidiq.com/en/articles/8619340-most-viewed
- https://support.vidiq.com/en/articles/10141815-channel-audit
- https://support.vidiq.com/en/articles/10152120-thumbnails
- https://support.vidiq.com/en/articles/13946970-best-practices-getting-the-most-out-of-vidiq-thumbnails
- https://support.vidiq.com/en/articles/11526189-script-writer
- https://support.vidiq.com/en/articles/11519169-clipping
- https://support.vidiq.com/en/articles/13564834-video-generator
- https://support.vidiq.com/en/articles/9829101-generate
- https://support.vidiq.com/en/articles/8991775-create
- https://support.vidiq.com/en/articles/9010754-blueprints
- https://support.vidiq.com/en/articles/9899331-remix
- https://support.vidiq.com/en/articles/15082430-vidiq-mcp
- https://support.vidiq.com/en/articles/14975681-vidiq-for-instagram
- https://support.vidiq.com/en/articles/108646-what-is-vidiq
- https://support.vidiq.com/en/articles/16976033-getting-started-with-vidiq
- https://support.vidiq.com/en/articles/2944253-which-browsers-work-with-vidiq
- https://support.vidiq.com/en/articles/7251053-how-many-channels-can-i-add-to-my-vidiq-account
- https://support.vidiq.com/en/articles/14979673-running-out-of-ai-credits-your-options-for-getting-more
- https://support.vidiq.com/en/articles/7153722-how-to-cancel-my-paid-vidiq-subscription
- https://support.vidiq.com/en/articles/442414-why-was-i-charged-without-notification
- https://support.vidiq.com/en/articles/9406455-can-i-pause-my-paid-subscription
- https://support.vidiq.com/en/articles/8058473-vidiq-enterprise-introduction
- https://support.vidiq.com/en/articles/15972848-welcome-to-vidiq-enterprise
- https://support.vidiq.com/en/articles/5056137-vidiq-enterprise-dashboard-overview
- https://support.vidiq.com/en/articles/10691864-grow-your-channel-faster-with-vidiq-1-1-coaching
- https://support.vidiq.com/en/articles/10990358-frequently-asked-questions-vidiq-1-1-coaching-plan
- https://support.vidiq.com/en/articles/11328085-top-5-boost-features-every-1-1-coaching-creator-should-be-using

### Официальные vidIQ — vidiq.com / enterprise.vidiq.com (прочитаны через curl)
- https://vidiq.com/plans/ (текст страницы + встроенный JSON `customPageData.plans` с ценами)
- https://vidiq.com/features/
- https://vidiq.com/extension/
- https://vidiq.com/features/scorecard/
- https://vidiq.com/features/outliers/
- https://vidiq.com/features/trend-alerts/
- https://vidiq.com/features/keyword-tools/
- https://vidiq.com/features/most-viewed/
- https://vidiq.com/features/channel-audit/
- https://vidiq.com/features/daily-ideas/
- https://vidiq.com/features/achievements/
- https://vidiq.com/features/ai-youtube-coach/
- https://vidiq.com/mobile-app/
- https://enterprise.vidiq.com/packages
- https://vidiq.com/blog/post/vidiq-tools-youtube/ (по сниппетам)
- https://vidiq.com/blog/post/summer-2025-drop/ , https://vidiq.com/blog/post/vidiq-for-instagram/ , https://vidiq.com/blog/category/product-updates/ (по сниппетам)

### Магазины расширений / приложений (по сниппетам)
- https://chromewebstore.google.com/detail/vidiq-vision-for-youtube/pachckjkecffpdphbpmfolblodfkgbhl
- https://addons.mozilla.org/en-US/firefox/addon/vidiq-vision-youtube/
- https://www.crx4chrome.com/extensions/pachckjkecffpdphbpmfolblodfkgbhl/
- https://apps.apple.com/us/app/vidiq-for-youtube-instagram/id1458235345
- https://play.google.com/store/apps/details?id=com.vidiq.app

### Сторонние обзоры и сравнения 2026 (по сниппетам; использованы только там, где vidIQ молчит)
- https://1of10.com/blog/vidiq-review/ ; https://1of10.com/blog/vidiq-pricing/ ; https://1of10.com/blog/1of10-vs-outlierkit/ ; https://1of10.com/compare/viewstats-alternatives
- https://outlierkit.com/resources/vidiq-pricing/ ; https://outlierkit.com/resources/vidiq-vs-tubebuddy/ ; https://outlierkit.com/resources/vidiq-vs-viewstats/ ; https://outlierkit.com/resources/outlierkit-vs-vidiq/ ; https://outlierkit.com/resources/viewstats-chrome-extension/ ; https://outlierkit.com/resources/outlier-scores/ ; https://outlierkit.com/resources/youtube-analytics-chrome-extension/ ; https://outlierkit.com/blog/best-youtube-outlier-finder-tools ; https://outlierkit.com/blog/best-youtube-keyword-research-tools ; https://outlierkit.com/blog/1of10-vs-vidiq
- https://alanspicer.com/vidiq-seo-score-explained/ ; https://alanspicer.com/vidiq-outlier-score-vph-explained/ ; https://alanspicer.com/vidiq-chrome-extension-guide/ ; https://alanspicer.com/vidiq-pricing-2026/
- https://ahrefs.com/blog/fr/youtube-keyword-tools ; https://backlinko.com/hub/content/vidiq
- https://thumbnailtest.com/guides/vidiq-vs-tubebuddy/ ; https://www.tubebuddy.com/blog/tubebuddy-vs-vidiq/
- https://ytgrowth.io/blog/vidiq-review ; https://comparedge.com/tools/vidiq-ai/pricing ; https://www.g2.com/products/vidiq/pricing

### Отзывы пользователей
- https://www.trustpilot.com/review/vidiq.com ; https://www.trustpilot.com/review/app.vidiq.com
- https://www.capterra.com/p/182133/vidIQ/reviews/ ; https://www.g2.com/products/vidiq/reviews
- https://www.blackhatworld.com/seo/is-vidiq-search-volume-reliable.1041675/
