# Gmail AI inbox triage

Rules-first Gmail triage. Newsletters and notifications are labelled without an AI call; everything else gets a category, priority, summary and a reply saved as a **draft** in the original thread. Nothing is ever sent.

## What it does

1. **New unread email** (Gmail Trigger, every 5 minutes, unread, promotions and social tabs excluded) or **Try with sample emails** (four built-in test emails) starts the run.
2. **Triage settings** holds your name, company, categories, which categories get drafts, VIP senders, reply tone and the model.
3. **Normalize email and flag bulk mail** turns each email into one flat shape (sender, subject, body), strips quoted history and signatures, cuts very long bodies, and flags bulk or automated mail from its headers (`List-Unsubscribe`, `Precedence: bulk/list/junk`, `Auto-Submitted`) and no-reply/notification senders.
4. **Label by rules (no AI)** handles flagged mail: priority low, no reply. VIP senders always go to the AI, even from a mailing tool.
5. **Build triage prompt** and **AI triage** send the rest to any OpenAI-compatible chat API (Google Gemini by default). The email is passed as untrusted data and the model is told to ignore instructions inside it.
6. **Validate AI triage** checks the answer: category from your list, priority `urgent/high/normal/low`, a reply when one is needed. Problems are repaired with safe defaults and flagged `needs_human_review`. If the call fails (rate limit, wrong key, timeout) or the answer isn't JSON, keyword rules set the category and priority, so no email is dropped.
7. **Create a reply draft?** creates a draft only for real Gmail emails that need a reply, passed validation and are in `draft_categories`. Every item carries `draft_skipped_reason`.
8. **Create threaded reply draft** saves the reply as a Gmail draft in the same thread, addressed to the sender.

Each email ends with: `category`, `priority`, `priority_rank`, `summary`, `reason`, `suggested_reply`, `triage_by` (`ai` / `rules` / `rules (AI failed)`), `needs_human_review`, `review_reason`, `create_draft` and `draft_skipped_reason`.

## Setup

1. Import `workflow.json` into n8n.
2. Connect a Gmail OAuth2 credential in **New unread email** and **Create threaded reply draft**.
3. Get an API key from Google AI Studio (aistudio.google.com). Create a **Header Auth** credential (Name `Authorization`, Value `Bearer YOUR_KEY`) and select it in **AI triage (OpenAI-compatible)**.
4. In **Triage settings** set `my_name`, `my_company`, `categories`, `draft_categories`, `vip_senders` and `reply_tone`. Set `create_drafts` to `false` for triage only.
5. Run the test below, then activate the workflow.

Other providers: change `llm_base_url` and `llm_model` (for example `https://api.openai.com/v1`, `https://api.groq.com/openai/v1` or `http://localhost:11434/v1`).

## Test mode

Click **Execute workflow** on **Try with sample emails**. Four built-in emails run through the whole triage without touching your inbox, and sample emails never create drafts. Only the AI credential is needed for this.

## Limitations

- The AI can misjudge category or priority. Always read a draft before sending it.
- AI calls are spaced 4 seconds apart and retried up to 3 times to stay inside free-tier limits, so large backlogs are slow.
- Bodies longer than `max_body_chars` (default 4000) are cut before they go to the AI.
- Drafts are Gmail-only. You can swap in an IMAP trigger (the normalizer reads IMAP fields), but drafts won't be created.
- The triage logic was tested on self-hosted n8n 2.47.7 with sample emails and a local stand-in for the AI API (normal answers, HTTP 429, non-JSON and invalid values). Live Gmail polling, live draft creation and a live Gemini call have not been tested yet.
