# LinkedIn

**Mode**: `Browser` / **Domain**: `linkedin.com`

## Commands

| Command | Description |
|---------|-------------|
| `opencli linkedin search` | Search public LinkedIn job listings |
| `opencli linkedin timeline` | Read posts from your LinkedIn home feed |
| `opencli linkedin people-search` | Search LinkedIn Recruiter candidates |
| `opencli linkedin profile` | Read a LinkedIn Recruiter candidate profile |
| `opencli linkedin recruiter-project-list` | List Recruiter projects |
| `opencli linkedin recruiter-project-members` | List members in a Recruiter project |
| `opencli linkedin recruiter-saved-searches` | List Recruiter saved searches |
| `opencli linkedin message` | Send a Recruiter message or InMail |
| `opencli linkedin save-to-project` | Save a candidate into a Recruiter project |
| `opencli linkedin tag` | Add a Recruiter tag to a candidate |
| `opencli linkedin notes` | Save a Recruiter note on a candidate |
| `opencli linkedin batch-message` | Send the same Recruiter message to multiple candidates |
| `opencli linkedin inbox-list` | List LinkedIn Recruiter inbox conversations |
| `opencli linkedin inbox-msg` | Read messages from a Recruiter inbox conversation |
| `opencli linkedin inbox-reply` | Reply to a Recruiter inbox conversation |
| `opencli linkedin batch-reply` | Reply to multiple Recruiter inbox conversations |
| `opencli linkedin stats` | Summarize live Recruiter search and inbox operating metrics |
| `opencli linkedin follow-up-queue` | Build a prioritized inbox follow-up queue for ATS or spreadsheets |
| `opencli linkedin follow-up-batch-reply` | Filter the follow-up queue, render a template, and send batch replies |
| `opencli linkedin export-follow-up` | Export the follow-up queue with ATS or spreadsheet field presets |

## How To Start

### Run From Source

```bash
npm install
npm run dev -- linkedin people-search "technical recruiter" --location "Singapore" --limit 5
```

### Build And Run Locally

```bash
npm install
npm run build
node dist/main.js linkedin people-search "technical recruiter" --location "Singapore" --limit 5
```

### Install As A CLI

```bash
npm install -g @jackwener/opencli
opencli doctor
opencli linkedin people-search "technical recruiter" --location "Singapore" --limit 5
```

Before running any LinkedIn command:

- Start Chrome
- Log into LinkedIn
- For Recruiter commands, open LinkedIn Recruiter in Chrome first
- Make sure the Browser Bridge extension is installed and connected

## OpenCLI LinkedIn Manual

### Capability Map

OpenCLI supports two LinkedIn surfaces:

- Public LinkedIn:
  - `search`
  - `timeline`
- LinkedIn Recruiter:
  - `people-search`
  - `profile`
  - `recruiter-project-list`
  - `recruiter-project-members`
  - `recruiter-saved-searches`
  - `message`
  - `batch-message`
  - `inbox-list`
  - `inbox-msg`
  - `inbox-reply`
  - `batch-reply`
  - `stats`
  - `follow-up-queue`
  - `follow-up-batch-reply`
  - `export-follow-up`
  - `save-to-project`
  - `tag`
  - `notes`

For international recruiting, the Recruiter commands should be your main workflow.

### Prerequisites

- Chrome running and logged into `linkedin.com`
- For Recruiter commands, your current Chrome session must already have access to LinkedIn Recruiter or Recruiter Lite
- [Browser Bridge extension](/guide/browser-bridge) installed

### Core Workflow

Recommended Recruiter flow:

1. Search candidates with `people-search`
2. Read full candidate detail with `profile`
3. Send outreach with `message`
4. Use `batch-message` for controlled multi-candidate outreach when needed
5. Review active conversations with `inbox-list`
6. Read thread history with `inbox-msg`
7. Continue the conversation with `inbox-reply`
8. Use `batch-reply` for controlled multi-thread follow-up
9. Run `stats` to summarize the current search and inbox operating state
10. Build `follow-up-queue` when you need an exportable prioritized action list
11. Use `follow-up-batch-reply` when you want the queue to drive templated follow-up automatically
12. Use `export-follow-up` when you need ATS-ready or spreadsheet-ready columns
13. Add tags or notes with `tag` and `notes`
14. Save the candidate into a pipeline with `save-to-project`
15. Review projects and saved searches with `recruiter-project-list`, `recruiter-project-members`, and `recruiter-saved-searches`

### Candidate Identifiers

`people-search` returns a stable `candidate_id`. That value can flow directly into:

