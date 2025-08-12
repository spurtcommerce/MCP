import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { Anthropic } from '@anthropic-ai/sdk';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import fs from "fs";

dotenv.config();

// const app = express();
const server = http.createServer();
const io = new Server(server, {
    cors: { origin: '*' }
});

// Read JSON file
const raw = fs.readFileSync("./mcp.config.json", "utf-8");
const config = JSON.parse(raw);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

io.on('connection', (socket) => {
    console.log('✅ Client connected');

    socket.on('user-message', async ({ query, context }) => {
        try {

            const mcp = new Client({ name: 'mcp-socket', version: '1.0.0' });

            let command: string;
            let args: string[];

            if (process.env.MCP_SERVER_PATH) {
                // Run local file
                command = "node";
                args = [process.env.MCP_SERVER_PATH];
            } else {
                // Run from installed package via npx
                command = "npx";
                args = ["@spurtcommerce/mcp"];
            }

            const transport = new StdioClientTransport({
                command,
                args,
                env: config
            });

            await mcp.connect(transport);

            const toolsResult = await mcp.listTools();

            const tools = toolsResult.tools.map(({ name, description, inputSchema }) => ({
                name,
                description,
                input_schema: inputSchema,
            }));

            console.log(tools, 'Tools');

            const messages = [...context, { role: 'user', content: query }];

            const systemPrompt = "You are a professional and courteous e-commerce assistant. Your role is to help customers with inquiries about products, orders, returns, shipping, and account information. Always maintain a polite and helpful tone. Respond in clear, concise, and friendly language. Avoid technical jargon, internal codes, or references to tools, APIs, functions, or backend systems. Do not say things like “I'll search” or “using a tool/function”. Just respond directly with helpful information. Keep replies minimal and focused. If a question cannot be answered without account-specific details, politely ask the customer to contact support. Never break character as an e-commerce assistant.";

            console.log(JSON.stringify(messages), 'messages');

            await handleClaudeResponse({
                messages,
                socket,
                systemPrompt,
                tools,
                mcp,
            });

            await mcp.close();

        } catch (err) {

            console.error('Error:', err);
            socket.emit('bot-response', '❌ Error processing your request.');
        }
    });

    socket.on('disconnect', () => {
        console.log('❌ Client disconnected');
    });
});

server.listen(process.env.SOCKET_PORT, () => {
    console.log(`🚀 Socket server running on ${process.env.SOCKET_PORT}`);
});

async function handleClaudeResponse({
    messages,
    socket,
    systemPrompt,
    tools,
    mcp,
}: {
    messages: any[],
    socket: any,
    systemPrompt: string,
    tools: any[],
    mcp: any
}): Promise<void> {

    console.log(JSON.stringify(messages), 'messages-with-meta');

    const lastMessage = messages[messages.length - 1];

    let metadata = undefined;

    if (
        lastMessage &&
        Array.isArray(lastMessage.content) &&
        lastMessage.content[0]?.metadata
    ) {
        metadata = { ...lastMessage.content[0].metadata };
        delete lastMessage.content[0].metadata;
        console.log('🗂 Extracted Metadata:', metadata);
    }

    console.log(JSON.stringify(messages), 'messages-without-meta');

    const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        system: systemPrompt,
        messages,
        tools,
        max_tokens: 1000,
    });

    console.log(response, 'handleClaudeResponse');

    for (const content of response.content) {

        if (content.type === 'text') {

            socket.emit('bot-response', { text: content.text, metadata });

            messages.push({ role: 'assistant', content: content.text });

            if (response.content.length > 1) {
                // do nothing
            } else {
                return await handleClaudeResponse({ messages, socket, systemPrompt, tools, mcp });
            }

        } else if (content.type === 'tool_use') {

            const toolRes = await mcp.callTool({
                name: content.name,
                arguments: content.input,
            });

            messages.push({ role: 'user', content: toolRes.content as string });

            return await handleClaudeResponse({ messages, socket, systemPrompt, tools, mcp });
        }
    }
}
