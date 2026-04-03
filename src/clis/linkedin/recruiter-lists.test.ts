import { describe, expect, it } from 'vitest';
import { getRegistry } from '../../registry.js';
import './recruiter-project-list.js';
import './recruiter-project-members.js';
import './recruiter-saved-searches.js';

const { buildProjectUrl } = await import('./recruiter-project-members.js').then(
  (m) => (m as any).__test__,
);

describe('linkedin recruiter list adapters', () => {
  it('registers recruiter project list', () => {
    const command = getRegistry().get('linkedin/recruiter-project-list');
    expect(command).toBeDefined();
    expect(command!.browser).toBe(true);
    expect(command!.columns).toEqual(
      expect.arrayContaining(['project_id', 'name', 'status', 'candidate_count', 'url']),
    );
  });

  it('registers recruiter project members', () => {
    const command = getRegistry().get('linkedin/recruiter-project-members');
    expect(command).toBeDefined();
    expect(command!.args.find((arg) => arg.name === 'project-id')?.required).toBe(true);
    expect(command!.columns).toEqual(
      expect.arrayContaining(['candidate_id', 'name', 'profile_url', 'list_source']),
    );
  });

  it('registers recruiter saved searches', () => {
    const command = getRegistry().get('linkedin/recruiter-saved-searches');
    expect(command).toBeDefined();
    expect(command!.columns).toEqual(
      expect.arrayContaining(['search_id', 'name', 'query', 'cadence', 'result_count', 'url']),
    );
  });
});

describe('buildProjectUrl', () => {
  it('builds recruiter project routes', () => {
    expect(buildProjectUrl('project 123')).toBe(
      'https://www.linkedin.com/talent/projects/project%20123',
    );
  });
});
