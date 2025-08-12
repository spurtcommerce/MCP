"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const dotenv_1 = __importDefault(require("dotenv"));
const sdk_1 = require("@anthropic-ai/sdk");
const index_js_1 = require("@modelcontextprotocol/sdk/client/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/client/stdio.js");
const fs_1 = __importDefault(require("fs"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: { origin: '*' }
});
// Read JSON file
const raw = fs_1.default.readFileSync("./mcp.config.json", "utf-8");
const config = JSON.parse(raw);
const anthropic = new sdk_1.Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
io.on('connection', (socket) => {
    console.log('✅ Client connected');
    socket.on('user-message', ({ query, context }) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const mcp = new index_js_1.Client({ name: 'mcp-socket', version: '1.0.0' });
            const transport = new stdio_js_1.StdioClientTransport({
                command: 'node',
                args: [process.env.MCP_SERVER_PATH],
                env: config
            });
            yield mcp.connect(transport);
            const toolsResult = yield mcp.listTools();
            const tools = toolsResult.tools.map(({ name, description, inputSchema }) => ({
                name,
                description,
                input_schema: inputSchema,
            }));
            console.log(tools, 'Tools');
            const messages = [...context, { role: 'user', content: query }];
            const systemPrompt = "You are a professional and courteous e-commerce assistant. Your role is to help customers with inquiries about products, orders, returns, shipping, and account information. Always maintain a polite and helpful tone. Respond in clear, concise, and friendly language. Avoid technical jargon, internal codes, or references to tools, APIs, functions, or backend systems. Do not say things like “I'll search” or “using a tool/function”. Just respond directly with helpful information. Keep replies minimal and focused. If a question cannot be answered without account-specific details, politely ask the customer to contact support. Never break character as an e-commerce assistant.";
            console.log(JSON.stringify(messages), 'messages');
            yield handleClaudeResponse({
                messages,
                socket,
                systemPrompt,
                tools,
                mcp,
            });
            yield mcp.close();
        }
        catch (err) {
            console.error('Error:', err);
            socket.emit('bot-response', '❌ Error processing your request.');
        }
    }));
    socket.on('disconnect', () => {
        console.log('❌ Client disconnected');
    });
});
server.listen(process.env.SOCKET_PORT, () => {
    console.log(`🚀 Socket server running on ${process.env.SOCKET_PORT}`);
});
function handleClaudeResponse({ messages, socket, systemPrompt, tools, mcp, }) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        console.log(JSON.stringify(messages), 'messages-with-meta');
        const lastMessage = messages[messages.length - 1];
        let metadata = undefined;
        if (lastMessage &&
            Array.isArray(lastMessage.content) &&
            ((_a = lastMessage.content[0]) === null || _a === void 0 ? void 0 : _a.metadata)) {
            metadata = Object.assign({}, lastMessage.content[0].metadata);
            delete lastMessage.content[0].metadata;
            console.log('🗂 Extracted Metadata:', metadata);
        }
        console.log(JSON.stringify(messages), 'messages-without-meta');
        const response = yield anthropic.messages.create({
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
                }
                else {
                    return yield handleClaudeResponse({ messages, socket, systemPrompt, tools, mcp });
                }
            }
            else if (content.type === 'tool_use') {
                const toolRes = yield mcp.callTool({
                    name: content.name,
                    arguments: content.input,
                });
                messages.push({ role: 'user', content: toolRes.content });
                return yield handleClaudeResponse({ messages, socket, systemPrompt, tools, mcp });
            }
        }
    });
}
