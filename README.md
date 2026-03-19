# Movoice AI MCP Server

[![npm version](https://img.shields.io/npm/v/@movoice/mcp)](https://www.npmjs.com/package/@movoice/mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP](https://img.shields.io/badge/MCP-compatible-blue)](https://modelcontextprotocol.io)

Create and manage voice AI agents directly from **Claude Desktop** or **Cursor** using natural language — no dashboard required.

> "Create a customer support agent for my e-commerce store. Use a friendly female voice and make it handle order status and returns."

That's it. The agent is live and ready to take calls.

---

## What you can do

- **Create** a voice AI agent by describing it in plain English
- **List** all your agents
- **Update** agent prompts, voices, or settings
- **Delete** agents
- **View** call logs and transcripts

---

## Quickstart

### Option 1 — npx (no install needed)

```json
{
  "mcpServers": {
    "movoice": {
      "command": "npx",
      "args": ["-y", "@movoice/mcp"],
      "env": {
        "MOVOICE_API_KEY": "mv_live_your_key_here"
      }
    }
  }
}
```

### Option 2 — Install globally

```bash
npm install -g @movoice/mcp
```

```json
{
  "mcpServers": {
    "movoice": {
      "command": "movoice-mcp",
      "env": {
        "MOVOICE_API_KEY": "mv_live_your_key_here"
      }
    }
  }
}
```

---

## Setup

### Step 1 — Get your API key

Go to [app.movoice.ai/admin/account](https://app.movoice.ai/admin/account) → **API Keys** → **Generate Key**

Your key looks like: `mv_live_xxxxxxxxxxxxxxxx`

### Step 2 — Add to your client

#### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "movoice": {
      "command": "npx",
      "args": ["-y", "@movoice/mcp"],
      "env": {
        "MOVOICE_API_KEY": "mv_live_your_key_here"
      }
    }
  }
}
```

Restart Claude Desktop.

#### Cursor

Go to **Cursor Settings → MCP → Add Server**:

```json
{
  "movoice": {
    "command": "npx",
    "args": ["-y", "@movoice/mcp"],
    "env": {
      "MOVOICE_API_KEY": "mv_live_your_key_here"
    }
  }
}
```

#### VS Code (with MCP extension)

Add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "movoice": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@movoice/mcp"],
      "env": {
        "MOVOICE_API_KEY": "mv_live_your_key_here"
      }
    }
  }
}
```

---

## Example prompts

Once connected, just talk naturally:

> **"Create a customer support agent for my e-commerce store called ShopBot. It should handle order status, returns, and general questions. Use a friendly female voice."**

> **"Show me all my agents"**

> **"Update the ShopBot's welcome message to say 'Hi! I'm ShopBot, your shopping assistant. How can I help?'"**

> **"Create a sales agent for an insurance company that qualifies leads and books appointments. Make it speak Hindi."**

> **"Show me the last 10 calls and summarise what customers were asking about"**

> **"Delete the test agent"**

---

## Available tools

| Tool | Description |
|------|-------------|
| `list_agents` | List all your voice agents |
| `create_agent` | Create a new voice agent |
| `get_agent` | Get details of a specific agent |
| `update_agent` | Update agent settings |
| `delete_agent` | Delete an agent |
| `list_calls` | View recent call logs |
| `get_call` | Get full call details + transcript |

### `create_agent` parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | ✅ | Agent name (e.g. "Sales Bot") |
| `prompt` | string | ✅ | System prompt — personality, knowledge, behavior |
| `welcomeMessage` | string | ✅ | First thing the agent says when a call connects |
| `llmProvider` | string | | `openai` / `anthropic` / `groq` (default: openai) |
| `llmModel` | string | | e.g. `gpt-4o-mini`, `claude-opus-4-6` (default: gpt-4o-mini) |
| `ttsProvider` | string | | `elevenlabs` / `openai` / `deepgram` / `sarvam` |
| `ttsVoice` | string | | Voice ID or name (default: rachel) |
| `asrProvider` | string | | `deepgram` / `sarvam` (default: deepgram) |
| `language` | string | | Language code e.g. `en-US`, `hi-IN` (default: en-US) |
| `webhookUrl` | string | | Webhook URL to receive call events |

---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MOVOICE_API_KEY` | ✅ | Your Movoice API key (`mv_live_...`) |
| `MOVOICE_API_URL` | | Override API base URL (default: `https://app.movoice.ai`) |

---

## Build from source

```bash
git clone https://github.com/Movoiceai/movoice-mcp.git
cd movoice-mcp
npm install
npm run build
```

Then point your MCP client to `dist/index.js`:

```json
{
  "mcpServers": {
    "movoice": {
      "command": "node",
      "args": ["/path/to/movoice-mcp/dist/index.js"],
      "env": {
        "MOVOICE_API_KEY": "mv_live_your_key_here"
      }
    }
  }
}
```

---

## Links

- [Movoice AI](https://app.movoice.ai) — Dashboard
- [Documentation](https://docs.movoice.ai) — Full API docs
- [Issues](https://github.com/Movoiceai/movoice-mcp/issues) — Report a bug
- [MCP Protocol](https://modelcontextprotocol.io) — Learn about MCP

---

## License

MIT © [Movoice AI](https://movoice.ai)
