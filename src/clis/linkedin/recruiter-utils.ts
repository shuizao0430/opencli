import { AuthRequiredError, CommandExecutionError, EmptyResultError } from '../../errors.js';
import type { IPage } from '../../types.js';

export interface RecruiterPeopleSearchInput {
  query: string;
  location?: string;
  currentTitle?: string;
  pastCompany?: string;
  industry?: string;
  seniority?: string;
  skills?: string;
  language?: string;
  openToWork?: boolean;
  limit: number;
  start: number;
}

export interface RecruiterCandidateSummary {
  rank?: number;
  candidate_id: string;
  profile_url: string;
  name: string;
  headline: string;
  location: string;
  current_company: string;
  current_title: string;
  connection_degree: string;
  open_to_work: string;
  match_signals: string;
  list_source: string;
}

export interface RecruiterCandidateProfile {
  candidate_id: string;
  profile_url: string;
  name: string;
  headline: string;
  location: string;
  about: string;
  current_company: string;
  current_title: string;
  connection_degree: string;
  open_to_work: string;
  mutual_connections: string;
  recent_activity: string;
  contact_visibility: string;
  skills: string;
  languages: string;
  education: string;
  work_history: string;
  list_source: string;
}

export interface RecruiterProjectSummary {
  rank?: number;
  project_id: string;
  name: string;
  description: string;
  status: string;
  candidate_count: string;
  updated_at: string;
  url: string;
}

export interface RecruiterSavedSearchSummary {
  rank?: number;
  search_id: string;
  name: string;
  query: string;
  cadence: string;
  result_count: string;
  url: string;
}

export interface RecruiterInboxThreadSummary {
  rank?: number;
  conversation_id: string;
  candidate_id: string;
  profile_url: string;
  name: string;
  headline: string;
  last_message: string;
  last_time: string;
  unread: string;
  list_source: string;
}

export interface RecruiterInboxMessage {
  rank?: number;
  conversation_id: string;
  candidate_id: string;
  profile_url: string;
  from: string;
  direction: string;
  type: string;
  text: string;
  time: string;
  list_source: string;
}

export interface RecruiterInboxReplyResult {
  conversation_id: string;
  candidate_id: string;
  profile_url: string;
  status: string;
  detail: string;
  list_source: string;
}

export interface RecruiterStatsRow {
  category: string;
  metric: string;
  value: string;
  detail: string;
  list_source: string;
}

export interface RecruiterFollowUpQueueItem {
  rank?: number;
  priority: string;
  priority_score: number;
  recommended_action: string;
  reason: string;
  conversation_id: string;
  candidate_id: string;
  name: string;
  headline: string;
  last_message: string;
  last_time: string;
  unread: string;
  profile_url: string;
  list_source: string;
}

export interface RecruiterFollowUpTemplateContext extends RecruiterFollowUpQueueItem {
  first_name: string;
}

export interface RecruiterFollowUpExportOptions {
  preset?: string;
  fields?: string[];
  template?: string;
}

export interface RecruiterMessageResult {
  candidate_id: string;
  conversation_id: string;
  profile_url: string;
  status: string;
  detail: string;
  list_source: string;
}

export interface RecruiterSaveToProjectResult {
  candidate_id: string;
  project_id: string;
  project_name: string;
  profile_url: string;
  status: string;
  detail: string;
  list_source: string;
}

export interface RecruiterTagResult {
  candidate_id: string;
  tag: string;
  profile_url: string;
  status: string;
  detail: string;
  list_source: string;
}

export interface RecruiterNoteResult {
  candidate_id: string;
  note: string;
  profile_url: string;
  status: string;
  detail: string;
  list_source: string;
}

interface SurfaceDetectionResult {
  currentUrl: string;
  loginRequired: boolean;
  recruiterDetected: boolean;
  publicProfileDetected: boolean;
}

export function normalizeWhitespace(value: unknown): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

export function parseCsvArg(value: unknown): string[] {
  if (value === undefined || value === null || value === '') return [];
  return String(value)
    .split(',')
    .map(item => normalizeWhitespace(item))
    .filter(Boolean);
}

export function toYesNo(value: unknown): string {
  if (typeof value === 'boolean') return value ? 'yes' : 'no';
  const normalized = normalizeWhitespace(value).toLowerCase();
  if (!normalized) return '';
  if (['true', '1', 'yes', 'y', 'open'].includes(normalized)) return 'yes';
  if (['false', '0', 'no', 'n', 'closed'].includes(normalized)) return 'no';
  return normalized;
}

export function canonicalizeLinkedinUrl(url: string): string {
  if (!url) return '';
  try {
    const parsed = new URL(url, 'https://www.linkedin.com');
    parsed.hash = '';
    for (const key of ['trk', 'trackingId', 'lipi']) parsed.searchParams.delete(key);
    return parsed.toString();
  } catch {
    return normalizeWhitespace(url);
  }
}

export function decodeLinkedinRedirect(url: string): string {
  if (!url) return '';
  try {
    const parsed = new URL(url, 'https://www.linkedin.com');
    if (parsed.pathname === '/redir/redirect/') {
      return canonicalizeLinkedinUrl(parsed.searchParams.get('url') || url);
    }
  } catch {}
  return canonicalizeLinkedinUrl(url);
}

export function candidateIdFromProfileUrl(profileUrl: string): string {
  const canonical = canonicalizeLinkedinUrl(profileUrl);
  const encoded = Buffer.from(canonical, 'utf8').toString('base64url');
  return `url:${encoded}`;
}

