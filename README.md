<img src="logo.png" alt="Klype AI" width="96" />

[![Klype AI MCP server on AI Agents Listing](https://aiagentslisting.com/klype-ai-mcp-server/badge.svg?claim=aacf328a70807c3ee6fb419c18a74056)](https://aiagentslisting.com/mcp/klype-ai-mcp-server)

# Klype AI MCP server

Klype is a voice and context layer for GTM teams. It stores a company's product, buyer and voice context once, measures how a real person writes, and makes every AI-drafted post or message sound like that person before it goes out. Nothing publishes without the owner's approval.

This is the remote MCP server for Klype. Connect it to Claude, ChatGPT, Cursor, n8n or any MCP client and your agents can draft in your voice, check any text against it, and keep an approval record.

- **Endpoint:** `https://api.klype.ai/api/v1/mcp` (Streamable HTTP, JSON-RPC over POST)
- **Auth:** OAuth 2.1 with dynamic client registration (discovery at `https://api.klype.ai/.well-known/oauth-authorization-server`), or a Klype API key (`Authorization: Bearer klp_live_...`)
- **Protocol versions:** 2025-06-18, 2025-03-26, 2024-11-05
- **Server card:** `https://api.klype.ai/.well-known/mcp/server-card.json`

## Tools

Fifteen tools. Every result has a short summary, structured data and a `next` hint. Nothing publishes, schedules for publishing or sends. `approve_draft` records the owner's approval and nothing else. Each tool has a title and MCP annotations.

| Tool | What it does | Scope | Read-only |
| --- | --- | --- | --- |
| `list_workspaces` | Lists the business workspaces saved in Klype, with ids. Call it first. | context:read | yes |
| `get_workspace_context` | Returns the saved voice, product facts, buyer and positioning for one workspace, with context_status gaps. | context:read | yes |
| `get_todays_plan` | GTM work due today and over the next days, with a status and suggested action per item. | context:read | yes |
| `draft_post` | Drafts a post in the owner's measured voice, grounded in a workspace. | drafts:write | no |
| `review_draft` | Checks any text against the owner's voice, saved facts and rules. Returns a score, a verdict and fixes. | context:read | no |
| `approve_draft` | Records that the owner approved the checked text. Owner-only. | drafts:write | no |
| `list_approvals` | Returns the owner's approval record. | approvals:read | yes |
| `get_performance_insights` | What has performed for the owner, from imported post results: format, length, day, edits, top posts. | context:read | yes |
| `get_gtm_plan` | Reads the saved GTM plan (ICP, positioning, channels, timeline) and whether the next plan is free. | context:read | yes |
| `generate_gtm_plan` | Builds and saves a GTM plan with a 14-day timeline. Free for the first plan, credits after. | drafts:write | no |
| `capture_to_post` | Turns a video link or a pasted transcript into a draft for a chosen platform. | drafts:write | no |
| `distribute_post` | Repurposes an approved post into other formats, matched communities and email follow-ups. | drafts:write | no |
| `get_calendar` | Calendar posts and drafts for a date range. | context:read | yes |
| `plan_fortnight` | Proposes dated post slots for the next 14 days. Saves nothing. | drafts:write | no |
| `schedule_draft` | Places a draft on a day in the calendar plan. The post stays a draft. | drafts:write | no |
| `get_ai_visibility` | Latest AI Visibility run summary. Listed only where the feature is on. | context:read | yes |

Full documentation, with an example prompt for every tool: https://klype.ai/docs/mcp/. Test prompts for reviewers: [docs/REVIEW-TEST-CASES.md](docs/REVIEW-TEST-CASES.md).

## Plugins

Three focused connectors run on the same server, OAuth and Klype account. Each has its own listing and a Claude Code plugin under `plugins/`; `marketplace.json` lists all three. Listing copy is in [LISTINGS.md](LISTINGS.md).

| Plugin | Endpoint | Tools | Access |
| --- | --- | --- | --- |
| Klype Check | `/api/v1/mcp/check` | `review_draft`, `get_workspace_context`, `list_workspaces` | Free |
| Klype Voice | `/api/v1/mcp/voice` | `draft_post`, `review_draft`, `get_workspace_context`, `list_workspaces`, `approve_draft`, `list_approvals` | Requires a Klype plan |
| Klype GTM Planner | `/api/v1/mcp/planner` | `get_todays_plan`, `get_performance_insights`, `get_workspace_context`, `list_workspaces` | Requires a Klype plan |

Install in Claude Code: `/plugin marketplace add shruti12XT/klype-mcp`, then `/plugin install klype-check@klype`. The full server at `/api/v1/mcp` keeps every tool, including the planning, capture, distribution and calendar tools that the plugins do not list.

## Connect

**Claude (claude.ai or Claude Desktop):** Settings > Connectors > Add custom connector > paste `https://api.klype.ai/api/v1/mcp` and sign in to Klype.

**Cursor / any client that takes a JSON config:**

```json
{
  "mcpServers": {
    "klype": {
      "url": "https://api.klype.ai/api/v1/mcp",
      "headers": { "Authorization": "Bearer klp_live_YOUR_KEY" }
    }
  }
}
```

Create an API key in Klype at app.klype.ai/dashboard/connections, and pick only the scopes you need.

**Clients that only run local (stdio) servers:** use the npm bridge. It relays to the hosted server, so there is nothing else to run.

```json
{
  "mcpServers": {
    "klype": {
      "command": "npx",
      "args": ["-y", "klype-mcp"],
      "env": { "KLYPE_API_KEY": "klp_live_YOUR_KEY" }
    }
  }
}
```

**Raw HTTP:**

```bash
curl -s https://api.klype.ai/api/v1/mcp \
  -H "Authorization: Bearer klp_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

## REST API

The same capabilities are available as REST under `https://api.klype.ai/api/v1/platform` (`/workspaces`, `/workspaces/{id}/context`, `/drafts`, `/review`, `/review/{id}/fix`, `/review/{id}/approve`, `/insights`, `/approvals`). Interactive docs: `https://api.klype.ai/api/docs`.

## Limits

360 MCP calls per hour per key (about 120 drafts). Drafting, capture, distribution, planning and GTM plan generation draw on the account's Klype credits; the first GTM plan on an account is free. Reading tools do not spend credits.

## Links

- Website: https://klype.ai
- App: https://app.klype.ai
- Documentation: https://klype.ai/docs/mcp/
- Support: admin@klype.ai (https://klype.ai/support/)
- Privacy policy: https://klype.ai/privacy/

## Listed in

- [Official MCP Registry](https://registry.modelcontextprotocol.io) as `ai.klype/klype`
- [Glama](https://glama.ai/mcp/servers)
- [Smithery](https://smithery.ai)
- Listed in the [Claude Market MCP directory](https://www.claudemarket.ai/mcp)

This repository documents the hosted server and ships `klype-mcp`, a dependency-free stdio bridge to it (Node 18+). The server itself runs at `https://api.klype.ai/api/v1/mcp`.

## License

MIT for the code in this repository. The hosted Klype service, its data and the Klype name and logo are not covered by this license.

