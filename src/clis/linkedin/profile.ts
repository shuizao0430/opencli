import { ArgumentError } from '../../errors.js';
import { cli, Strategy } from '../../registry.js';
import {
  ensureLinkedinSession,
  extractRecruiterProfile,
  resolveRecruiterProfileUrl,
} from './recruiter-utils.js';

function resolveProfileUrl(candidateId: string | undefined, profileUrl: string | undefined): string {
  const resolved = resolveRecruiterProfileUrl(candidateId, profileUrl);
  if (resolved) return resolved;
  throw new ArgumentError('candidate-id or --profile-url is required');
}

cli({
  site: 'linkedin',
  name: 'profile',
  description: 'Read a LinkedIn Recruiter candidate profile',
  domain: 'www.linkedin.com',
  strategy: Strategy.COOKIE,
  browser: true,
  args: [
    { name: 'candidate-id', type: 'string', positional: true, help: 'Candidate ID from linkedin people-search' },
    { name: 'profile-url', type: 'string', help: 'Explicit public or Recruiter profile URL' },
  ],
  columns: [
    'candidate_id',
    'name',
    'headline',
    'location',
    'current_company',
    'current_title',
    'open_to_work',
    'connection_degree',
    'mutual_connections',
    'recent_activity',
    'contact_visibility',
    'profile_url',
    'about',
    'skills',
    'languages',
    'education',
    'work_history',
    'list_source',
  ],
  func: async (page, kwargs) => {
    const candidateId = String(kwargs['candidate-id'] ?? '').trim();
    const profileUrl = resolveProfileUrl(candidateId, String(kwargs['profile-url'] ?? '').trim() || undefined);
    await ensureLinkedinSession(page, profileUrl);
    return [await extractRecruiterProfile(page, candidateId)];
  },
});

export const __test__ = {
  resolveProfileUrl,
};
