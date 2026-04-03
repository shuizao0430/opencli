import { ArgumentError } from '../../errors.js';
import { cli, Strategy } from '../../registry.js';
import {
  ensureRecruiterSurface,
  resolveRecruiterProfileUrl,
  saveRecruiterCandidateToProject,
} from './recruiter-utils.js';

function resolveTargetUrl(candidateId: string | undefined, profileUrl: string | undefined): string {
  const resolved = resolveRecruiterProfileUrl(candidateId, profileUrl);
  if (resolved) return resolved;
  throw new ArgumentError('candidate-id or --profile-url is required');
}

cli({
  site: 'linkedin',
  name: 'save-to-project',
  description: 'Save a LinkedIn Recruiter candidate into a Recruiter project',
  domain: 'www.linkedin.com',
  strategy: Strategy.COOKIE,
  browser: true,
  args: [
    { name: 'candidate-id', type: 'string', positional: true, help: 'Candidate ID from linkedin people-search' },
    { name: 'project-id', type: 'string', required: true, positional: true, help: 'Recruiter project ID or visible project name' },
    { name: 'profile-url', type: 'string', help: 'Explicit Recruiter profile URL' },
  ],
  columns: ['candidate_id', 'project_id', 'project_name', 'profile_url', 'status', 'detail', 'list_source'],
  func: async (page, kwargs) => {
    const candidateId = String(kwargs['candidate-id'] ?? '').trim();
    const projectId = String(kwargs['project-id'] ?? '').trim();
    if (!projectId) throw new ArgumentError('project-id is required');

    const targetUrl = resolveTargetUrl(candidateId, String(kwargs['profile-url'] ?? '').trim() || undefined);
    await ensureRecruiterSurface(page, targetUrl);
    return [await saveRecruiterCandidateToProject(page, candidateId, projectId)];
  },
});

export const __test__ = {
  resolveTargetUrl,
};