export function decodeCandidateId(candidateId: string): string | null {
  const value = normalizeWhitespace(candidateId);
  if (!value) return null;
  if (value.startsWith('url:')) {
    try {
      return canonicalizeLinkedinUrl(Buffer.from(value.slice(4), 'base64url').toString('utf8'));
    } catch {
      return null;
    }
  }
  if (/^https?:\/\//i.test(value)) return canonicalizeLinkedinUrl(value);
  if (value.includes('/in/')) return canonicalizeLinkedinUrl(`https://www.linkedin.com${value}`);
  if (/^[a-z0-9][a-z0-9-]{2,}$/i.test(value)) {
    return canonicalizeLinkedinUrl(`https://www.linkedin.com/in/${value}`);
  }
  return null;
}

export function candidateIdFromArtifacts(profileUrl: string, fallbackUrn?: string): string {
  const canonicalUrl = decodeLinkedinRedirect(profileUrl);
  if (canonicalUrl) return candidateIdFromProfileUrl(canonicalUrl);
  return normalizeWhitespace(fallbackUrn);
}

export function resolveRecruiterProfileUrl(
  candidateId: string | undefined,
  profileUrl: string | undefined,
): string {
  const explicitUrl = normalizeWhitespace(profileUrl);
  if (explicitUrl) return explicitUrl;

  const raw = normalizeWhitespace(candidateId);
  if (!raw) return '';

  const looksLikePublicProfileRef = raw.startsWith('url:')
    || /^https?:\/\//i.test(raw)
    || raw.includes('/in/');
  if (looksLikePublicProfileRef) {
    const decoded = decodeCandidateId(raw);
    if (decoded) return decoded;
  }

  return `https://www.linkedin.com/talent/profile/${encodeURIComponent(raw)}`;
}

export function buildRecruiterProjectUrl(projectId: string): string {
  return `https://www.linkedin.com/talent/projects/${encodeURIComponent(normalizeWhitespace(projectId))}`;
}

export function buildRecruiterInboxUrl(): string {
  return 'https://www.linkedin.com/talent/messages';
}

export function buildRecruiterInboxThreadUrl(conversationId: string): string {
  const normalized = normalizeWhitespace(conversationId);
  const base = buildRecruiterInboxUrl();
  if (!normalized) return base;
  return `${base}?conversationId=${encodeURIComponent(normalized)}`;
}

export function buildRecruiterSearchUrl(input: RecruiterPeopleSearchInput): string {
  const params = new URLSearchParams();
  params.set('keywords', input.query);
  if (input.location) params.set('location', input.location);
  if (input.currentTitle) params.set('currentTitle', input.currentTitle);
  if (input.pastCompany) params.set('pastCompany', input.pastCompany);
  if (input.industry) params.set('industry', input.industry);
  if (input.seniority) params.set('seniority', input.seniority);
  if (input.skills) params.set('skills', input.skills);
  if (input.language) params.set('language', input.language);
  if (typeof input.openToWork === 'boolean') params.set('openToWork', input.openToWork ? 'true' : 'false');
  if (input.start > 0) params.set('start', String(input.start));
  return `https://www.linkedin.com/talent/search?${params.toString()}`;
}

export function summarizeSignals(parts: string[]): string {
  return [...new Set(parts.map(part => normalizeWhitespace(part)).filter(Boolean))].join('; ');
}

export function mergeCandidates(
  existing: RecruiterCandidateSummary[],
  incoming: RecruiterCandidateSummary[],
): RecruiterCandidateSummary[] {
  const seen = new Set(existing.map(item => item.candidate_id || item.profile_url));
  const merged = [...existing];

  for (const item of incoming) {
    const key = item.candidate_id || item.profile_url;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }

  return merged;
}

export function mergeInboxThreads(
  existing: RecruiterInboxThreadSummary[],
  incoming: RecruiterInboxThreadSummary[],
): RecruiterInboxThreadSummary[] {
  const keyOf = (item: RecruiterInboxThreadSummary) => item.conversation_id || item.candidate_id || item.profile_url;
  const seen = new Set(existing.map(keyOf).filter(Boolean));
  const merged = [...existing];

  for (const item of incoming) {
    const key = keyOf(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }

  return merged;
}

export function summarizeRecruiterPeopleStats(
  candidates: RecruiterCandidateSummary[],
  listSource = 'stats:search',
): RecruiterStatsRow[] {
  const normalized = candidates.filter(candidate => candidate && candidate.name);
  const yesOpenToWork = normalized.filter(candidate => toYesNo(candidate.open_to_work) === 'yes').length;
  const withConnection = normalized.filter(candidate => normalizeWhitespace(candidate.connection_degree)).length;
  const uniqueCompanies = new Set(normalized.map(candidate => normalizeWhitespace(candidate.current_company)).filter(Boolean));
  const uniqueLocations = new Set(normalized.map(candidate => normalizeWhitespace(candidate.location)).filter(Boolean));
  const withSignals = normalized.filter(candidate => normalizeWhitespace(candidate.match_signals)).length;

  return [
    {
      category: 'search',
      metric: 'visible_candidates',
      value: String(normalized.length),
      detail: 'Visible recruiter candidates collected from the current search result set',
      list_source: listSource,
    },
    {
      category: 'search',
      metric: 'open_to_work_yes',
      value: String(yesOpenToWork),
      detail: 'Candidates currently marked as open to work',
      list_source: listSource,
    },
    {
      category: 'search',
      metric: 'with_connection_degree',
      value: String(withConnection),
      detail: 'Candidates showing a visible LinkedIn connection degree',
      list_source: listSource,
    },
    {
      category: 'search',
      metric: 'unique_companies',
      value: String(uniqueCompanies.size),
      detail: 'Distinct current companies across the visible candidate set',
      list_source: listSource,
    },
    {
      category: 'search',
      metric: 'unique_locations',
      value: String(uniqueLocations.size),
      detail: 'Distinct visible locations across the current candidate set',
      list_source: listSource,
    },
    {
      category: 'search',
      metric: 'candidates_with_match_signals',
      value: String(withSignals),
      detail: 'Candidates exposing match or activity signals in the visible cards',
      list_source: listSource,
    },
  ];
}

export function summarizeRecruiterInboxStats(
  threads: RecruiterInboxThreadSummary[],
  listSource = 'stats:inbox',
): RecruiterStatsRow[] {
  const normalized = threads.filter(thread => thread && (thread.conversation_id || thread.candidate_id || thread.name));
  const unreadThreads = normalized.filter((thread) => {
    const unread = normalizeWhitespace(thread.unread).toLowerCase();
    return unread === 'unread' || unread === 'new' || /^\d+$/.test(unread);
  }).length;
  const linkedCandidates = normalized.filter(thread => normalizeWhitespace(thread.candidate_id)).length;
  const withProfiles = normalized.filter(thread => normalizeWhitespace(thread.profile_url)).length;
  const recentThreads = normalized.filter((thread) => {
    const lastTime = normalizeWhitespace(thread.last_time).toLowerCase();
    return /\b(today|yesterday|ago|mon|tue|wed|thu|fri|sat|sun)\b/.test(lastTime);
  }).length;

  return [
    {
      category: 'inbox',
      metric: 'visible_threads',
      value: String(normalized.length),
      detail: 'Visible recruiter inbox conversations collected from the thread list',
      list_source: listSource,
    },
    {
      category: 'inbox',
      metric: 'unread_threads',
      value: String(unreadThreads),
      detail: 'Visible conversations that appear unread or newly updated',
      list_source: listSource,
    },
    {
      category: 'inbox',
      metric: 'threads_with_candidate_id',
      value: String(linkedCandidates),
      detail: 'Visible conversations linked to a reusable candidate identifier',
      list_source: listSource,
    },
    {
      category: 'inbox',
      metric: 'threads_with_profile_url',
      value: String(withProfiles),
      detail: 'Visible conversations linked to a public or recruiter profile URL',
      list_source: listSource,
    },
    {
      category: 'inbox',
      metric: 'recently_active_threads',
      value: String(recentThreads),
      detail: 'Visible conversations with a recent last activity timestamp',
      list_source: listSource,
    },
  ];
}

export function buildRecruiterFollowUpQueue(
  threads: RecruiterInboxThreadSummary[],
  options?: { unreadOnly?: boolean; requireCandidateId?: boolean; requireProfileUrl?: boolean },
): RecruiterFollowUpQueueItem[] {
  const unreadOnly = Boolean(options?.unreadOnly);
  const requireCandidateId = Boolean(options?.requireCandidateId);
  const requireProfileUrl = Boolean(options?.requireProfileUrl);

  const classifyPriority = (thread: RecruiterInboxThreadSummary) => {
    const unread = normalizeWhitespace(thread.unread).toLowerCase();
    const lastTime = normalizeWhitespace(thread.last_time).toLowerCase();
    const hasCandidateId = Boolean(normalizeWhitespace(thread.candidate_id));
    const hasProfileUrl = Boolean(normalizeWhitespace(thread.profile_url));
    let score = 0;
    const reasons: string[] = [];

    if (unread === 'unread' || unread === 'new') {
      score += 4;
      reasons.push('thread marked unread');
    } else if (/^\d+$/.test(unread)) {
      score += 4;
      reasons.push(`unread count ${unread}`);
    }

    if (/\btoday\b/.test(lastTime)) {
      score += 3;
      reasons.push('active today');
    } else if (/\byesterday\b/.test(lastTime)) {
      score += 2;
      reasons.push('active yesterday');
    } else if (/\b\d+\s*[hdw]\b/.test(lastTime) || /\bago\b/.test(lastTime)) {
      score += 1;
      reasons.push('recently active');
    }

    if (hasCandidateId) score += 1;
    if (hasProfileUrl) score += 1;

    const lastMessage = normalizeWhitespace(thread.last_message).toLowerCase();
    if (/interested|sounds good|available|yes|sure|thanks|thank you|let's|lets/i.test(lastMessage)) {
      score += 2;
      reasons.push('positive engagement signal');
    }

    let priority = 'low';
    let recommendedAction = 'monitor';
    if (score >= 7) {
      priority = 'high';
      recommendedAction = 'reply-now';
    } else if (score >= 4) {
      priority = 'medium';
      recommendedAction = 'follow-up-soon';
    }

    if (!hasCandidateId && !hasProfileUrl) {
      recommendedAction = priority === 'high' ? 'review-thread-manually' : 'resolve-identity';
      reasons.push('missing reusable candidate reference');
    }

    return {
      priority,
      score,
      recommendedAction,
      reason: reasons.join('; ') || 'visible recruiter thread',
    };
  };

  return threads
    .filter((thread) => {
      const unread = normalizeWhitespace(thread.unread).toLowerCase();
      if (unreadOnly && !(unread === 'unread' || unread === 'new' || /^\d+$/.test(unread))) return false;
      if (requireCandidateId && !normalizeWhitespace(thread.candidate_id)) return false;
      if (requireProfileUrl && !normalizeWhitespace(thread.profile_url)) return false;
      return true;
    })
    .map((thread) => {
      const classification = classifyPriority(thread);
      return {
        priority: classification.priority,
        priority_score: classification.score,
        recommended_action: classification.recommendedAction,
        reason: classification.reason,
        conversation_id: normalizeWhitespace(thread.conversation_id),
        candidate_id: normalizeWhitespace(thread.candidate_id),
        name: normalizeWhitespace(thread.name),
        headline: normalizeWhitespace(thread.headline),
        last_message: normalizeWhitespace(thread.last_message),
        last_time: normalizeWhitespace(thread.last_time),
        unread: normalizeWhitespace(thread.unread),
        profile_url: normalizeWhitespace(thread.profile_url),
        list_source: 'follow-up-queue',
      };
    })
    .sort((a, b) => b.priority_score - a.priority_score || a.name.localeCompare(b.name))
    .map((item, index) => ({ rank: index + 1, ...item }));
}

export function toRecruiterFollowUpTemplateContext(
  item: RecruiterFollowUpQueueItem,
): RecruiterFollowUpTemplateContext {
  const name = normalizeWhitespace(item.name);
  const firstName = name.split(/\s+/).filter(Boolean)[0] || name;
  return {
    ...item,
    first_name: firstName,
  };
}

export function renderRecruiterFollowUpTemplate(
  template: string,
  item: RecruiterFollowUpQueueItem,
): string {
  const normalizedTemplate = String(template ?? '').trim();
  if (!normalizedTemplate) return '';

  const context = toRecruiterFollowUpTemplateContext(item) as unknown as Record<string, unknown>;
  return normalizedTemplate.replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, (_, rawKey: string) => {
    const key = rawKey.toLowerCase();
    const value = context[key];
    return normalizeWhitespace(value);
  }).trim();
}

export function getRecruiterFollowUpFieldValue(
  item: RecruiterFollowUpQueueItem,
  field: string,
): string {
  const key = normalizeWhitespace(field).toLowerCase();
  const context = toRecruiterFollowUpTemplateContext(item) as unknown as Record<string, unknown>;
  return normalizeWhitespace(context[key]);
}

export function presetRecruiterFollowUpExportFields(preset: string): string[] {
  switch (normalizeWhitespace(preset).toLowerCase()) {
    case 'ats':
      return [
        'candidateId=candidate_id',
        'conversationId=conversation_id',
        'fullName=name',
        'firstName=first_name',
        'headline=headline',
        'priority=priority',
        'priorityScore=priority_score',
        'recommendedAction=recommended_action',
        'followUpReason=reason',
        'profileUrl=profile_url',
        'lastMessage=last_message',
        'lastActivity=last_time',
        'unreadState=unread',
        'listSource=list_source',
      ];
    case 'sheet':
    case 'spreadsheet':
      return [
        'candidate_id=candidate_id',
        'name=name',
        'first_name=first_name',
        'headline=headline',
        'priority=priority',
        'priority_score=priority_score',
        'recommended_action=recommended_action',
        'reason=reason',
        'last_time=last_time',
        'last_message=last_message',
        'conversation_id=conversation_id',
        'profile_url=profile_url',
        'unread=unread',
        'list_source=list_source',
      ];
    default:
      return [
        'rank=rank',
        'priority=priority',
        'priority_score=priority_score',
        'recommended_action=recommended_action',
        'reason=reason',
        'conversation_id=conversation_id',
        'candidate_id=candidate_id',
        'name=name',
        'headline=headline',
        'last_message=last_message',
        'last_time=last_time',
        'unread=unread',
        'profile_url=profile_url',
        'list_source=list_source',
      ];
  }
}

export function normalizeRecruiterFollowUpFieldMappings(
  fields: string[] | undefined,
  preset = 'opencli',
): Array<{ target: string; source: string }> {
  const rawFields = Array.isArray(fields) && fields.length > 0 ? fields : presetRecruiterFollowUpExportFields(preset);
  return rawFields
    .map((field) => {
      const normalized = normalizeWhitespace(field);
      if (!normalized) return null;
      const [targetRaw, sourceRaw] = normalized.includes('=')
        ? normalized.split('=')
        : normalized.includes(':')
          ? normalized.split(':')
          : [normalized, normalized];
      const target = normalizeWhitespace(targetRaw);
      const source = normalizeWhitespace(sourceRaw);
      if (!target || !source) return null;
      return { target, source };
    })
    .filter(Boolean) as Array<{ target: string; source: string }>;
}

export function exportRecruiterFollowUpQueue(
  queue: RecruiterFollowUpQueueItem[],
  options?: RecruiterFollowUpExportOptions,
): Array<Record<string, string>> {
  const mappings = normalizeRecruiterFollowUpFieldMappings(options?.fields, options?.preset);
  const template = normalizeWhitespace(options?.template);

  return queue.map((item) => {
    const row: Record<string, string> = {};
    for (const mapping of mappings) {
      row[mapping.target] = getRecruiterFollowUpFieldValue(item, mapping.source);
    }
    if (template) {
      row.next_message = renderRecruiterFollowUpTemplate(template, item);
    }
    return row;
  });
}

export function applyVisibleFilters(
  candidates: RecruiterCandidateSummary[],
  input: RecruiterPeopleSearchInput,
): RecruiterCandidateSummary[] {
  const queryTerms = parseCsvArg(input.query?.toLowerCase());
  const locationTerms = parseCsvArg(input.location?.toLowerCase());
  const titleTerms = parseCsvArg(input.currentTitle?.toLowerCase());
  const companyTerms = parseCsvArg(input.pastCompany?.toLowerCase());
  const skillTerms = parseCsvArg(input.skills?.toLowerCase());
  const languageTerms = parseCsvArg(input.language?.toLowerCase());
  const industryTerms = parseCsvArg(input.industry?.toLowerCase());
  const seniorityTerms = parseCsvArg(input.seniority?.toLowerCase());

  return candidates.filter((candidate) => {
    const haystack = [
      candidate.name,
      candidate.headline,
      candidate.location,
      candidate.current_company,
      candidate.current_title,
      candidate.match_signals,
    ].join(' ').toLowerCase();

    const openToWork = toYesNo(candidate.open_to_work);
    const matchesAll = (terms: string[]) => terms.every(term => haystack.includes(term));

    if (queryTerms.length > 0 && !matchesAll(queryTerms)) return false;
    if (locationTerms.length > 0 && !matchesAll(locationTerms)) return false;
    if (titleTerms.length > 0 && !matchesAll(titleTerms)) return false;
    if (companyTerms.length > 0 && !matchesAll(companyTerms)) return false;
    if (skillTerms.length > 0 && !matchesAll(skillTerms)) return false;
    if (languageTerms.length > 0 && !matchesAll(languageTerms)) return false;
    if (industryTerms.length > 0 && !matchesAll(industryTerms)) return false;
    if (seniorityTerms.length > 0 && !matchesAll(seniorityTerms)) return false;
    if (typeof input.openToWork === 'boolean' && openToWork && openToWork !== toYesNo(input.openToWork)) return false;

    return true;
  });
}

export function listToMultiline(items: string[]): string {
  return items.map(item => normalizeWhitespace(item)).filter(Boolean).join('\n');
}

function serializeArg(value: unknown): string {
  return JSON.stringify(value).replace(/<\/(script)/gi, '<\\/$1');
}

export function buildPageEval<TArgs extends unknown[]>(
  fn: (...args: TArgs) => unknown,
  ...args: TArgs
): string {
  return `(${fn.toString()})(${args.map(arg => serializeArg(arg)).join(',')})`;
}

function detectLinkedinSurfaceInPage(): SurfaceDetectionResult {
  const path = String(window.location.pathname || '');
  const currentUrl = window.location.href;
  const loginRequired = path.includes('/login')
    || path.includes('/checkpoint/')
    || Boolean(document.querySelector('input[name="session_key"], form.login__form'));
  const recruiterDetected = path.includes('/talent/')
    || path.includes('/recruiter/')
    || Boolean(document.querySelector('[href*="/talent/search"], [data-test-recruiter-layout], [data-live-test-recruiter]'));
  const publicProfileDetected = /^\/in\/[^/]+\/?$/.test(path)
    || Boolean(document.querySelector('main h1, .pv-top-card, [data-view-name="profile-component-entity"]'));

  return { currentUrl, loginRequired, recruiterDetected, publicProfileDetected };
}

function seedRecruiterSearchInPage(input: RecruiterPeopleSearchInput): { applied: boolean; attempted: string[] } {
  const attempted: string[] = [];
  const setInputValue = (selectors: string[], value: string) => {
    if (!value) return false;
    for (const selector of selectors) {
      const element = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector);
      if (!element) continue;
      attempted.push(selector);
      element.focus();
      element.value = value;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      element.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
      return true;
    }
    return false;
  };

  const appliedKeyword = setInputValue([
    'input[placeholder*="Search"]',
    'input[aria-label*="Search"]',
    'input[data-test-search-input]',
    'input[role="combobox"]',
  ], input.query);
  const appliedLocation = setInputValue([
    'input[placeholder*="Location"]',
    'input[aria-label*="Location"]',
  ], input.location || '');

  return { applied: appliedKeyword || appliedLocation, attempted };
}