- `opencli linkedin profile`
- `opencli linkedin message`
- `opencli linkedin batch-message`
- `opencli linkedin save-to-project`
- `opencli linkedin tag`
- `opencli linkedin notes`

If you already have a direct candidate URL, use `--profile-url`.

### Usage Examples

```bash
# Public LinkedIn job search
opencli linkedin search "founding recruiter" --location "Singapore" --limit 5

# Read your public feed
opencli linkedin timeline --limit 5

# Recruiter people search
opencli linkedin people-search "technical recruiter" \
  --location "Singapore" \
  --current-title "Senior Recruiter" \
  --skills "sourcing,stakeholder management" \
  --language "english" \
  --open-to-work true \
  --limit 10

# Read candidate profile from candidate_id
opencli linkedin profile "url:aHR0cHM6Ly93d3cubGlua2VkaW4uY29tL2luL2phbmUtZG9lLw"

# Or use an explicit profile URL
opencli linkedin profile --profile-url "https://www.linkedin.com/in/jane-doe/"

# List Recruiter projects
opencli linkedin recruiter-project-list

# List members in a project
opencli linkedin recruiter-project-members "project-123" --limit 25

# List saved searches
opencli linkedin recruiter-saved-searches

# Send outreach
opencli linkedin message "url:aHR0cHM6Ly93d3cubGlua2VkaW4uY29tL2luL2phbmUtZG9lLw" \
  "Hi Jane, I’m hiring for an international recruiting role and your background looks highly relevant."

# Batch outreach with comma-separated candidate ids
opencli linkedin batch-message \
  "candidate-a,candidate-b,candidate-c" \
  "Hi, I’m reaching out about an international recruiting opportunity." \
  --dry-run

# Batch outreach with one candidate per line and per-target profile URLs
opencli linkedin batch-message \
  "candidate-a|https://www.linkedin.com/in/a/
candidate-b|https://www.linkedin.com/in/b/" \
  "Hi, I’m reaching out about an international recruiting opportunity." \
  --delay-ms 2500 \
  --retries 2

# Review Recruiter inbox conversations
opencli linkedin inbox-list --limit 20
opencli linkedin inbox-list --start 20 --limit 20 -f json

# Read a specific conversation from inbox-list output
opencli linkedin inbox-msg "conversation-123"

# Or match a visible thread by candidate_id
opencli linkedin inbox-msg --candidate-id "url:aHR0cHM6Ly93d3cubGlua2VkaW4uY29tL2luL2phbmUtZG9lLw" --limit 30

# Reply to a thread by conversation_id
opencli linkedin inbox-reply "conversation-123" "Thanks for the reply. Are you open to a quick intro call this week?"

# Short alias
opencli linkedin reply "conversation-123" "Thanks for the quick response."

# Batch reply with one conversation per line
opencli linkedin batch-reply \
  "conversation-123
conversation-456" \
  "Thanks for the update. Happy to share more detail and next steps."

# Batch reply with conversation_id|candidate_id|profile_url
opencli linkedin batch-reply \
  "conversation-123|candidate-a|https://www.linkedin.com/in/a/
conversation-456|candidate-b|https://www.linkedin.com/in/b/" \
  "Thanks for the response. Are you available for a short call this week?" \
  --dry-run

# Summarize inbox operating metrics only
opencli linkedin stats

# Summarize both a recruiter search slice and inbox activity
opencli linkedin stats \
  --query "technical recruiter" \
  --location "Singapore" \
  --search-limit 25 \
  --inbox-limit 50 \
  -f json

# Build a follow-up queue you can export to CSV for spreadsheets or ATS tooling
opencli linkedin follow-up-queue --limit 25 -f csv

# Focus only on unread threads with reusable identifiers
opencli linkedin follow-up-queue \
  --unread-only true \
  --require-candidate-id true \
  --require-profile-url true \
  --limit 50 \
  -f csv

# Render a template against the follow-up queue and preview the replies
opencli linkedin follow-up-batch-reply \
  "Hi {{first_name}}, following up here because {{reason}}. If helpful, I can share more detail and next steps." \
  --priorities "high" \
  --limit 10 \
  --dry-run

# Send templated replies to high and medium priority queue rows
opencli linkedin follow-up-batch-reply \
  "Hi {{first_name}}, following up here because {{reason}}. If helpful, I can share more detail and next steps." \
  --priorities "high,medium" \
  --require-candidate-id true \
  --delay-ms 2500 \
  --retries 2

# Export ATS-ready columns as CSV by default
opencli linkedin export-follow-up --preset ats

# Export spreadsheet-friendly columns plus a suggested next message
opencli linkedin export-follow-up \
  --preset sheet \
  --template "Hi {{first_name}}, following up here because {{reason}}." \
  --unread-only true

# Export with your own sheet or ATS field mapping
opencli linkedin export-follow-up \
  --fields "Candidate ID=candidate_id,Name=name,Priority=priority,Next Step=recommended_action,LinkedIn URL=profile_url" \
  --template "Hi {{first_name}}, following up here because {{reason}}." \
  -f csv

# Save candidate to project
opencli linkedin save-to-project "url:aHR0cHM6Ly93d3cubGlua2VkaW4uY29tL2luL2phbmUtZG9lLw" "project-123"

# Add a recruiter tag
opencli linkedin tag "url:aHR0cHM6Ly93d3cubGlua2VkaW4uY29tL2luL2phbmUtZG9lLw" "priority-apac"

# Save a recruiter note
opencli linkedin notes "url:aHR0cHM6Ly93d3cubGlua2VkaW4uY29tL2luL2phbmUtZG9lLw" \
  "Strong international recruiting background. Good fit for APAC leadership pipeline."

# Structured outputs
opencli linkedin people-search "technical recruiter" --location "London" --limit 20 -f json
opencli linkedin recruiter-project-members "project-123" --limit 100 -f csv
```

