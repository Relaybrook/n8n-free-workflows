# Crypto Price Alert Lite

A small, free n8n workflow that checks a short list of coins against your own price lines and sends **one** message when a coin crosses one. Price data comes from CoinGecko's free public API, so you don't need an API key or an exchange account. It's read-only: it never trades and never touches a wallet.

## What it does

1. **Config** holds your `watchlist`, currency and where alerts go.
2. **Parse Watchlist** reads lines like `bitcoin: above 70000, below 60000` and builds one CoinGecko request for every coin.
3. **Get Prices (CoinGecko)** calls `/simple/price` once per run (every 15 minutes by default). In test mode, **Sample Prices (test mode)** is used instead.
4. **Evaluate Alerts** compares each price with your lines. A rule fires once, then re-arms when the price goes back to the other side, so you aren't pinged every 15 minutes while bitcoin stays above 70,000. Unknown coin ids, unreadable lines and CoinGecko errors (including HTTP 429 rate limits) are listed in `notes` instead of crashing the run.
5. The message goes to a **webhook** (Discord, Slack or any URL) and/or **Telegram**. Test mode only shows it in **Preview (test mode)**.

## Try it in 30 seconds

1. In n8n: **Workflows → Import from File** and pick `workflow.json`.
2. Click **Execute workflow**. Test mode is on, so it uses made-up sample prices: bitcoin 58,900 and solana 212 trigger two alerts.
3. Open **Preview (test mode)** to see `message` and `webhook_body`. Nothing is sent.

## Go live

1. Edit `watchlist` in **Config**, one coin per line:
   ```
   bitcoin: above 70000, below 60000
   ethereum: below 2000
   the-open-network: above 4
   ```
   Use CoinGecko coin ids (the id is in the coin's page URL on coingecko.com). `vs_currency` defaults to `usd`.
2. Pick where alerts go:
   - **Discord / Slack / any webhook:** paste the URL into `webhook_url` and set `webhook_format` to `discord`, `slack` or `json`. No credential needed.
   - **Telegram:** create a bot with @BotFather, add a *Telegram API* credential in **Send Telegram**, right-click the node → **Activate** (it ships deactivated), and put your chat id in `telegram_chat_id`.
3. Set `test_mode = false`, save, and publish/activate the workflow so the 15-minute schedule runs.

## Limitations

- Keyless CoinGecko access is shared per IP and rate-limited. Every 15 minutes is fine from your own server, but busy shared IPs (some cloud hosts) can get HTTP 429. The run then reports the rate limit in `notes` and sends nothing.
- Only `above` / `below` price lines. No % move alerts, cooldowns, portfolio report or wallet watching (those are in the paid Crypto Watch Pack).
- "Alert once, then re-arm" uses n8n workflow static data, which n8n only saves for active (scheduled) runs. Manual test runs always show every rule that is currently true.
- Information only, not financial advice.

## What was tested

On self-hosted n8n 2.47.7 (CLI, Node 24), 2026-11-17:
- Import: OK.
- Shipped file in test mode: success, 2 alerts in *Preview (test mode)*.
- Live path against a local server returning CoinGecko's `/simple/price` response shape, posting to a local webhook: Discord-format and Slack-format bodies sent; an unknown coin id and an unreadable line were reported in the message notes.
- HTTP 429 from the price API: reported in `notes`, nothing sent, run still succeeds.
- Real CoinGecko from the test machine: answered HTTP 429 (shared IP), handled as above. The same endpoint answered normally when fetched separately.
- Not tested: Telegram sending (needs a real bot) and the re-arm memory across real scheduled runs.

Price data by [CoinGecko](https://www.coingecko.com). Made by [Relaybrook](https://github.com/Relaybrook). MIT licence.
