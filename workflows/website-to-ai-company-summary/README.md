# Website to AI company summary

Paste a company website URL and get a research card for lead research: company name, one-line pitch, a 2–3 sentence summary, industry, B2B/B2C model, target customers, detected tech stack, LinkedIn page, public emails found on the page, and three factual personalisation hooks for outreach.

## What it does

1. **Set Website** holds the URL and the AI model settings (`website_url`, `llm_base_url`, `llm_model`).
2. **Fetch Website** downloads the public homepage (15 s timeout, up to 5 redirects).
3. **Extract Page Content** pulls the title, meta description, headings, visible text, tech fingerprints, social links and emails with plain JavaScript, no external library or scraping service.
4. **AI Company Summary** sends that content to any OpenAI-compatible chat API (Google Gemini by default). The page text is treated as untrusted data in the prompt.
5. **Company Summary** parses the JSON answer into flat fields. If the model doesn't return JSON, you get `parse_error` and the first 500 characters of the raw answer instead of a crash.

## Setup

1. Import `workflow.json` into n8n (**Workflows → Import from File**).
2. Get an API key from Google AI Studio (aistudio.google.com). Gemini has a free tier.
3. In n8n, create a **Header Auth** credential: Name `Authorization`, Value `Bearer YOUR_KEY`. Select it in the **AI Company Summary** node.
4. In **Set Website**, change `website_url` to the site you want to research.
5. Click **Execute workflow** and open **Company Summary** to see the result.

To use another provider, change `llm_base_url` and `llm_model`, for example `https://api.groq.com/openai/v1` (Groq) or `http://localhost:11434/v1` (Ollama).

## Test mode

There is no built-in sample data: the workflow ships with `website_url` set to `https://n8n.io`, so the first run fetches a real public page. Once your credential is set, just click **Execute workflow**.

## Limitations

- Only the homepage HTML is read. Sites that render their content with JavaScript return little text; try their `/about` page instead.
- Results depend on the model. Check the summary and hooks before you use them in outreach.
- Free-tier AI quotas apply. If you loop over many URLs, add a Wait node between calls.
- Only use emails you find here in line with the privacy and anti-spam rules that apply to you.
- Tested on self-hosted n8n 2.47.7 with a local stand-in for the AI API. It has not yet been run against a live Gemini key, so please open an issue if something breaks with your provider.
