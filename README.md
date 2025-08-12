# Spurtcommerce MCP Server

This project implements a **Model Context Protocol (MCP)** server that interacts with **Spurtcommerce**.  
The protocol supports various tools to interact with Spurtcommerce APIs for **product search** and category browsing.  

At the moment, the following APIs are supported:

- **Product API**  
- **Store API**  
- **Categories API**  

---

## Setup

### Run from npm package (recommended for production)
To run the Spurtcommerce MCP server using `npx`, use the following command:

```bash
npx -y @spurtcommerce/mcp@latest
```

### Run from local build (for development)
If you are working on the MCP server locally, you can run it by setting the `MCP_SERVER_PATH` environment variable to the absolute path of your built server file:

```bash
export MCP_SERVER_PATH="/absolute/path/to/build/index.js"
```

If `MCP_SERVER_PATH` is not set or is empty, the client will fall back to:

```bash
npx @spurtcommerce/mcp@latest
```

---

## Usage with Cursor or Claude Desktop

Add the following configuration to your `settings.json`.  
For more information, read the **Cursor MCP documentation** or the **Claude Desktop MCP guide**.

```json
{
  "mcpServers": {
    "spurtcommerce-mcp": {
      "command": "npx",
      "args": ["-y", "@spurtcommerce/mcp@latest"],
      "env": {
        "SPURTCOMMERCE_API_URL": "https://your_backend/api",
        "SPURTCOMMERECE_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

---

## Windows Configuration

On **Windows**, you may need this alternative setup:

```json
{
  "mcpServers": {
    "spurtcommerce-mcp": {
      "command": "cmd",
      "args": ["/k", "npx", "-y", "@spurtcommerce/mcp@latest"],
      "env": {
        "SPURTCOMMERCE_API_URL": "https://your_backend/api",
        "SPURTCOMMERECE_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SPURTCOMMERCE_API_URL` | Base API URL for your Spurtcommerce backend |
| `SPURTCOMMERECE_API_KEY` | API key for authenticating requests |
| `MCP_SERVER_PATH` | (Optional) Absolute path to the built MCP server file for local development |

---

## Available Tools

This MCP server provides the following tools:

| Tool Name          | Description |
|--------------------|-------------|
| `get_product_by_sku` | Retrieve detailed product information using SKU |
| `get_all_category`   | Fetch all available product categories |
| `search_products`    | Search products by keyword or filters |

---

## Tool Usage Guidelines

- **`get_product_by_sku`** → Use when you know the SKU and want full product details.  
- **`get_all_category`** → Use when you need a list of categories for navigation or filtering.  
- **`search_products`** → Use when searching products by name, category, or other filters.  

---

## Available Prompts

| Prompt Name | Description |
|-------------|-------------|
| `spurtcommerce_product_search` | Helps you search products and fetch relevant product details using available tools |

---

## Development

### @spurtcommerce/mcp – Monorepo Setup

This repository contains three main parts:  

```
project-root/
│
├── agent/                     # Main backend service (Node.js/Express)
└── servers/
    └── spurtcommerce/         # MCP server (@spurtcommerce/mcp)
```

---

#### 1. Install Dependencies

**Backend (agent):**
```bash
cd agent
npm install
```

**MCP Server:**
```bash
cd servers/spurtcommerce
npm install
```

---

#### 2. Environment Variables

**Agent (`agent/.env`):**
```env
ANTHROPIC_API_KEY=your_api_key
SOCKET_PORT=3001
# Optional: Directly point to built MCP server
MCP_SERVER_PATH=servers/spurtcommerce/dist/index.js
```

---

#### 3. Development

##### MCP Server (servers/spurtcommerce)
The MCP server is built with the **MCP SDK** and communicates with the Spurtcommerce API.

**Build:**
```bash
npm run build
```

**Run locally:**
```bash
node $(pwd)/dist/index.js
```

---

#### 4. Running the Project

**Start agent backend:**
```bash
cd agent
npm start
```