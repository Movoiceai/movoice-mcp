#!/usr/bin/env node
/**
 * Movoice AI MCP Server
 *
 * Allows Claude / Cursor to create and manage voice AI agents
 * on Movoice AI directly from a conversation.
 *
 * Usage:
 *   MOVOICE_API_KEY=mv_live_xxx node dist/index.js
 *
 * Add to Claude Desktop (~/Library/Application Support/Claude/claude_desktop_config.json):
 * {
 *   "mcpServers": {
 *     "movoice": {
 *       "command": "node",
 *       "args": ["/path/to/movoice-mcp/dist/index.js"],
 *       "env": { "MOVOICE_API_KEY": "mv_live_xxx" }
 *     }
 *   }
 * }
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// ─── Config ──────────────────────────────────────────────────────────────────

const API_KEY = process.env.MOVOICE_API_KEY;
const BASE_URL = process.env.MOVOICE_API_URL || "https://app.movoice.ai";

if (!API_KEY) {
    console.error("Error: MOVOICE_API_KEY environment variable is required.");
    console.error("Get your API key from: https://app.movoice.ai/admin/account");
    process.exit(1);
}

// ─── API Client ───────────────────────────────────────────────────────────────

async function movoiceRequest(
    method: string,
    path: string,
    body?: Record<string, unknown>
): Promise<unknown> {
    const res = await fetch(`${BASE_URL}/api/v1${path}`, {
        method,
        headers: {
            "Authorization": `Bearer ${API_KEY}`,
            "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json() as Record<string, unknown>;

    if (!res.ok) {
        const err = data as { error?: string; message?: string };
        throw new Error(err.error || err.message || `HTTP ${res.status}`);
    }

    return (data as { data?: unknown }).data ?? data;
}

// ─── Tool Definitions ─────────────────────────────────────────────────────────

const TOOLS = [
    {
        name: "list_agents",
        description: "List all voice AI agents in your Movoice AI account.",
        inputSchema: {
            type: "object",
            properties: {
                page: {
                    type: "number",
                    description: "Page number (default: 1)",
                },
                per_page: {
                    type: "number",
                    description: "Agents per page (default: 20)",
                },
            },
            required: [],
        },
    },
    {
        name: "create_agent",
        description:
            "Create a new voice AI agent on Movoice AI. The agent will be ready to take calls immediately.",
        inputSchema: {
            type: "object",
            properties: {
                name: {
                    type: "string",
                    description: "Agent name (e.g. 'Sales Bot', 'Support Agent')",
                },
                prompt: {
                    type: "string",
                    description:
                        "System prompt for the agent. Defines its personality, knowledge, and behavior. Write it as if you're instructing a human agent. Minimum 10 characters.",
                },
                welcomeMessage: {
                    type: "string",
                    description:
                        "First thing the agent says when a call connects (e.g. 'Hello! Thanks for calling Acme Corp. How can I help you today?')",
                },
                llmProvider: {
                    type: "string",
                    enum: ["openai", "anthropic", "groq"],
                    description: "LLM provider (default: openai)",
                },
                llmModel: {
                    type: "string",
                    description:
                        "LLM model (default: gpt-4o-mini). Examples: gpt-4o, gpt-4o-mini, claude-opus-4-6",
                },
                ttsProvider: {
                    type: "string",
                    enum: ["elevenlabs", "openai", "deepgram", "sarvam"],
                    description: "Text-to-speech provider (default: elevenlabs)",
                },
                ttsVoice: {
                    type: "string",
                    description:
                        "Voice ID or name (default: rachel). Use list_voices to see options.",
                },
                asrProvider: {
                    type: "string",
                    enum: ["deepgram", "sarvam"],
                    description: "Speech recognition provider (default: deepgram)",
                },
                language: {
                    type: "string",
                    description:
                        "Language code (default: en-US). Examples: en-US, hi-IN, en-IN",
                },
                webhookUrl: {
                    type: "string",
                    description:
                        "Optional webhook URL to receive call events (POST with call data)",
                },
            },
            required: ["name", "prompt", "welcomeMessage"],
        },
    },
    {
        name: "get_agent",
        description: "Get details of a specific voice AI agent by its ID.",
        inputSchema: {
            type: "object",
            properties: {
                id: {
                    type: "string",
                    description: "Agent ID (from list_agents or create_agent)",
                },
            },
            required: ["id"],
        },
    },
    {
        name: "update_agent",
        description:
            "Update an existing voice AI agent. Only provide fields you want to change.",
        inputSchema: {
            type: "object",
            properties: {
                id: {
                    type: "string",
                    description: "Agent ID to update",
                },
                name: { type: "string", description: "New agent name" },
                prompt: { type: "string", description: "New system prompt" },
                welcomeMessage: {
                    type: "string",
                    description: "New welcome message",
                },
                llmProvider: {
                    type: "string",
                    enum: ["openai", "anthropic", "groq"],
                },
                llmModel: { type: "string" },
                ttsProvider: {
                    type: "string",
                    enum: ["elevenlabs", "openai", "deepgram", "sarvam"],
                },
                ttsVoice: { type: "string" },
                asrProvider: {
                    type: "string",
                    enum: ["deepgram", "sarvam"],
                },
                language: { type: "string" },
                webhookUrl: { type: "string" },
                isActive: {
                    type: "boolean",
                    description: "Enable or disable the agent",
                },
            },
            required: ["id"],
        },
    },
    {
        name: "delete_agent",
        description: "Permanently delete a voice AI agent.",
        inputSchema: {
            type: "object",
            properties: {
                id: {
                    type: "string",
                    description: "Agent ID to delete",
                },
            },
            required: ["id"],
        },
    },
    {
        name: "list_calls",
        description:
            "List recent call logs for your account. Includes duration, sentiment, and transcript availability.",
        inputSchema: {
            type: "object",
            properties: {
                page: { type: "number", description: "Page number (default: 1)" },
                per_page: {
                    type: "number",
                    description: "Calls per page (default: 20)",
                },
            },
            required: [],
        },
    },
    {
        name: "get_call",
        description:
            "Get full details of a specific call including transcript and AI analysis.",
        inputSchema: {
            type: "object",
            properties: {
                id: {
                    type: "string",
                    description: "Call ID (from list_calls)",
                },
            },
            required: ["id"],
        },
    },
];

// ─── Tool Handlers ─────────────────────────────────────────────────────────────

async function handleTool(
    name: string,
    args: Record<string, unknown>
): Promise<string> {
    switch (name) {
        case "list_agents": {
            const page = (args.page as number) || 1;
            const perPage = (args.per_page as number) || 20;
            const data = await movoiceRequest(
                "GET",
                `/agents?page=${page}&per_page=${perPage}`
            );
            return JSON.stringify(data, null, 2);
        }

        case "create_agent": {
            const data = await movoiceRequest("POST", "/agents", {
                name: args.name,
                prompt: args.prompt,
                welcomeMessage: args.welcomeMessage,
                llmProvider: args.llmProvider || "openai",
                llmModel: args.llmModel || "gpt-4o-mini",
                ttsProvider: args.ttsProvider || "elevenlabs",
                ttsVoice: args.ttsVoice || "rachel",
                asrProvider: args.asrProvider || "deepgram",
                language: args.language || "en-US",
                ...(args.webhookUrl ? { webhookUrl: args.webhookUrl as string } : {}),
            });
            return JSON.stringify(data, null, 2);
        }

        case "get_agent": {
            const data = await movoiceRequest("GET", `/agents/${args.id}`);
            return JSON.stringify(data, null, 2);
        }

        case "update_agent": {
            const { id, ...updates } = args as { id: string } & Record<string, unknown>;
            const data = await movoiceRequest("PATCH", `/agents/${id}`, updates);
            return JSON.stringify(data, null, 2);
        }

        case "delete_agent": {
            await movoiceRequest("DELETE", `/agents/${args.id}`);
            return JSON.stringify({ success: true, message: `Agent ${args.id} deleted.` });
        }

        case "list_calls": {
            const page = (args.page as number) || 1;
            const perPage = (args.per_page as number) || 20;
            const data = await movoiceRequest(
                "GET",
                `/calls?page=${page}&per_page=${perPage}`
            );
            return JSON.stringify(data, null, 2);
        }

        case "get_call": {
            const data = await movoiceRequest("GET", `/calls/${args.id}`);
            return JSON.stringify(data, null, 2);
        }

        default:
            throw new Error(`Unknown tool: ${name}`);
    }
}

// ─── MCP Server ───────────────────────────────────────────────────────────────

const server = new Server(
    { name: "movoice-mcp", version: "1.0.0" },
    { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        const result = await handleTool(name, (args ?? {}) as Record<string, unknown>);
        return {
            content: [{ type: "text", text: result }],
        };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
            content: [{ type: "text", text: `Error: ${message}` }],
            isError: true,
        };
    }
});

// ─── Start ────────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
