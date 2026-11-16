# Article to social content pack

Paste article URLs and get, for each one, a LinkedIn post, a numbered X thread, a newsletter subject and blurb, and key points. Invented numbers are flagged, X posts are kept under 280 characters, and every article ends as a downloadable Markdown file. Nothing is posted.

## What it does

1. **Content settings** holds your article URLs (comma, space or newline separated), brand name, audience, voice and limits.
2. **Split article URLs** makes one item per URL. Invalid and duplicate URLs (including the same page with a `#fragment`) go to **Skipped URLs** instead of being fetched.
3. **Fetch article page** downloads each page. **Extract article text** pulls the readable article out of the HTML with plain JavaScript: title, description, author, date, headings, paragraphs, lists and quotes, with navigation, footers, scripts and share/subscribe blocks removed. Older table-and-line-break layouts are handled by a plain-text fallback.
4. **Article readable?** sends short pages (below `min_article_words`, e.g. paywalls or JavaScript-only sites), non-HTML files such as PDFs and HTTP errors to **Unreadable articles** with a reason. They never reach the AI.
5. **AI write content pack** makes one request per article to any OpenAI-compatible chat API (Google Gemini by default). The model is told to use only facts from the article and to treat the article text as untrusted data.
6. **Check facts and lengths** is the quality gate:
   - **Number check:** every number in the generated copy must appear in the article; any that don't are listed and the pack is marked `needs_review`.
   - **X thread:** posts are measured the way X counts them (links = 23 characters, emoji and CJK = 2). Long posts are split at sentence boundaries, numbered `1/n`, and the article link is added to the last post.
   - **LinkedIn and newsletter:** length limits are enforced and the article link is appended.
   - If the AI call fails (e.g. HTTP 429) or doesn't return JSON, the article goes to **Failed generations** with the reason. The AI node retries 3 times first.
7. **Save content pack as Markdown** turns each pack into a `.md` file you can download from the node output.

## Setup

1. Import `workflow.json` into n8n.
2. Get an API key from Google AI Studio (aistudio.google.com).
3. Create a **Header Auth** credential: Name `Authorization`, Value `Bearer YOUR_KEY`. Select it in **AI write content pack**.
4. In **Content settings** set `article_urls`, `brand_name`, `audience` and `brand_voice`. Optional: `output_language`, `thread_tweets` (3–12), `linkedin_max_chars`, `newsletter_max_words`, `add_article_link`, `min_article_words`.
5. Click **Execute workflow**, then open **Save content pack as Markdown** to download the files.

Other providers: change `llm_base_url` and `llm_model` (for example `https://api.openai.com/v1` or `http://localhost:11434/v1`).

## Test mode

The workflow ships with one public article URL in `article_urls`, so once your credential is set you can click **Execute workflow** straight away and see a full pack.

## Limitations

- The number check is strict on purpose. Spelled-out or rounded numbers can trigger `needs_review`; that means "check this", not "wrong". It does not catch invented claims that contain no numbers, so review the copy before posting.
- Articles longer than 24,000 characters are cut before they go to the AI, and the pack says so.
- Pages that need JavaScript or a login can't be read.
- Tested on self-hosted n8n 2.47.7 with real article pages and a local stand-in for the AI API (normal answer, HTTP 429, non-JSON answer, an invented statistic and an over-long X post). A live Gemini call has not been run yet.