function extractRecruiterPeopleCardsInPage(listSource: string): RecruiterCandidateSummary[] {
  const normalize = (value: unknown) => String(value ?? '').replace(/\s+/g, ' ').trim();
  const uniq = (values: string[]) => [...new Set(values.map(value => normalize(value)).filter(Boolean))];
  const base64UrlEncode = (value: string) => btoa(unescape(encodeURIComponent(value)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
  const decodeRedirect = (href: string) => {
    try {
      const parsed = new URL(href, window.location.origin);
      if (parsed.pathname === '/redir/redirect/') {
        return parsed.searchParams.get('url') || href;
      }
      return parsed.toString();
    } catch {
      return href;
    }
  };
  const pickProfileLink = (root: Element): HTMLAnchorElement | null => {
    const links = Array.from(root.querySelectorAll('a[href]')) as HTMLAnchorElement[];
    return links.find(link => /\/in\/|\/talent\/profile\//.test(link.href)) || null;
  };
  const inferCurrentRole = (headline: string): { title: string; company: string } => {
    const normalized = normalize(headline);
    const atMatch = normalized.match(/^(.+?)\s+at\s+(.+)$/i);
    if (atMatch) return { title: normalize(atMatch[1]), company: normalize(atMatch[2]) };
    const dotMatch = normalized.split(' · ');
    if (dotMatch.length >= 2) return { title: dotMatch[0], company: dotMatch.slice(1).join(' · ') };
    return { title: normalized, company: '' };
  };

  const roots = new Set<Element>();
  for (const link of Array.from(document.querySelectorAll('a[href*="/in/"], a[href*="/talent/profile/"]'))) {
    const root = link.closest(
      'li, article, [data-test-search-result-card], [data-testid*="candidate"], [data-urn], .artdeco-list__item',
    ) || link.parentElement;
    if (root) roots.add(root);
  }

  const candidates: RecruiterCandidateSummary[] = [];
  for (const root of roots) {
    const profileLink = pickProfileLink(root);
    const profileUrl = profileLink ? decodeRedirect(profileLink.href) : '';
    const candidateIdAttr = root.getAttribute('data-urn')
      || root.getAttribute('data-member-urn')
      || root.getAttribute('data-profile-urn')
      || '';
    const candidateId = profileUrl ? `url:${base64UrlEncode(profileUrl)}` : normalize(candidateIdAttr);

    const textLines = uniq(String((root as HTMLElement).innerText || '').split('\n'));
    const name = normalize(
      profileLink?.textContent
      || root.querySelector('[data-anonymize="person-name"], [data-test-person-name]')?.textContent
      || textLines[0]
      || ''
    );
    if (!name) continue;

    const connectionDegree = textLines.find(line => /(?:^|\s)(1st|2nd|3rd)(?:\s|$)/i.test(line)) || '';
    const location = normalize(
      root.querySelector('[data-anonymize="location"], [data-test-location]')?.textContent
      || textLines.find(line => /,/.test(line) || /(united states|europe|singapore|london|berlin|dubai|remote)/i.test(line))
      || ''
    );
    const headline = normalize(
      root.querySelector('[data-anonymize="headline"], [data-test-headline], [data-test-job-title]')?.textContent
      || textLines.find(line => line !== name && line !== connectionDegree && line !== location)
      || ''
    );
    const inferredRole = inferCurrentRole(headline);

    const signalCandidates = textLines.filter(line => /open to work|shared|mutual|recently active|actively hiring|actively interviewing|skills?/i.test(line));
    const matchSignals = uniq(signalCandidates).join('; ');
    const openToWork = /open to work/i.test(`${headline} ${matchSignals}`) ? 'yes' : 'no';

    candidates.push({
      candidate_id: candidateId,
      profile_url: profileUrl,
      name,
      headline,
      location,
      current_company: inferredRole.company,
      current_title: inferredRole.title,
      connection_degree: normalize(connectionDegree),
      open_to_work: openToWork,
      match_signals: matchSignals,
      list_source: listSource,
    });
  }

  return candidates;
}

function extractRecruiterProfileInPage(candidateIdHint: string, listSource: string): RecruiterCandidateProfile | null {
  const normalize = (value: unknown) => String(value ?? '').replace(/\s+/g, ' ').trim();
  const uniq = (values: string[]) => [...new Set(values.map(value => normalize(value)).filter(Boolean))];
  const base64UrlEncode = (value: string) => btoa(unescape(encodeURIComponent(value)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

  const canonicalLink = (() => {
    const direct = document.querySelector<HTMLAnchorElement>('a[href*="/in/"], a[href*="/talent/profile/"]');
    return direct?.href || window.location.href;
  })();

  const readSectionLines = (keywords: string[]) => {
    const sections = Array.from(document.querySelectorAll('section, div'));
    const match = sections.find((section) => {
      const heading = normalize(section.querySelector('h1, h2, h3, h4, header')?.textContent || '');
      return keywords.some(keyword => heading.toLowerCase() === keyword.toLowerCase());
    });
    if (!match) return [];
    return uniq(String((match as HTMLElement).innerText || '').split('\n').slice(1));
  };

  const textLines = uniq(String((document.body as HTMLElement).innerText || '').split('\n'));
  const name = normalize(
    document.querySelector('main h1, h1[data-anonymize="person-name"], [data-test-person-name]')?.textContent
    || textLines[0]
    || ''
  );
  if (!name) return null;

  const headline = normalize(
    document.querySelector('[data-anonymize="headline"], [data-test-headline], .text-body-medium')?.textContent
    || textLines.find(line => line !== name)
    || ''
  );
  const location = normalize(
    document.querySelector('[data-anonymize="location"], [data-test-location]')?.textContent
    || textLines.find(line => /(remote|united states|canada|europe|uk|singapore|germany|france|india|australia)/i.test(line))
    || ''
  );
  const about = normalize(readSectionLines(['about', 'summary']).join(' '));
  const workHistoryLines = readSectionLines(['experience', 'work experience']);
  const educationLines = readSectionLines(['education']);
  const skillLines = readSectionLines(['skills']);
  const languageLines = readSectionLines(['languages', 'language proficiency']);

  const topSignals = textLines.filter(line => /open to work|mutual connection|recently active|email available|message candidate|inmail/i.test(line));
  const connectionDegree = textLines.find(line => /(?:^|\s)(1st|2nd|3rd)(?:\s|$)/i.test(line)) || '';
  const mutualConnections = textLines.find(line => /mutual connection/i.test(line)) || '';
  const recentActivity = textLines.find(line => /recently active|active today|active this week/i.test(line)) || '';
  const contactVisibility = uniq(textLines.filter(line => /message|inmail|email available|open profile|connect/i.test(line))).join('; ');
  const openToWork = /open to work/i.test(`${headline} ${topSignals.join(' ')}`) ? 'yes' : 'no';

  const firstExperience = workHistoryLines[0] || headline;
  const atMatch = normalize(firstExperience).match(/^(.+?)\s+at\s+(.+)$/i);
  const currentTitle = atMatch ? normalize(atMatch[1]) : normalize(firstExperience.split(' · ')[0] || headline);
  const currentCompany = atMatch ? normalize(atMatch[2]) : normalize(firstExperience.split(' · ').slice(1).join(' · '));

  const profileUrl = canonicalLink;
  const candidateId = candidateIdHint || `url:${base64UrlEncode(profileUrl)}`;

  return {
    candidate_id: candidateId,
    profile_url: profileUrl,
    name,
    headline,
    location,
    about,
    current_company: currentCompany,
    current_title: currentTitle,
    connection_degree: normalize(connectionDegree),
    open_to_work: openToWork,
    mutual_connections: normalize(mutualConnections),
    recent_activity: normalize(recentActivity),
    contact_visibility: contactVisibility,
    skills: skillLines.join('\n'),
    languages: languageLines.join('\n'),
    education: educationLines.join('\n'),
    work_history: workHistoryLines.join('\n'),
    list_source: listSource,
  };
}

function extractRecruiterProjectsInPage(): RecruiterProjectSummary[] {
  const normalize = (value: unknown) => String(value ?? '').replace(/\s+/g, ' ').trim();
  const uniq = (values: string[]) => [...new Set(values.map(value => normalize(value)).filter(Boolean))];
  const projects: RecruiterProjectSummary[] = [];
  const roots = new Set<Element>();

  for (const link of Array.from(document.querySelectorAll('a[href*="/talent/project"], a[href*="/talent/projects"]'))) {
    const root = link.closest('li, article, section, [data-project-id], .artdeco-list__item') || link.parentElement;
    if (root) roots.add(root);
  }

  for (const root of roots) {
    const link = root.querySelector<HTMLAnchorElement>('a[href*="/talent/project"], a[href*="/talent/projects"]');
    const href = link?.href || '';
    const projectId = root.getAttribute('data-project-id')
      || href.match(/projects?\/([^/?#]+)/i)?.[1]
      || '';
    const lines = uniq(String((root as HTMLElement).innerText || '').split('\n'));
    if (!projectId && lines.length === 0) continue;

    projects.push({
      project_id: projectId,
      name: normalize(link?.textContent || lines[0] || ''),
      description: normalize(lines[1] || ''),
      status: normalize(lines.find(line => /open|active|closed|archived|draft/i.test(line)) || ''),
      candidate_count: normalize(lines.find(line => /\d+/.test(line) && /candidate|profile|lead/i.test(line)) || ''),
      updated_at: normalize(lines.find(line => /updated|ago|today|yesterday/i.test(line)) || ''),
      url: href,
    });
  }

  return projects;
}

function extractRecruiterSavedSearchesInPage(): RecruiterSavedSearchSummary[] {
  const normalize = (value: unknown) => String(value ?? '').replace(/\s+/g, ' ').trim();
  const uniq = (values: string[]) => [...new Set(values.map(value => normalize(value)).filter(Boolean))];
  const searches: RecruiterSavedSearchSummary[] = [];
  const roots = new Set<Element>();

  for (const link of Array.from(document.querySelectorAll('a[href*="saved"], a[href*="search"]'))) {
    const root = link.closest('li, article, section, [data-search-id], .artdeco-list__item') || link.parentElement;
    if (root && /saved search|alert/i.test(String((root as HTMLElement).innerText || ''))) roots.add(root);
  }

  for (const root of roots) {
    const link = root.querySelector<HTMLAnchorElement>('a[href]');
    const href = link?.href || '';
    const searchId = root.getAttribute('data-search-id')
      || href.match(/saved[^/?#]*\/([^/?#]+)/i)?.[1]
      || href.match(/[?&]searchId=([^&]+)/i)?.[1]
      || '';
    const lines = uniq(String((root as HTMLElement).innerText || '').split('\n'));
    if (!searchId && lines.length === 0) continue;

    searches.push({
      search_id: searchId,
      name: normalize(link?.textContent || lines[0] || ''),
      query: normalize(lines.find(line => /title:|company:|location:|keyword/i.test(line)) || lines[1] || ''),
      cadence: normalize(lines.find(line => /daily|weekly|instant|alert/i.test(line)) || ''),
      result_count: normalize(lines.find(line => /\d+/.test(line) && /result|candidate|profile/i.test(line)) || ''),
      url: href,
    });
  }

  return searches;
}

function extractRecruiterInboxThreadsInPage(listSource: string): RecruiterInboxThreadSummary[] {
  const normalize = (value: unknown) => String(value ?? '').replace(/\s+/g, ' ').trim();
  const uniq = (values: string[]) => [...new Set(values.map(value => normalize(value)).filter(Boolean))];
  const base64UrlEncode = (value: string) => btoa(unescape(encodeURIComponent(value)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
  const decodeRedirect = (href: string) => {
    try {
      const parsed = new URL(href, window.location.origin);
      if (parsed.pathname === '/redir/redirect/') {
        return parsed.searchParams.get('url') || href;
      }
      return parsed.toString();
    } catch {
      return href;
    }
  };
  const textOf = (root: Element | null | undefined) => normalize(
    `${(root as HTMLElement | null)?.innerText || ''} ${(root as HTMLElement | null)?.getAttribute?.('aria-label') || ''} ${(root as HTMLElement | null)?.getAttribute?.('title') || ''}`,
  );
  const isVisible = (el: Element | null | undefined) => {
    if (!el) return false;
    const rect = (el as HTMLElement).getBoundingClientRect?.();
    const style = window.getComputedStyle(el as Element);
    return Boolean(rect && rect.width >= 0 && rect.height >= 0 && style.visibility !== 'hidden' && style.display !== 'none');
  };
  const roots = new Set<Element>();
  const threadLikeSelectors = [
    '[data-conversation-id]',
    'a[href*="/talent/messages"]',
    'a[href*="/messaging/thread"]',
    'a[href*="/messages/thread"]',
    'a[href*="conversationId="]',
    '[data-test-conversation-list-item]',
    '[data-testid*="conversation"]',
  ];

  for (const selector of threadLikeSelectors) {
    for (const node of Array.from(document.querySelectorAll(selector))) {
      const root = node.closest('li, article, section, [role="listitem"], .artdeco-list__item, aside > div') || node.parentElement;
      if (root && isVisible(root)) roots.add(root);
    }
  }

  const threads: RecruiterInboxThreadSummary[] = [];
  for (const root of roots) {
    const links = Array.from(root.querySelectorAll('a[href]')) as HTMLAnchorElement[];
    const profileLink = links.find(link => /\/in\/|\/talent\/profile\//.test(link.href));
    const messageLink = links.find(link => /\/talent\/messages|\/messaging\/thread|\/messages\/thread|conversationId=/.test(link.href));
    const profileUrl = profileLink ? decodeRedirect(profileLink.href) : '';
    const conversationId = normalize(
      root.getAttribute('data-conversation-id')
      || root.getAttribute('data-thread-id')
      || root.getAttribute('data-id')
      || messageLink?.href.match(/conversation(?:Id)?[=/]([^&#/?]+)/i)?.[1]
      || messageLink?.href.match(/messages\/thread\/([^/?#]+)/i)?.[1]
      || '',
    );
    const candidateUrn = root.getAttribute('data-member-urn')
      || root.getAttribute('data-profile-urn')
      || root.getAttribute('data-urn')
      || '';
    const candidateId = profileUrl ? `url:${base64UrlEncode(profileUrl)}` : normalize(candidateUrn);
    const textLines = uniq(String((root as HTMLElement).innerText || '').split('\n'));
    const name = normalize(
      profileLink?.textContent
      || root.querySelector('[data-anonymize="person-name"], [data-test-person-name], strong')?.textContent
      || textLines[0]
      || ''
    );
    const headline = normalize(
      root.querySelector('[data-anonymize="headline"], [data-test-headline], [data-test-job-title]')?.textContent
      || textLines.find(line => line !== name && !/(^\d+$|unread|new$)/i.test(line))
      || ''
    );
    const lastTime = normalize(
      root.querySelector('time')?.textContent
      || textLines.find(line => /\b(today|yesterday|ago|mon|tue|wed|thu|fri|sat|sun|\d{1,2}:\d{2}|\d{1,2}\/\d{1,2})\b/i.test(line))
      || ''
    );
    const unread = normalize(
      root.querySelector('[aria-label*="unread"], [data-test-unread-count], [data-testid*="unread"]')?.textContent
      || textLines.find(line => /^(\d+|unread|new)$/i.test(line))
      || ''
    );
    const lastMessage = normalize(
      root.querySelector('[data-test-last-message], [data-testid*="message-snippet"], p, .conversation-snippet')?.textContent
      || [...textLines].reverse().find(line => line !== name && line !== headline && line !== lastTime && line !== unread)
      || ''
    );

    if (!name && !conversationId && !candidateId) continue;

    threads.push({
      conversation_id: conversationId,
      candidate_id: candidateId,
      profile_url: profileUrl,
      name,
      headline,
      last_message: lastMessage,
      last_time: lastTime,
      unread,
      list_source: listSource,
    });
  }

  return threads;
}

function readRecruiterConversationMessagesInPage(
  conversationId: string,
  candidateId: string,
  profileUrl: string,
  limit: number,
  listSource: string,
): Promise<RecruiterInboxMessage[] | { error: string }> {
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  const normalize = (value: unknown) => String(value ?? '').replace(/\s+/g, ' ').trim();
  const isVisible = (el: Element | null | undefined) => {
    if (!el) return false;
    const rect = (el as HTMLElement).getBoundingClientRect?.();
    const style = window.getComputedStyle(el as Element);
    return Boolean(rect && rect.width >= 0 && rect.height >= 0 && style.visibility !== 'hidden' && style.display !== 'none');
  };
  const textOf = (root: Element | null | undefined) => normalize(
    `${(root as HTMLElement | null)?.innerText || ''} ${(root as HTMLElement | null)?.getAttribute?.('aria-label') || ''} ${(root as HTMLElement | null)?.getAttribute?.('title') || ''}`,
  );
  const hrefMatches = (href: string, target: string) => normalize(href).toLowerCase().includes(normalize(target).toLowerCase());
  const findThreadRoot = () => {
    const threadRoots = Array.from(document.querySelectorAll(
      '[data-conversation-id], [data-test-conversation-list-item], [data-testid*="conversation"], li, article, [role="listitem"], .artdeco-list__item',
    ));
    const normalizedConversationId = normalize(conversationId);
    const normalizedCandidateId = normalize(candidateId);
    const normalizedProfileUrl = normalize(profileUrl);

    return threadRoots.find((root) => {
      if (!isVisible(root)) return false;
      const links = Array.from(root.querySelectorAll('a[href]')) as HTMLAnchorElement[];
      const rootConversationId = normalize(
        root.getAttribute('data-conversation-id')
        || root.getAttribute('data-thread-id')
        || root.getAttribute('data-id')
        || links.find(link => /conversationId=|\/messages\/thread\/|\/messaging\/thread\//.test(link.href))?.href.match(/conversation(?:Id)?[=/]([^&#/?]+)/i)?.[1]
        || links.find(link => /\/messages\/thread\/|\/messaging\/thread\//.test(link.href))?.href.match(/messages\/thread\/([^/?#]+)/i)?.[1]
        || '',
      );
      const rootProfileUrl = normalize(
        links.find(link => /\/in\/|\/talent\/profile\//.test(link.href))?.href || '',
      );
      const rootCandidateId = normalize(
        root.getAttribute('data-member-urn')
        || root.getAttribute('data-profile-urn')
        || root.getAttribute('data-urn')
        || '',
      );
      return Boolean(
        (normalizedConversationId && rootConversationId === normalizedConversationId)
        || (normalizedProfileUrl && rootProfileUrl && hrefMatches(rootProfileUrl, normalizedProfileUrl))
        || (normalizedCandidateId && (rootCandidateId === normalizedCandidateId || textOf(root).includes(normalizedCandidateId))),
      );
    }) as HTMLElement | undefined;
  };
  const findMessagesRegion = () => {
    const selectors = [
      '[data-test-conversation-view]',
      '[data-testid*="conversation-view"]',
      '[role="main"]',
      'main',
      '.msg-thread',
      '.conversation-view',
      'section',
    ];
    for (const selector of selectors) {
      const regions = Array.from(document.querySelectorAll(selector));
      const target = regions.find((region) => {
        if (!isVisible(region)) return false;
        const text = textOf(region).toLowerCase();
        return /message|reply|inmail|conversation/.test(text);
      });
      if (target) return target as HTMLElement;
    }
    return null;
  };
  const collectMessages = (root: ParentNode): RecruiterInboxMessage[] => {
    const nodes = Array.from(root.querySelectorAll(
      '[data-message-id], [data-testid*="message"], [role="listitem"], li, article, .msg-s-message-list__event',
    ));
    const seen = new Set<string>();
    const messages: RecruiterInboxMessage[] = [];
    for (const node of nodes) {
      if (!isVisible(node)) continue;
      const container = (node.closest('[data-message-id], [data-testid*="message"], li, article, .msg-s-message-list__event') || node) as HTMLElement;
      const lines = String(container.innerText || '')
        .split('\n')
        .map(value => normalize(value))
        .filter(Boolean);
      if (lines.length === 0) continue;

      const from = normalize(
        container.getAttribute('data-sender-name')
        || container.querySelector('[data-test-message-sender], [data-testid*="sender"], strong, h4')?.textContent
        || lines[0]
        || ''
      );
      const time = normalize(
        container.querySelector('time')?.textContent
        || lines.find(line => /\b(today|yesterday|ago|am|pm|\d{1,2}:\d{2}|\d{1,2}\/\d{1,2})\b/i.test(line))
        || ''
      );
      const text = normalize(
        container.querySelector('[data-test-message-body], [data-testid*="message-body"], p, [dir="ltr"]')?.textContent
        || lines.filter(line => line !== from && line !== time).join(' ')
      );
      const lowerText = textOf(container).toLowerCase();
      const direction = /self|me|outgoing|sent/.test(
        `${container.getAttribute('data-message-direction') || ''} ${container.className || ''} ${lowerText}`,
      ) ? 'outgoing' : 'incoming';
      const type = /inmail/i.test(lowerText) ? 'inmail' : 'text';
      const dedupeKey = [from, time, text].join('::');
      if (!text || seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      messages.push({
        conversation_id: normalize(conversationId),
        candidate_id: normalize(candidateId),
        profile_url: normalize(profileUrl),
        from,
        direction,
        type,
        text,
        time,
        list_source: listSource,
      });
    }
    return messages;
  };

  return (async () => {
    const thread = findThreadRoot();
    if (thread) {
      thread.click();
      await sleep(900);
    } else if (!normalize(conversationId) && !normalize(candidateId) && !normalize(profileUrl)) {
      return { error: 'conversation-id, candidate-id, or profile-url is required.' };
    }

    let region = findMessagesRegion();
    if (!region) {
      await sleep(700);
      region = findMessagesRegion();
    }
    if (!region) {
      return { error: 'No visible LinkedIn Recruiter conversation view was found.' };
    }

    const messages = collectMessages(region).slice(-Math.max(1, limit));
    if (messages.length === 0) {
      return { error: 'No visible messages were found in the selected Recruiter conversation.' };
    }
    return messages;
  })();
}

function replyRecruiterConversationInPage(
  conversationId: string,
  candidateId: string,
  profileUrl: string,
  text: string,
  listSource: string,
): Promise<RecruiterInboxReplyResult | { error: string }> {
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  const normalize = (value: unknown) => String(value ?? '').replace(/\s+/g, ' ').trim();
  const isVisible = (el: Element | null | undefined) => {
    if (!el) return false;
    const rect = (el as HTMLElement).getBoundingClientRect?.();
    const style = window.getComputedStyle(el as Element);
    return Boolean(rect && rect.width >= 0 && rect.height >= 0 && style.visibility !== 'hidden' && style.display !== 'none');
  };
  const textOf = (root: Element | null | undefined) => normalize(
    `${(root as HTMLElement | null)?.innerText || ''} ${(root as HTMLElement | null)?.getAttribute?.('aria-label') || ''} ${(root as HTMLElement | null)?.getAttribute?.('title') || ''}`,
  );
  const hrefMatches = (href: string, target: string) => normalize(href).toLowerCase().includes(normalize(target).toLowerCase());
  const findThreadRoot = () => {
    const threadRoots = Array.from(document.querySelectorAll(
      '[data-conversation-id], [data-test-conversation-list-item], [data-testid*="conversation"], li, article, [role="listitem"], .artdeco-list__item',
    ));
    const normalizedConversationId = normalize(conversationId);
    const normalizedCandidateId = normalize(candidateId);
    const normalizedProfileUrl = normalize(profileUrl);

    return threadRoots.find((root) => {
      if (!isVisible(root)) return false;
      const links = Array.from(root.querySelectorAll('a[href]')) as HTMLAnchorElement[];
      const rootConversationId = normalize(
        root.getAttribute('data-conversation-id')
        || root.getAttribute('data-thread-id')
        || root.getAttribute('data-id')
        || links.find(link => /conversationId=|\/messages\/thread\/|\/messaging\/thread\//.test(link.href))?.href.match(/conversation(?:Id)?[=/]([^&#/?]+)/i)?.[1]
        || links.find(link => /\/messages\/thread\/|\/messaging\/thread\//.test(link.href))?.href.match(/messages\/thread\/([^/?#]+)/i)?.[1]
        || '',
      );
      const rootProfileUrl = normalize(
        links.find(link => /\/in\/|\/talent\/profile\//.test(link.href))?.href || '',
      );
      const rootCandidateId = normalize(
        root.getAttribute('data-member-urn')
        || root.getAttribute('data-profile-urn')
        || root.getAttribute('data-urn')
        || '',
      );
      return Boolean(
        (normalizedConversationId && rootConversationId === normalizedConversationId)
        || (normalizedProfileUrl && rootProfileUrl && hrefMatches(rootProfileUrl, normalizedProfileUrl))
        || (normalizedCandidateId && (rootCandidateId === normalizedCandidateId || textOf(root).includes(normalizedCandidateId))),
      );
    }) as HTMLElement | undefined;
  };
  const findReplyComposer = () => {
    const selectors = [
      'textarea',
      'div[role="textbox"][contenteditable="true"]',
      '[contenteditable="true"][data-placeholder]',
      'div[contenteditable="true"]',
      '[role="textbox"]',
    ];
    for (const selector of selectors) {
      const nodes = Array.from(document.querySelectorAll(selector));
      const target = nodes.find((el) => {
        if (!isVisible(el)) return false;
        const text = textOf(el).toLowerCase();
        const placeholder = normalize((el as HTMLElement).getAttribute?.('placeholder') || (el as HTMLElement).getAttribute?.('data-placeholder') || '').toLowerCase();
        return /reply|message|inmail/.test(`${text} ${placeholder}`);
      });
      if (target) return target as HTMLElement;
    }
    return null;
  };
  const setComposerValue = (el: HTMLElement, value: string) => {
    el.focus();
    if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
      el.value = value;
    } else {
      el.textContent = value;
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  };
  const clickFirst = (terms: string[], root: ParentNode = document) => {
    const candidates = Array.from(root.querySelectorAll('button, a[role="button"], [role="button"], span[role="button"]'))
      .filter((el) => isVisible(el) && terms.some(term => textOf(el).toLowerCase().includes(term)));
    const target = candidates[0] as HTMLElement | undefined;
    if (target) {
      target.click();
      return true;
    }
    return false;
  };

  return (async () => {
    const normalizedText = normalize(text);
    if (!normalizedText) return { error: 'text is required.' };

    const thread = findThreadRoot();
    if (thread) {
      thread.click();
      await sleep(900);
    } else if (!normalize(conversationId) && !normalize(candidateId) && !normalize(profileUrl)) {
      return { error: 'conversation-id, candidate-id, or profile-url is required.' };
    }

    let composer = findReplyComposer();
    if (!composer) {
      clickFirst(['reply', 'message', 'send message', 'inmail']);
      await sleep(700);
      composer = findReplyComposer();
    }
    if (!composer) {
      return { error: 'No visible Recruiter reply composer was found for the selected conversation.' };
    }

    setComposerValue(composer, normalizedText);
    await sleep(250);

    const sent = clickFirst(['send', 'send message', 'send inmail']);
    if (!sent) {
      return { error: 'Reply composer opened, but no send button was found.' };
    }

    await sleep(900);

    const resolvedConversationId = normalize(
      conversationId
      || document.body.getAttribute('data-conversation-id')
      || window.location.href.match(/conversation(?:Id)?[=/]([^&#/?]+)/i)?.[1]
      || window.location.href.match(/messages\/thread\/([^/?#]+)/i)?.[1]
      || '',
    );
    const resolvedProfileUrl = normalize(
      profileUrl
      || document.querySelector<HTMLAnchorElement>('a[href*="/in/"], a[href*="/talent/profile/"]')?.href
      || '',
    );

    return {
      conversation_id: resolvedConversationId,
      candidate_id: normalize(candidateId),
      profile_url: resolvedProfileUrl,
      status: 'sent',
      detail: `Sent recruiter reply: ${normalizedText}`,
      list_source: listSource,
    };
  })();
}

function sendRecruiterMessageInPage(
  text: string,
  candidateId: string,
  listSource: string,
): Promise<RecruiterMessageResult | { error: string }> {
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  const normalize = (value: unknown) => String(value ?? '').replace(/\s+/g, ' ').trim();
  const isVisible = (el: Element | null | undefined) => {
    if (!el) return false;
    const rect = (el as HTMLElement).getBoundingClientRect?.();
    const style = window.getComputedStyle(el as Element);
    return Boolean(rect && rect.width >= 0 && rect.height >= 0 && style.visibility !== 'hidden' && style.display !== 'none');
  };
  const matchesTerms = (el: Element, terms: string[]) => {
    const haystack = normalize(
      `${(el as HTMLElement).innerText || ''} ${(el as HTMLElement).getAttribute?.('aria-label') || ''} ${(el as HTMLElement).getAttribute?.('title') || ''}`,
    ).toLowerCase();
    return terms.some(term => haystack.includes(term));
  };
  const clickFirst = (terms: string[], root: ParentNode = document) => {
    const candidates = Array.from(root.querySelectorAll('button, a[role="button"], [role="button"], span[role="button"]'))
      .filter((el) => isVisible(el) && matchesTerms(el, terms));
    const target = candidates[0] as HTMLElement | undefined;
    if (target) {
      target.click();
      return true;
    }
    return false;
  };
  const findComposer = (root: ParentNode = document) => {
    const selectors = [
      'textarea',
      'div[role="textbox"][contenteditable="true"]',
      '[contenteditable="true"][data-placeholder]',
      'div[contenteditable="true"]',
      '[role="textbox"]',
    ];
    for (const selector of selectors) {
      const nodes = Array.from(root.querySelectorAll(selector));
      const target = nodes.find((el) => isVisible(el));
      if (target) return target as HTMLElement;
    }
    return null;
  };
  const setComposerValue = (el: HTMLElement, value: string) => {
    el.focus();
    if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
      el.value = value;
    } else {
      el.textContent = value;
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  };

  return (async () => {
    const trimmed = normalize(text);
    if (!trimmed) return { error: 'Message text is required.' };

    let composer = findComposer();
    if (!composer) {
      clickFirst(['message', 'send message', 'inmail', 'send inmail', 'contact']);
      await sleep(800);
      composer = findComposer();
    }

    const dialog = Array.from(document.querySelectorAll('[role="dialog"], .artdeco-modal, aside'))
      .find((el) => isVisible(el));
    if (!composer && dialog) {
      composer = findComposer(dialog);
    }
    if (!composer) {
      return { error: 'No visible message composer was found on the current LinkedIn page.' };
    }

    setComposerValue(composer, trimmed);
    await sleep(250);

    const sendRoot = dialog || document;
    const sent = clickFirst(['send inmail', 'send message', 'send'], sendRoot);
    if (!sent) {
      return { error: 'Message composer opened, but no send button was found.' };
    }

    await sleep(1000);

    const conversationId = normalize(
      (dialog?.getAttribute('data-conversation-id') || '')
      || (document.body.getAttribute('data-conversation-id') || '')
      || (window.location.href.match(/conversation(?:Id)?[=/]([^&#/?]+)/i)?.[1] || '')
      || (window.location.href.match(/messages\/thread\/([^/?#]+)/i)?.[1] || ''),
    );
    const profileUrl = normalize(
      (document.querySelector<HTMLAnchorElement>('a[href*="/in/"], a[href*="/talent/profile/"]')?.href || '')
      || window.location.href,
    );

    return {
      candidate_id: normalize(candidateId),
      conversation_id: conversationId,
      profile_url: profileUrl,
      status: 'sent',
      detail: `Sent LinkedIn message: ${trimmed}`,
      list_source: listSource,
    };
  })();
}

function saveCandidateToProjectInPage(
  projectRef: string,
  candidateId: string,
  listSource: string,
): Promise<RecruiterSaveToProjectResult | { error: string }> {
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  const normalize = (value: unknown) => String(value ?? '').replace(/\s+/g, ' ').trim();
  const normRef = normalize(projectRef).toLowerCase();
  const isVisible = (el: Element | null | undefined) => {
    if (!el) return false;
    const rect = (el as HTMLElement).getBoundingClientRect?.();
    const style = window.getComputedStyle(el as Element);
    return Boolean(rect && rect.width >= 0 && rect.height >= 0 && style.visibility !== 'hidden' && style.display !== 'none');
  };
  const textOf = (el: Element | null | undefined) => normalize(
    `${(el as HTMLElement | null)?.innerText || ''} ${(el as HTMLElement | null)?.getAttribute?.('aria-label') || ''} ${(el as HTMLElement | null)?.getAttribute?.('title') || ''}`,
  );
  const clickFirst = (terms: string[], root: ParentNode = document) => {
    const nodes = Array.from(root.querySelectorAll('button, a[role="button"], [role="button"], span[role="button"]'))
      .filter((el) => isVisible(el) && terms.some(term => textOf(el).toLowerCase().includes(term)));
    const target = nodes[0] as HTMLElement | undefined;
    if (target) {
      target.click();
      return true;
    }
    return false;
  };
  const findProjectPanel = () => Array.from(document.querySelectorAll('[role="dialog"], .artdeco-modal, aside, section'))
    .find((el) => isVisible(el) && /project|pipeline|save/i.test(textOf(el)));
  const findProjectOption = (root: ParentNode) => {
    const candidates = Array.from(root.querySelectorAll('label, li, button, [role="option"], [data-project-id], input[type="checkbox"], input[type="radio"]'));
    for (const node of candidates) {
      const el = node as HTMLElement;
      const datasetBits = [
        el.getAttribute('data-project-id') || '',
        el.getAttribute('data-id') || '',
        el.getAttribute('value') || '',
        textOf(el),
      ].join(' ').toLowerCase();
      if (!datasetBits || !datasetBits.includes(normRef)) continue;
      const clickable = (el.closest('label, button, li, [role="option"]') || el) as HTMLElement;
      return { clickable, name: textOf(clickable) || normalize(projectRef) };
    }
    return null;
  };

  return (async () => {
    if (!normRef) return { error: 'project-id is required.' };

    let panel = findProjectPanel();
    if (!panel) {
      clickFirst(['save to project', 'add to project', 'save', 'project', 'pipeline']);
      await sleep(900);
      panel = findProjectPanel();
    }
    if (!panel) {
      return { error: 'No visible Recruiter project chooser was found on the current page.' };
    }

    let option = findProjectOption(panel);
    if (!option) {
      const searchInput = Array.from(panel.querySelectorAll('input, textarea'))
        .find((el) => isVisible(el) && /search|project/i.test(textOf(el) || el.getAttribute('placeholder') || '')) as HTMLInputElement | undefined;
      if (searchInput) {
        searchInput.focus();
        searchInput.value = normalize(projectRef);
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        searchInput.dispatchEvent(new Event('change', { bubbles: true }));
        await sleep(800);
        option = findProjectOption(panel);
      }
    }
    if (!option) {
      return { error: `Project "${projectRef}" was not visible in the Recruiter project chooser.` };
    }

    option.clickable.click();
    await sleep(300);

    const confirmed = clickFirst(['save', 'add', 'done', 'confirm'], panel);
    if (!confirmed) {
      const checkbox = option.clickable.querySelector<HTMLInputElement>('input[type="checkbox"], input[type="radio"]');
      if (checkbox && !checkbox.checked) checkbox.click();
    }
    await sleep(800);

    const profileUrl = normalize(
      (document.querySelector<HTMLAnchorElement>('a[href*="/in/"], a[href*="/talent/profile/"]')?.href || '')
      || window.location.href,
    );

    return {
      candidate_id: normalize(candidateId),
      project_id: normalize(projectRef),
      project_name: option.name,
      profile_url: profileUrl,
      status: 'saved',
      detail: `Saved candidate to project ${option.name}`,
      list_source: listSource,
    };
  })();
}

function addRecruiterTagInPage(
  tag: string,
  candidateId: string,
  listSource: string,
): Promise<RecruiterTagResult | { error: string }> {
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  const normalize = (value: unknown) => String(value ?? '').replace(/\s+/g, ' ').trim();
  const isVisible = (el: Element | null | undefined) => {
    if (!el) return false;
    const rect = (el as HTMLElement).getBoundingClientRect?.();
    const style = window.getComputedStyle(el as Element);
    return Boolean(rect && rect.width >= 0 && rect.height >= 0 && style.visibility !== 'hidden' && style.display !== 'none');
  };
  const textOf = (el: Element | null | undefined) => normalize(
    `${(el as HTMLElement | null)?.innerText || ''} ${(el as HTMLElement | null)?.getAttribute?.('aria-label') || ''} ${(el as HTMLElement | null)?.getAttribute?.('title') || ''}`,
  );
  const clickFirst = (terms: string[], root: ParentNode = document) => {
    const nodes = Array.from(root.querySelectorAll('button, a[role="button"], [role="button"], span[role="button"]'))
      .filter((el) => isVisible(el) && terms.some(term => textOf(el).toLowerCase().includes(term)));
    const target = nodes[0] as HTMLElement | undefined;
    if (target) {
      target.click();
      return true;
    }
    return false;
  };
  const findPanel = () => Array.from(document.querySelectorAll('[role="dialog"], .artdeco-modal, aside, section'))
    .find((el) => isVisible(el) && /tag|label/i.test(textOf(el)));

  return (async () => {
    const normalizedTag = normalize(tag);
    if (!normalizedTag) return { error: 'tag is required.' };

    let panel = findPanel();
    if (!panel) {
      clickFirst(['tag', 'add tag', 'label']);
      await sleep(900);
      panel = findPanel();
    }
    if (!panel) {
      return { error: 'No visible Recruiter tag chooser was found on the current page.' };
    }

    const inputs = Array.from(panel.querySelectorAll('input, textarea')).filter((el) => isVisible(el));
    const input = inputs[0] as HTMLInputElement | HTMLTextAreaElement | undefined;
    if (input) {
      input.focus();
      input.value = normalizedTag;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      await sleep(700);
    }

    const lowerTag = normalizedTag.toLowerCase();
    const options = Array.from(panel.querySelectorAll('label, li, button, [role="option"], [data-tag-id], input[type="checkbox"], input[type="radio"]'));
    const option = options.find((el) => textOf(el).toLowerCase().includes(lowerTag)) as HTMLElement | undefined;
    if (option) {
      (option.closest('label, button, li, [role="option"]') as HTMLElement | null || option).click();
      await sleep(250);
    }

    const confirmed = clickFirst(['save', 'add', 'done', 'apply', 'create'], panel);
    if (!confirmed && !option) {
      return { error: `Tag "${normalizedTag}" was not visible and no confirm button was available.` };
    }

    await sleep(700);
    const profileUrl = normalize(
      (document.querySelector<HTMLAnchorElement>('a[href*="/in/"], a[href*="/talent/profile/"]')?.href || '')
      || window.location.href,
    );

    return {
      candidate_id: normalize(candidateId),
      tag: normalizedTag,
      profile_url: profileUrl,
      status: 'tagged',
      detail: `Added tag ${normalizedTag}`,
      list_source: listSource,
    };
  })();
}

function addRecruiterNoteInPage(
  note: string,
  candidateId: string,
  listSource: string,
): Promise<RecruiterNoteResult | { error: string }> {
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  const normalize = (value: unknown) => String(value ?? '').replace(/\s+/g, ' ').trim();
  const isVisible = (el: Element | null | undefined) => {
    if (!el) return false;
    const rect = (el as HTMLElement).getBoundingClientRect?.();
    const style = window.getComputedStyle(el as Element);
    return Boolean(rect && rect.width >= 0 && rect.height >= 0 && style.visibility !== 'hidden' && style.display !== 'none');
  };
  const textOf = (el: Element | null | undefined) => normalize(
    `${(el as HTMLElement | null)?.innerText || ''} ${(el as HTMLElement | null)?.getAttribute?.('aria-label') || ''} ${(el as HTMLElement | null)?.getAttribute?.('title') || ''}`,
  );
  const clickFirst = (terms: string[], root: ParentNode = document) => {
    const nodes = Array.from(root.querySelectorAll('button, a[role="button"], [role="button"], span[role="button"]'))
      .filter((el) => isVisible(el) && terms.some(term => textOf(el).toLowerCase().includes(term)));
    const target = nodes[0] as HTMLElement | undefined;
    if (target) {
      target.click();
      return true;
    }
    return false;
  };
  const findComposer = () => {
    const selectors = [
      'textarea',
      'div[role="textbox"][contenteditable="true"]',
      '[contenteditable="true"][data-placeholder]',
      'div[contenteditable="true"]',
      '[role="textbox"]',
    ];
    for (const selector of selectors) {
      const nodes = Array.from(document.querySelectorAll(selector));
      const target = nodes.find((el) => isVisible(el) && /note|notes|add note/i.test(textOf(el) || (el as HTMLElement).getAttribute?.('placeholder') || ''));
      if (target) return target as HTMLElement;
    }
    return null;
  };

  return (async () => {
    const normalizedNote = normalize(note);
    if (!normalizedNote) return { error: 'note is required.' };

    let composer = findComposer();
    if (!composer) {
      clickFirst(['add note', 'note', 'notes']);
      await sleep(900);
      composer = findComposer();
    }
    if (!composer) {
      return { error: 'No visible Recruiter note editor was found on the current page.' };
    }

    composer.focus();
    if (composer instanceof HTMLTextAreaElement || composer instanceof HTMLInputElement) {
      composer.value = normalizedNote;
    } else {
      composer.textContent = normalizedNote;
    }
    composer.dispatchEvent(new Event('input', { bubbles: true }));
    composer.dispatchEvent(new Event('change', { bubbles: true }));
    await sleep(250);

    const saved = clickFirst(['save note', 'save', 'done', 'add note']);
    if (!saved) {
      return { error: 'Note editor opened, but no save button was found.' };
    }

    await sleep(700);
    const profileUrl = normalize(
      (document.querySelector<HTMLAnchorElement>('a[href*="/in/"], a[href*="/talent/profile/"]')?.href || '')
      || window.location.href,
    );

    return {
      candidate_id: normalize(candidateId),
      note: normalizedNote,
      profile_url: profileUrl,
      status: 'saved',
      detail: `Saved recruiter note: ${normalizedNote}`,
      list_source: listSource,
    };
  })();
}

export async function ensureRecruiterSurface(page: IPage, targetUrl: string): Promise<SurfaceDetectionResult> {
  await page.goto(targetUrl);
  await page.wait({ time: 2 });
  const surface = await page.evaluate(buildPageEval(detectLinkedinSurfaceInPage));
  if (surface.loginRequired) {
    throw new AuthRequiredError('linkedin.com', 'LinkedIn Recruiter requires an active signed-in browser session');
  }
  if (!surface.recruiterDetected) {
    throw new CommandExecutionError(
      'LinkedIn Recruiter surface not detected',
      'Open LinkedIn Recruiter in Chrome and make sure your account has Recruiter access.',
    );
  }
  return surface;
}

export async function ensureLinkedinSession(page: IPage, targetUrl: string): Promise<SurfaceDetectionResult> {
  await page.goto(targetUrl);
  await page.wait({ time: 2 });
  const surface = await page.evaluate(buildPageEval(detectLinkedinSurfaceInPage));
  if (surface.loginRequired) {
    throw new AuthRequiredError('linkedin.com', 'LinkedIn requires an active signed-in browser session');
  }
  return surface;
}

export async function trySeedRecruiterSearch(page: IPage, input: RecruiterPeopleSearchInput): Promise<void> {
  await page.evaluate(buildPageEval(seedRecruiterSearchInPage, input));
  await page.wait({ time: 1 });
}

export async function collectRecruiterPeople(
  page: IPage,
  input: RecruiterPeopleSearchInput,
  listSource = 'search',
): Promise<RecruiterCandidateSummary[]> {
  let collected: RecruiterCandidateSummary[] = [];

  for (let i = 0; i < 6 && collected.length < input.limit + input.start; i++) {
    const batch = await page.evaluate(buildPageEval(extractRecruiterPeopleCardsInPage, listSource));
    collected = mergeCandidates(collected, Array.isArray(batch) ? batch : []);
    if (collected.length >= input.limit + input.start) break;
    await page.autoScroll({ times: 1, delayMs: 1200 });
    await page.wait({ time: 1 });
  }

  const filtered = applyVisibleFilters(collected, input);
  const sliced = filtered.slice(input.start, input.start + input.limit);
  if (sliced.length === 0) {
    throw new EmptyResultError(
      'linkedin people-search',
      'No visible recruiter candidates matched the current search. Open the Recruiter search page in Chrome and verify results are visible.',
    );
  }

  return sliced.map((candidate, index) => ({
    rank: input.start + index + 1,
    ...candidate,
  }));
}

export async function extractRecruiterProfile(
  page: IPage,
  candidateId: string,
  listSource = 'profile',
): Promise<RecruiterCandidateProfile> {
  const profile = await page.evaluate(buildPageEval(extractRecruiterProfileInPage, candidateId, listSource));
  if (!profile) {
    throw new EmptyResultError(
      'linkedin profile',
      'No profile data was found on the current page. Open a recruiter candidate profile or public LinkedIn profile in Chrome and try again.',
    );
  }
  return profile as RecruiterCandidateProfile;
}

export async function collectRecruiterProjects(page: IPage): Promise<RecruiterProjectSummary[]> {
  const items = await page.evaluate(buildPageEval(extractRecruiterProjectsInPage));
  if (!Array.isArray(items) || items.length === 0) {
    throw new EmptyResultError(
      'linkedin recruiter-project-list',
      'No Recruiter projects were visible. Open the Projects page in LinkedIn Recruiter and try again.',
    );
  }
  return items.map((item, index) => ({ rank: index + 1, ...(item as RecruiterProjectSummary) }));
}

export async function collectRecruiterSavedSearches(page: IPage): Promise<RecruiterSavedSearchSummary[]> {
  const items = await page.evaluate(buildPageEval(extractRecruiterSavedSearchesInPage));
  if (!Array.isArray(items) || items.length === 0) {
    throw new EmptyResultError(
      'linkedin recruiter-saved-searches',
      'No saved searches were visible. Open the LinkedIn Recruiter saved searches page and try again.',
    );
  }
  return items.map((item, index) => ({ rank: index + 1, ...(item as RecruiterSavedSearchSummary) }));
}

export async function collectRecruiterInboxThreads(
  page: IPage,
  limit: number,
  start = 0,
  listSource = 'inbox',
): Promise<RecruiterInboxThreadSummary[]> {
  let collected: RecruiterInboxThreadSummary[] = [];

  for (let round = 0; round < 6; round += 1) {
    const batch = await page.evaluate(buildPageEval(extractRecruiterInboxThreadsInPage, listSource));
    collected = mergeInboxThreads(collected, Array.isArray(batch) ? batch : []);
    if (collected.length >= start + limit) break;
    await page.autoScroll({ times: 1, delayMs: 1200 });
    await page.wait({ time: 1 });
  }

  const sliced = collected.slice(start, start + limit);
  if (sliced.length === 0) {
    throw new EmptyResultError(
      'linkedin inbox-list',
      'No LinkedIn Recruiter inbox conversations were visible. Open the Recruiter messages page in Chrome and make sure the conversation list is visible.',
    );
  }

  return sliced.map((thread, index) => ({
    rank: start + index + 1,
    ...thread,
  }));
}

export async function readRecruiterInboxMessages(
  page: IPage,
  input: { conversationId?: string; candidateId?: string; profileUrl?: string; limit: number },
  listSource = 'inbox',
): Promise<RecruiterInboxMessage[]> {
  const result = await page.evaluate(buildPageEval(
    readRecruiterConversationMessagesInPage,
    input.conversationId || '',
    input.candidateId || '',
    input.profileUrl || '',
    input.limit,
    listSource,
  ));
  if (!Array.isArray(result) || result.length === 0) {
    throw new EmptyResultError(
      'linkedin inbox-msg',
      result?.error || 'No visible messages were found in the selected LinkedIn Recruiter conversation.',
    );
  }
  return result.map((item, index) => ({
    rank: index + 1,
    ...(item as RecruiterInboxMessage),
  }));
}

export async function replyRecruiterInboxConversation(
  page: IPage,
  input: { conversationId?: string; candidateId?: string; profileUrl?: string; text: string },
  listSource = 'inbox-reply',
): Promise<RecruiterInboxReplyResult> {
  const result = await page.evaluate(buildPageEval(
    replyRecruiterConversationInPage,
    input.conversationId || '',
    input.candidateId || '',
    input.profileUrl || '',
    input.text,
    listSource,
  ));
  if (!result || result.error) {
    throw new CommandExecutionError(
      result?.error || 'Could not send a reply from the selected LinkedIn Recruiter conversation',
      'Open the target Recruiter conversation in Chrome and make sure the reply composer is visible.',
    );
  }
  return result as RecruiterInboxReplyResult;
}

export async function sendRecruiterMessage(
  page: IPage,
  candidateId: string,
  text: string,
  listSource = 'profile',
): Promise<RecruiterMessageResult> {
  const result = await page.evaluate(buildPageEval(sendRecruiterMessageInPage, text, candidateId, listSource));
  if (!result || result.error) {
    throw new CommandExecutionError(
      result?.error || 'Could not send a LinkedIn Recruiter message from the current page',
      'Open a candidate profile in LinkedIn Recruiter and make sure the Message/InMail composer is available.',
    );
  }
  return result as RecruiterMessageResult;
}

export async function saveRecruiterCandidateToProject(
  page: IPage,
  candidateId: string,
  projectId: string,
  listSource = 'profile',
): Promise<RecruiterSaveToProjectResult> {
  const result = await page.evaluate(buildPageEval(saveCandidateToProjectInPage, projectId, candidateId, listSource));
  if (!result || result.error) {
    throw new CommandExecutionError(
      result?.error || 'Could not save the current candidate to a LinkedIn Recruiter project',
      'Open a candidate profile in LinkedIn Recruiter and verify the project chooser is available for your account.',
    );
  }
  return result as RecruiterSaveToProjectResult;
}

export async function addRecruiterTag(
  page: IPage,
  candidateId: string,
  tag: string,
  listSource = 'profile',
): Promise<RecruiterTagResult> {
  const result = await page.evaluate(buildPageEval(addRecruiterTagInPage, tag, candidateId, listSource));
  if (!result || result.error) {
    throw new CommandExecutionError(
      result?.error || 'Could not tag the current LinkedIn Recruiter candidate',
      'Open a candidate profile in LinkedIn Recruiter and verify the tag or label chooser is available.',
    );
  }
  return result as RecruiterTagResult;
}

export async function addRecruiterNote(
  page: IPage,
  candidateId: string,
  note: string,
  listSource = 'profile',
): Promise<RecruiterNoteResult> {
  const result = await page.evaluate(buildPageEval(addRecruiterNoteInPage, note, candidateId, listSource));
  if (!result || result.error) {
    throw new CommandExecutionError(
      result?.error || 'Could not save a LinkedIn Recruiter note on the current page',
      'Open a candidate profile in LinkedIn Recruiter and verify the note editor is available.',
    );
  }
  return result as RecruiterNoteResult;
}

export const __test__ = {
  normalizeWhitespace,
  parseCsvArg,
  toYesNo,
  canonicalizeLinkedinUrl,
  decodeLinkedinRedirect,
  candidateIdFromProfileUrl,
  decodeCandidateId,
  candidateIdFromArtifacts,
  resolveRecruiterProfileUrl,
  buildRecruiterProjectUrl,
  buildRecruiterInboxUrl,
  buildRecruiterInboxThreadUrl,
  buildRecruiterSearchUrl,
  summarizeSignals,
  mergeCandidates,
  mergeInboxThreads,
  summarizeRecruiterPeopleStats,
  summarizeRecruiterInboxStats,
  buildRecruiterFollowUpQueue,
  toRecruiterFollowUpTemplateContext,
  renderRecruiterFollowUpTemplate,
  getRecruiterFollowUpFieldValue,
  presetRecruiterFollowUpExportFields,
  normalizeRecruiterFollowUpFieldMappings,
  exportRecruiterFollowUpQueue,
  applyVisibleFilters,
  listToMultiline,
};
