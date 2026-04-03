import { cli, Strategy } from '../../registry.js';
import {
  buildRecruiterSearchUrl,
  collectRecruiterPeople,
  ensureRecruiterSurface,
  trySeedRecruiterSearch,
  type RecruiterPeopleSearchInput,
} from './recruiter-utils.js';

cli({
  site: 'linkedin',
  name: 'people-search',
  description: 'Search LinkedIn Recruiter candidate results',
  domain: 'www.linkedin.com',
  strategy: Strategy.COOKIE,
  browser: true,
  args: [
    { name: 'query', type: 'string', required: true, positional: true, help: 'Candidate keywords, title, or talent query' },
    { name: 'location', type: 'string', help: 'Location filter such as London or Singapore' },
    { name: 'current-title', type: 'string', help: 'Current title filter' },
    { name: 'past-company', type: 'string', help: 'Past or current company filter' },
    { name: 'industry', type: 'string', help: 'Industry filter' },
    { name: 'seniority', type: 'string', help: 'Seniority filter such as manager, director, staff' },
    { name: 'skills', type: 'string', help: 'Comma-separated skill filters' },
    { name: 'language', type: 'string', help: 'Comma-separated language filters' },
    { name: 'open-to-work', type: 'bool', default: undefined, help: 'Require candidates marked as open to work' },
    { name: 'limit', type: 'int', default: 10, help: 'Number of candidates to return (max 100)' },
    { name: 'start', type: 'int', default: 0, help: 'Result offset after visible filtering' },
  ],
  columns: [
    'rank',
    'candidate_id',
    'name',
    'headline',
    'location',
    'current_company',
    'current_title',
    'connection_degree',
    'open_to_work',
    'match_signals',
    'profile_url',
    'list_source',
  ],
  func: async (page, kwargs) => {
    const input: RecruiterPeopleSearchInput = {
      query: String(kwargs.query ?? '').trim(),
      location: String(kwargs.location ?? '').trim() || undefined,
      currentTitle: String(kwargs['current-title'] ?? '').trim() || undefined,
      pastCompany: String(kwargs['past-company'] ?? '').trim() || undefined,
      industry: String(kwargs.industry ?? '').trim() || undefined,
      seniority: String(kwargs.seniority ?? '').trim() || undefined,
      skills: String(kwargs.skills ?? '').trim() || undefined,
      language: String(kwargs.language ?? '').trim() || undefined,
      openToWork: typeof kwargs['open-to-work'] === 'boolean' ? kwargs['open-to-work'] : undefined,
      limit: Math.max(1, Math.min(Number(kwargs.limit ?? 10), 100)),
      start: Math.max(0, Number(kwargs.start ?? 0)),
    };

    const targetUrl = buildRecruiterSearchUrl(input);
    await ensureRecruiterSurface(page, targetUrl);
    await trySeedRecruiterSearch(page, input);
    return collectRecruiterPeople(page, input, 'search');
  },
});
