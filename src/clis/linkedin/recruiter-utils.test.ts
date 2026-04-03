import { describe, expect, it } from 'vitest';
import './recruiter-utils.js';

const {
  normalizeWhitespace,
  parseCsvArg,
  toYesNo,
  candidateIdFromProfileUrl,
  decodeCandidateId,
  resolveRecruiterProfileUrl,
  buildRecruiterProjectUrl,
  buildRecruiterInboxUrl,
  buildRecruiterInboxThreadUrl,
  buildRecruiterSearchUrl,
  mergeCandidates,
  mergeInboxThreads,
  summarizeRecruiterPeopleStats,
  summarizeRecruiterInboxStats,
  buildRecruiterFollowUpQueue,
  renderRecruiterFollowUpTemplate,
  presetRecruiterFollowUpExportFields,
  normalizeRecruiterFollowUpFieldMappings,
  exportRecruiterFollowUpQueue,
  applyVisibleFilters,
  listToMultiline,
} = await import('./recruiter-utils.js').then((m) => (m as any).__test__);

describe('linkedin recruiter utils', () => {
  it('normalizes whitespace and csv args', () => {
    expect(normalizeWhitespace('  Senior   Recruiter \n APAC ')).toBe('Senior Recruiter APAC');
    expect(parseCsvArg('english, mandarin ,  sourcing')).toEqual([
      'english',
      'mandarin',
      'sourcing',
    ]);
  });

  it('normalizes open-to-work values', () => {
    expect(toYesNo(true)).toBe('yes');
    expect(toYesNo('Open')).toBe('yes');
    expect(toYesNo('0')).toBe('no');
  });

  it('encodes and decodes candidate ids from profile urls', () => {
    const id = candidateIdFromProfileUrl('https://www.linkedin.com/in/jane-doe/?trk=public_profile');
    expect(id.startsWith('url:')).toBe(true);
    expect(decodeCandidateId(id)).toBe('https://www.linkedin.com/in/jane-doe/');
  });

  it('resolves recruiter profile urls from candidate references', () => {
    expect(resolveRecruiterProfileUrl('url:aHR0cHM6Ly93d3cubGlua2VkaW4uY29tL2luL2phbmUtZG9lLw', undefined)).toBe(
      'https://www.linkedin.com/in/jane-doe/',
    );
    expect(resolveRecruiterProfileUrl('ACoAAA123XYZ', undefined)).toBe(
      'https://www.linkedin.com/talent/profile/ACoAAA123XYZ',
    );
  });

  it('builds recruiter project urls', () => {
    expect(buildRecruiterProjectUrl('project 123')).toBe(
      'https://www.linkedin.com/talent/projects/project%20123',
    );
  });

  it('builds recruiter inbox urls', () => {
    expect(buildRecruiterInboxUrl()).toBe('https://www.linkedin.com/talent/messages');
  });

  it('builds recruiter inbox thread urls', () => {
    expect(buildRecruiterInboxThreadUrl('conv 123')).toBe(
      'https://www.linkedin.com/talent/messages?conversationId=conv%20123',
    );
  });

  it('builds recruiter search urls with recruiter filters', () => {
    const url = buildRecruiterSearchUrl({
      query: 'site reliability engineer',
      location: 'Singapore',
      currentTitle: 'Staff Engineer',
      pastCompany: 'Google',
      industry: 'Internet',
      seniority: 'staff',
      skills: 'kubernetes,go',
      language: 'english',
      openToWork: true,
      limit: 10,
      start: 20,
    });

    expect(url).toContain('https://www.linkedin.com/talent/search?');
    expect(url).toContain('keywords=site+reliability+engineer');
    expect(url).toContain('location=Singapore');
    expect(url).toContain('currentTitle=Staff+Engineer');
    expect(url).toContain('pastCompany=Google');
    expect(url).toContain('openToWork=true');
    expect(url).toContain('start=20');
  });

  it('deduplicates candidates by candidate_id', () => {
    const base = {
      candidate_id: 'url:abc',
      profile_url: 'https://www.linkedin.com/in/a/',
      name: 'A',
      headline: 'Staff Recruiter at Example',
      location: 'London',
      current_company: 'Example',
      current_title: 'Staff Recruiter',
      connection_degree: '2nd',
      open_to_work: 'no',
      match_signals: 'shared connection',
      list_source: 'search',
    };

    const merged = mergeCandidates([base], [base, { ...base, candidate_id: 'url:def', name: 'B' }]);
    expect(merged).toHaveLength(2);
    expect(merged[1].name).toBe('B');
  });

  it('deduplicates inbox threads by conversation_id then candidate_id', () => {
    const base = {
      conversation_id: 'conv-1',
      candidate_id: 'url:abc',
      profile_url: 'https://www.linkedin.com/in/a/',
      name: 'A',
      headline: 'Recruiter',
      last_message: 'Hello',
      last_time: 'Today',
      unread: '1',
      list_source: 'inbox',
    };

    const merged = mergeInboxThreads(
      [base],
      [base, { ...base, conversation_id: 'conv-2', candidate_id: 'url:def', name: 'B' }],
    );
    expect(merged).toHaveLength(2);
    expect(merged[1].name).toBe('B');
  });

  it('summarizes recruiter people and inbox stats', () => {
    const peopleRows = summarizeRecruiterPeopleStats([
      {
        candidate_id: 'url:one',
        profile_url: 'https://www.linkedin.com/in/one/',
        name: 'Jane Recruiter',
        headline: 'Senior Technical Recruiter at Globex',
        location: 'Singapore',
        current_company: 'Globex',
        current_title: 'Senior Technical Recruiter',
        connection_degree: '2nd',
        open_to_work: 'yes',
        match_signals: 'open to work; recent',
        list_source: 'search',
      },
    ]);
    const inboxRows = summarizeRecruiterInboxStats([
      {
        conversation_id: 'conv-1',
        candidate_id: 'url:one',
        profile_url: 'https://www.linkedin.com/in/one/',
        name: 'Jane Recruiter',
        headline: 'Senior Technical Recruiter',
        last_message: 'Thanks, interested',
        last_time: 'Today',
        unread: '1',
        list_source: 'inbox',
      },
    ]);

    expect(peopleRows.find((row: any) => row.metric === 'visible_candidates')?.value).toBe('1');
    expect(inboxRows.find((row: any) => row.metric === 'unread_threads')?.value).toBe('1');
  });

  it('builds a prioritized follow-up queue from inbox threads', () => {
    const queue = buildRecruiterFollowUpQueue([
      {
        conversation_id: 'conv-1',
        candidate_id: 'candidate-1',
        profile_url: 'https://www.linkedin.com/in/a/',
        name: 'Jane',
        headline: 'Recruiter',
        last_message: 'Thanks, I am interested',
        last_time: 'Today',
        unread: '1',
        list_source: 'inbox',
      },
      {
        conversation_id: 'conv-2',
        candidate_id: '',
        profile_url: '',
        name: 'John',
        headline: 'Sourcer',
        last_message: 'Following up later',
        last_time: '1w ago',
        unread: '',
        list_source: 'inbox',
      },
    ]);

    expect(queue[0].conversation_id).toBe('conv-1');
    expect(queue[0].recommended_action).toBe('reply-now');
    expect(queue[0].priority_score).toBeGreaterThan(queue[1].priority_score);
  });

  it('renders follow-up reply templates with queue context', () => {
    expect(renderRecruiterFollowUpTemplate(
      'Hi {{first_name}}, following up on your {{priority}} priority thread.',
      {
        rank: 1,
        priority: 'high',
        priority_score: 8,
        recommended_action: 'reply-now',
        reason: 'thread marked unread',
        conversation_id: 'conv-1',
        candidate_id: 'candidate-1',
        name: 'Jane Doe',
        headline: 'Recruiter',
        last_message: 'Interested',
        last_time: 'Today',
        unread: '1',
        profile_url: 'https://www.linkedin.com/in/a/',
        list_source: 'follow-up-queue',
      },
    )).toBe('Hi Jane, following up on your high priority thread.');
  });

  it('builds export presets and mapped follow-up rows', () => {
    expect(presetRecruiterFollowUpExportFields('sheet')).toEqual(
      expect.arrayContaining(['candidate_id=candidate_id', 'recommended_action=recommended_action']),
    );
    expect(normalizeRecruiterFollowUpFieldMappings(['Candidate ID=candidate_id', 'Priority=priority'])).toEqual([
      { target: 'Candidate ID', source: 'candidate_id' },
      { target: 'Priority', source: 'priority' },
    ]);

    const rows = exportRecruiterFollowUpQueue([
      {
        rank: 1,
        priority: 'high',
        priority_score: 8,
        recommended_action: 'reply-now',
        reason: 'thread marked unread',
        conversation_id: 'conv-1',
        candidate_id: 'candidate-1',
        name: 'Jane Doe',
        headline: 'Recruiter',
        last_message: 'Interested',
        last_time: 'Today',
        unread: '1',
        profile_url: 'https://www.linkedin.com/in/a/',
        list_source: 'follow-up-queue',
      },
    ], {
      fields: ['Candidate ID=candidate_id', 'Name=name'],
      template: 'Hi {{first_name}}',
    });

    expect(rows).toEqual([
      {
        'Candidate ID': 'candidate-1',
        Name: 'Jane Doe',
        next_message: 'Hi Jane',
      },
    ]);
  });

  it('applies visible filters against recruiter summaries', () => {
    const candidates = [
      {
        candidate_id: 'url:one',
        profile_url: 'https://www.linkedin.com/in/one/',
        name: 'Jane Recruiter',
        headline: 'Senior Technical Recruiter at Globex',
        location: 'Singapore',
        current_company: 'Globex',
        current_title: 'Senior Technical Recruiter',
        connection_degree: '2nd',
        open_to_work: 'yes',
        match_signals: 'open to work; english; sourcing',
        list_source: 'search',
      },
      {
        candidate_id: 'url:two',
        profile_url: 'https://www.linkedin.com/in/two/',
        name: 'John Sourcer',
        headline: 'Talent Sourcer at Initech',
        location: 'Berlin',
        current_company: 'Initech',
        current_title: 'Talent Sourcer',
        connection_degree: '3rd',
        open_to_work: 'no',
        match_signals: 'german; sourcing',
        list_source: 'search',
      },
    ];

    const filtered = applyVisibleFilters(candidates, {
      query: 'technical recruiter',
      location: 'singapore',
      skills: 'sourcing',
      language: 'english',
      openToWork: true,
      limit: 10,
      start: 0,
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0].candidate_id).toBe('url:one');
  });

  it('formats multiline list output', () => {
    expect(listToMultiline([' Java ', '', 'Python'])).toBe('Java\nPython');
  });
});