### Suggested Usage Patterns

#### Search And Triage

- Use `people-search` first
- Keep `--limit` small while tuning filters
- Use `-f json` or `-f csv` when exporting to ATS, spreadsheets, or internal tooling

#### Profile Review

- Use `profile` after you have a `candidate_id`
- Prefer `candidate_id` over hand-copying profile links because it keeps the flow scriptable

#### Outreach

- Use `message` only after you have verified the candidate in Recruiter
- The command reuses the visible Recruiter composer or tries to open Message / InMail automatically
- If LinkedIn changes the compose UI, open the candidate profile manually in Chrome and rerun
- Use `batch-message` only after you have validated the message manually on a few candidates
- Start with `--dry-run` to verify the target list before sending anything
- Tune `--delay-ms` and `--retries` conservatively to avoid overly aggressive automation
- Use `inbox-list` to pull the current visible conversation queue before building follow-up automations
- Use `inbox-msg` with the `conversation_id` returned by `inbox-list` to read thread history
- Use `inbox-reply` with the same `conversation_id` to continue the thread without leaving the Recruiter inbox
- Use `batch-reply` only after validating a few single-thread replies first
- Start `batch-reply` with `--dry-run`, then keep `--delay-ms` and `--retries` conservative
- Use `stats` after outreach batches to get a live summary of search coverage and inbox follow-up load
- If you pass `--query`, `stats` will summarize both a live recruiter search slice and the current inbox queue
- Use `follow-up-queue` when you want a ranked action list rather than raw inbox rows
- Export `follow-up-queue` with `-f csv` for spreadsheet review, or `-f json` for ATS ingestion
- Use `follow-up-batch-reply` when you want queue selection and reply sending in one step
- Template placeholders include `{{first_name}}`, `{{name}}`, `{{headline}}`, `{{priority}}`, `{{recommended_action}}`, `{{reason}}`, `{{last_message}}`, `{{last_time}}`, `{{candidate_id}}`, and `{{conversation_id}}`
- Start `follow-up-batch-reply` with `--dry-run` so you can inspect the rendered message set before anything is sent
- Use `export-follow-up` when your downstream system needs stable field names rather than raw OpenCLI columns
- `export-follow-up` defaults to `-f csv`, so it drops straight into spreadsheets or ATS imports
- Use `--preset ats` for camelCase import columns, `--preset sheet` for spreadsheet-style snake_case, or `--fields` for your own exact column mapping
- If the direct `conversation_id` route fails, you can fall back to `--candidate-id` or `--profile-url` as long as the thread is visible in the Recruiter inbox

#### Pipeline Management

- Use `recruiter-project-list` to inspect available projects
- Use `save-to-project` to add qualified candidates into the right pipeline
- Use `recruiter-project-members` to audit who is already in a given project

#### Tagging And Notes

- Use `tag` for lightweight workflow labels such as `priority`, `apac`, or `needs-screen`
- Use `notes` for recruiter context you want to retain on the profile
- In automation flows, run `tag` and `notes` before `save-to-project` when you want richer pipeline context

### Output Fields

Common Recruiter fields:

- `candidate_id`: stable candidate reference for follow-up commands
- `profile_url`: public profile URL or Recruiter profile URL
- `list_source`: where the row came from, such as `search`, `profile`, or `project:<id>`

`message` output:

- `candidate_id`
- `conversation_id`
- `profile_url`
- `status`
- `detail`
- `list_source`

