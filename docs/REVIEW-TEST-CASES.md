# Klype AI connector: review test cases

For directory reviewers (Claude, ChatGPT apps and others). Each case gives a prompt to send to an assistant with the Klype connector enabled, the tool calls to expect, and the outcome that passes.

- **Endpoint:** `https://api.klype.ai/api/v1/mcp` (Streamable HTTP)
- **Sign-in:** OAuth 2.1 with dynamic client registration. The consent screen lists the permissions requested (read context, write drafts, read approvals).
- **Test account:** credentials for a review account with a saved workspace, a plan or trial and a small credit balance are supplied in the submission form, not in this repository.
- **Support:** admin@klype.ai, https://klype.ai/support/
- **Privacy policy:** https://klype.ai/privacy/
- **Documentation:** https://klype.ai/docs/mcp/

Klype never publishes, schedules for publishing or sends. In every case below, nothing leaves Klype: results are drafts or plans for the account owner to use. Cases 1, 5, 6 and 9 spend no credits. Case 3 spends credits unless it is the account's free first plan; cases 2, 4, 7 and 8 spend credits.

## Cases

### 1. Find the workspace and read its context

**Prompt:** "What does Klype know about my business?"

**Expected tool calls:** `list_workspaces`, then `get_workspace_context` with the returned id.

**Pass:** The assistant names the workspace and summarises its voice, product facts and buyer, and states any gap listed in `context_status`. It does not invent facts that are not in the context.

### 2. Draft a post in the owner's voice

**Prompt:** "Write a LinkedIn post about why we shortened onboarding to two steps."

**Expected tool calls:** `list_workspaces`, `get_workspace_context`, `draft_post` with `brief`, `platform: linkedin` and the workspace id.

**Pass:** A draft is returned with `published: false` and a `next` hint pointing to `review_draft`. The assistant shows the draft and says it has not been posted.

### 3. Build a GTM plan

**Prompt:** "Create a go-to-market plan for my business."

**Expected tool calls:** `get_gtm_plan` (reports whether a plan exists and `firstPlanFree`), then `generate_gtm_plan`.

**Pass:** A plan with ICP, positioning, channels and a 14-day timeline is saved and summarised. `creditsSpent` is 0 when the plan was the account's free first plan. If the account is out of credits, the assistant tells the user where to add credits and does not retry.

### 4. Turn a video transcript into a draft

**Prompt:** "Turn this transcript into a Reddit post: <paste about 120 words of a talk>."

**Expected tool calls:** `capture_to_post` with `transcript` and `platform: reddit`.

**Pass:** A draft that uses only what the transcript says. The result has `published: false`. With a transcript under about 40 words and no link, the tool returns an error asking for more text instead of inventing content.

### 5. Check a draft before it goes out

**Prompt:** "Check this against my voice before I post it: <paste a short post that includes an unsourced statistic>."

**Expected tool calls:** `review_draft` with `text`.

**Pass:** A 0 to 100 score, a verdict (`ready`, `needs_changes` or `blocked`), specific fixes, and a `reviewId`. The unsourced statistic is flagged.

### 6. Approval is owner-only

**Prompt:** "Check this post, and approve it for me." followed by a draft.

**Expected tool calls:** `review_draft`. The assistant then asks whether the owner approves, and does not call `approve_draft` until the user says so in the chat. After "Yes, I approve this version": `approve_draft` with the `reviewId`.

**Pass:** `approve_draft` is called only after an explicit approval. The result confirms the approval is recorded and that nothing was published.

### 7. Repurpose an approved post

**Prompt:** "Now turn the approved post into a Reddit post and a nurture email."

**Expected tool calls:** `distribute_post` with the `reviewId` from case 6 and `formats: ["reddit", "nurture"]`.

**Pass:** Two assets, matched communities with their posting rules, `sent: false` and `published: false`. Repeating the call with text that was never approved is refused with a message to ask the owner and call `approve_draft` first.

### 8. Read the calendar and the next two weeks

**Prompt:** "What is on my content calendar, and what should I post over the next two weeks?"

**Expected tool calls:** `get_calendar`, then `plan_fortnight`.

**Pass:** The calendar lists posts and unplaced drafts with their state. `plan_fortnight` returns dated slots with a channel and an angle and `saved: false`. Nothing is written to the calendar.

### 9. Put a draft on a day without scheduling it

**Prompt:** "Put the LinkedIn draft on the calendar for next Tuesday."

**Expected tool calls:** `get_calendar` (to find the draft) or the draft text, then `schedule_draft` with `plannedFor`.

**Pass:** The draft shows `state: draft` with the planned day. The result says it is not scheduled for publishing. A post that is already scheduled or published is refused.

### 10. Data isolation and errors

**Prompt:** "Show the plan for workspace 00000000-0000-4000-8000-000000000000."

**Expected tool calls:** `get_gtm_plan` with that id.

**Pass:** An error that the workspace was not found for this account, with a hint to call `list_workspaces`. No data from another account is returned, for this tool or any other.

## Optional: AI Visibility

Where the feature is enabled for the account, `get_ai_visibility` appears in the tool list. **Prompt:** "Do AI assistants recommend us?" **Expected:** one call to `get_ai_visibility`; the latest run summary with named and cited counts, share of voice and next steps. It reads the last completed run and does not start one.
