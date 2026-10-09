import type { Lang } from './types.ts';

const dict = {
  // generic
  app_name: { ru: 'Nubit', en: 'Nubit' },
  settings: { ru: 'Настройки', en: 'Settings' },
  save: { ru: 'Сохранить', en: 'Save' },
  saved: { ru: 'Сохранено', en: 'Saved' },
  cancel: { ru: 'Отмена', en: 'Cancel' },
  delete: { ru: 'Удалить', en: 'Delete' },
  add: { ru: 'Добавить', en: 'Add' },
  copy: { ru: 'Копировать', en: 'Copy' },
  copied: { ru: 'Скопировано', en: 'Copied' },
  loading: { ru: 'Загрузка…', en: 'Loading…' },
  error: { ru: 'Ошибка', en: 'Error' },
  ok: { ru: 'OK', en: 'OK' },
  unknown: { ru: '—', en: '—' },

  // metrics
  vph: { ru: 'Просм./час', en: 'Views/hour' },
  vph_full: { ru: 'Просмотров в час (среднее с публикации)', en: 'Views per hour (lifetime average)' },
  vph_recent: { ru: 'Сейчас', en: 'Now' },
  vph_recent_full: { ru: 'Просмотров в час за последнее время (по нашим замерам)', en: 'Recent views per hour (from our snapshots)' },
  views: { ru: 'Просмотры', en: 'Views' },
  likes: { ru: 'Лайки', en: 'Likes' },
  comments: { ru: 'Комментарии', en: 'Comments' },
  age: { ru: 'Возраст', en: 'Age' },
  outlier: { ru: 'Outlier', en: 'Outlier' },
  outlier_full: { ru: 'Во сколько раз больше медианы просмотров канала', en: 'Views vs the channel median' },
  subscribers: { ru: 'Подписчики', en: 'Subscribers' },
  engagement: { ru: 'Вовлечённость', en: 'Engagement' },
  engagement_full: { ru: '(лайки + комментарии) / просмотры', en: '(likes + comments) / views' },
  seo_score: { ru: 'SEO-оценка', en: 'SEO score' },
  tags: { ru: 'Теги', en: 'Tags' },
  no_tags: { ru: 'Тегов нет', en: 'No tags' },
  copy_all_tags: { ru: 'Скопировать все', en: 'Copy all' },
  tag_ranks: { ru: 'Позиции в поиске', en: 'Search ranks' },
  tag_ranks_hint: { ru: '#N — место этого видео в поиске YouTube по тегу (топ-20); «—» — не в топ-20.', en: '#N — this video\'s position in YouTube search for the tag (top 20); "—" — not in the top 20.' },
  channel_tags: { ru: 'Теги канала', en: 'Channel tags' },
  add_competitor: { ru: '+ Конкурент', en: '+ Competitor' },
  competitor_added: { ru: 'Канал добавлен в конкуренты', en: 'Channel added to competitors' },
  competitor_exists: { ru: 'Уже в списке конкурентов', en: 'Already tracked' },
  competitor_limit: { ru: 'Максимум 30 конкурентов', en: 'Up to 30 competitors' },
  tab_chat: { ru: 'Чат', en: 'Chat' },
  tab_competitors: { ru: 'Конкуренты', en: 'Competitors' },
  comp_empty: { ru: 'Пока нет отслеживаемых каналов. Нажмите «+ Конкурент» на странице видео или канала — Nubit будет раз в 6 часов проверять их новые видео и сообщать, какие выстрелили.', en: 'No tracked channels yet. Press "+ Competitor" on a video or channel page — Nubit checks their new uploads every 6 hours and reports the breakouts.' },
  comp_refresh: { ru: 'Обновить', en: 'Refresh' },
  comp_alerts: { ru: 'Выстрелившие видео', en: 'Breakout videos' },
  comp_no_alerts: { ru: 'Пока ничего нового. Сигналы появятся, когда новое видео конкурента наберёт ≥ 2× медианы канала или ≥ 500 просмотров/час.', en: 'Nothing new yet. Alerts appear when a new competitor video reaches ≥ 2× the channel median or ≥ 500 views/hour.' },
  comp_channels: { ru: 'Каналы', en: 'Channels' },
  comp_median: { ru: 'медиана', en: 'median' },
  comp_per_week: { ru: 'видео/нед', en: 'videos/wk' },
  comp_last: { ru: 'последнее', en: 'last upload' },
  comp_remove: { ru: 'Убрать', en: 'Remove' },
  act_daily_ideas: { ru: '💡 Идеи дня', en: '💡 Daily ideas' },
  comp_add_by_link: { ru: 'Добавить по ссылке или @handle', en: 'Add by link or @handle' },
  captions: { ru: 'Субтитры', en: 'Captions' },
  auto: { ru: 'авто', en: 'auto' },
  duration: { ru: 'Длительность', en: 'Duration' },
  computing: { ru: 'считаем…', en: 'computing…' },
  show_checks: { ru: 'Показать проверки', en: 'Show checks' },
  hide_checks: { ru: 'Скрыть проверки', en: 'Hide checks' },

  // time units
  t_min: { ru: 'мин', en: 'min' },
  t_hour: { ru: 'ч', en: 'h' },
  t_day: { ru: 'д', en: 'd' },
  t_month: { ru: 'мес', en: 'mo' },
  t_year: { ru: 'г', en: 'y' },

  // actions
  act_analyze_video: { ru: 'Анализ видео', en: 'Analyze video' },
  act_why_performing: { ru: 'Почему так набирает?', en: 'Why is it performing?' },
  act_titles: { ru: 'Варианты названий', en: 'Title ideas' },
  act_tags_description: { ru: 'Теги и описание', en: 'Tags & description' },
  act_keyword_research: { ru: 'Анализ запроса', en: 'Keyword research' },
  act_channel_review: { ru: 'Разбор канала', en: 'Channel review' },
  act_competitors: { ru: 'Конкуренты', en: 'Competitors' },
  act_content_ideas: { ru: 'Идеи для видео', en: 'Content ideas' },
  act_summarize: { ru: 'Кратко о чём видео', en: 'Summarize video' },
  open_chat: { ru: 'Открыть чат', en: 'Open chat' },
  ai_analyze: { ru: 'Анализ ИИ', en: 'AI analysis' },

  // side panel
  panel_placeholder: { ru: 'Спросите о видео, канале или запросе…', en: 'Ask about this video, channel or search…' },
  panel_send: { ru: 'Отправить', en: 'Send' },
  panel_stop: { ru: 'Стоп', en: 'Stop' },
  panel_clear: { ru: 'Новый чат', en: 'New chat' },
  panel_no_key: { ru: 'Добавьте API-ключ в настройках, чтобы включить ИИ.', en: 'Add an API key in settings to enable the AI.' },
  panel_open_settings: { ru: 'Открыть настройки', en: 'Open settings' },
  panel_context_none: { ru: 'Откройте видео, поиск или канал на YouTube', en: 'Open a video, search or channel on YouTube' },
  panel_welcome: {
    ru: 'Я Nubit — ИИ-аналитик YouTube. Вижу открытую страницу, умею искать видео, читать субтитры и комментарии, сравнивать с каналом и подбирать ключевые слова.',
    en: 'I am Nubit — an AI YouTube analyst. I see the open page, can search videos, read transcripts and comments, compare against the channel and research keywords.',
  },
  tool_running: { ru: 'выполняю', en: 'running' },
  tool_done: { ru: 'готово', en: 'done' },
  tool_error: { ru: 'ошибка', en: 'error' },
  truncated_notice: { ru: 'Ответ был обрезан по лимиту токенов.', en: 'The reply was cut off by the token limit.' },
  refusal_notice: { ru: 'Модель отказалась отвечать на этот запрос.', en: 'The model declined to answer this request.' },
  aborted: { ru: 'Остановлено.', en: 'Stopped.' },
} as const;