`save-to-project` output:

- `candidate_id`
- `project_id`
- `project_name`
- `profile_url`
- `status`
- `detail`
- `list_source`

`tag` output:

- `candidate_id`
- `tag`
- `profile_url`
- `status`
- `detail`
- `list_source`

`notes` output:

- `candidate_id`
- `note`
- `profile_url`
- `status`
- `detail`
- `list_source`

`batch-message` output:

- `candidate_id`
- `conversation_id`
- `profile_url`
- `status`
- `detail`
- `list_source`

`inbox-list` output:

- `conversation_id`
- `candidate_id`
- `name`
- `headline`
- `last_message`
- `last_time`
- `unread`
- `profile_url`
- `list_source`

`inbox-msg` output:

- `conversation_id`
- `candidate_id`
- `from`
- `direction`
- `type`
- `text`
- `time`
- `profile_url`
- `list_source`

`inbox-reply` output:

- `conversation_id`
- `candidate_id`
- `profile_url`
- `status`
- `detail`
- `list_source`

`batch-reply` output:

- `conversation_id`
- `candidate_id`
- `profile_url`
- `status`
- `detail`
- `list_source`

`stats` output:

- `category`
- `metric`
- `value`
- `detail`
- `list_source`

`follow-up-queue` output:

- `priority`
- `priority_score`
- `recommended_action`
- `reason`
- `conversation_id`
- `candidate_id`
- `name`
- `headline`
- `last_message`
- `last_time`
- `unread`
- `profile_url`
- `list_source`

`follow-up-batch-reply` output:

- `rank`
- `priority`
- `priority_score`
- `recommended_action`
- `conversation_id`
- `candidate_id`
- `name`
- `rendered_text`
- `status`
- `detail`
- `profile_url`
- `list_source`

`export-follow-up` presets:

- `ats`: exports camelCase columns like `candidateId`, `fullName`, `priority`, `recommendedAction`, `followUpReason`, and `profileUrl`
- `sheet`: exports spreadsheet-friendly snake_case columns like `candidate_id`, `name`, `priority`, `recommended_action`, `reason`, and `profile_url`
- `opencli`: keeps the native follow-up queue schema
- `--fields`: overrides the preset with exact `Target Column=source_field` mappings
- `--template`: appends `next_message` using the same placeholders as `follow-up-batch-reply`

### Troubleshooting

- If Recruiter commands return auth errors, confirm you are signed into LinkedIn Recruiter in Chrome, not only public LinkedIn
- If `message` fails, open the candidate profile manually and confirm the Message / InMail composer is visible
- If `save-to-project` fails, open the candidate profile manually and confirm the Save to Project chooser is available
- If `tag` fails, open the candidate profile manually and confirm the tag or label chooser is visible
- If `notes` fails, open the candidate profile manually and confirm the note editor is visible
- If `batch-message` fails on some candidates, inspect the per-row `detail` output and rerun only the failed subset
- If `inbox-msg` returns no messages, open the target thread manually in Recruiter and rerun so the conversation panel is fully visible
- If `inbox-reply` cannot find a composer, open the thread manually in Recruiter, make sure the reply box is visible, and rerun
- If `batch-reply` partially fails, inspect per-row `detail`, then rerun only the failed conversations
- If `stats` search metrics look empty, make sure you passed `--query` and that recruiter search results are visible in Chrome
- If `follow-up-queue` is too broad, narrow it with `--unread-only`, `--require-candidate-id`, or `--require-profile-url`
- If `follow-up-batch-reply` returns no rows, widen `--priorities`, raise `--inbox-limit`, or relax the identity filters
- If `export-follow-up` columns do not match your ATS, switch to `--fields` and map each downstream column explicitly
- If `people-search` returns empty results, verify the Recruiter result list is visible in Chrome before running the command
- If you are automating pipelines, keep a local record of `candidate_id` and `project_id`

### Automation Note

The current Recruiter implementation is designed around:

- `people-search -> profile -> message -> batch-message -> tag -> notes -> save-to-project`
- `people-search -> message -> inbox-list -> inbox-msg -> inbox-reply`
- `inbox-list -> inbox-msg -> batch-reply`
- `people-search -> message -> inbox-list -> inbox-reply -> stats`
- `inbox-list -> follow-up-queue -> batch-reply -> stats`
- `inbox-list -> follow-up-queue -> follow-up-batch-reply -> stats`
- `inbox-list -> export-follow-up -> spreadsheet or ATS import`

That gives you a practical semi-automated recruiter loop today, with controlled batching, live operating summaries, and an export-friendly follow-up queue for spreadsheet or ATS workflows.