export type I18nKey = keyof typeof dict;

let lang: Lang = 'ru';

export function setLang(l: Lang): void {
  lang = l;
}

export function getLang(): Lang {
  return lang;
}

export function t(key: I18nKey): string {
  return dict[key][lang];
}

export function formatCompact(n: number | undefined): string {
  if (n === undefined || !isFinite(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1e9) return trim(n / 1e9) + (lang === 'ru' ? ' млрд' : 'B');
  if (abs >= 1e6) return trim(n / 1e6) + (lang === 'ru' ? ' млн' : 'M');
  if (abs >= 1e3) return trim(n / 1e3) + (lang === 'ru' ? ' тыс' : 'K');
  return String(Math.round(n));
}

function trim(x: number): string {
  return (x >= 100 ? x.toFixed(0) : x >= 10 ? x.toFixed(1) : x.toFixed(2)).replace(/\.?0+$/, '');
}

export function formatAge(hours: number | undefined): string {
  if (hours === undefined || !isFinite(hours)) return '—';
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} ${t('t_min')}`;
  if (hours < 48) return `${Math.round(hours)} ${t('t_hour')}`;
  const days = hours / 24;
  if (days < 60) return `${Math.round(days)} ${t('t_day')}`;
  const months = days / 30.44;
  if (months < 24) return `${Math.round(months)} ${t('t_month')}`;
  return `${(days / 365.25).toFixed(1)} ${t('t_year')}`;
}

export function formatPercent(x: number | undefined, digits = 1): string {
  if (x === undefined || !isFinite(x)) return '—';
  return (x * 100).toFixed(digits) + '%';
}

export function formatDuration(sec: number | undefined): string {
  if (sec === undefined || !isFinite(sec)) return '—';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}
