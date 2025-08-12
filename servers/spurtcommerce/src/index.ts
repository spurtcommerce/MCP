#!/usr/bin/env node

import dotenv from "dotenv";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import axios from "axios";
import { z } from "zod";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Update this to your real API base URL
const API_BASE = process.env.SPURTCOMMERCE_API_URL;
const API_KEY = process.env.SPURTCOMMERCE_API_KEY;

const api = axios.create({
    baseURL: API_BASE,
    headers: {
        "Content-Type": "application/json",
        "key": API_KEY
    },
});

// Create server instance
const server = new McpServer({
    name: "ecommerce",
    version: "1.0.0",
    capabilities: {
        resources: {},
        tools: {},
    },
});

// Tool 1: Get product by SKU
server.tool(
    "get_product_by_sku",
    "Fetch a product's details by SKU",
    {
        sku: z.string().describe("The SKU of the product"),
    },
    async ({ sku }) => {
        try {
            const res = await api.get(`/product-store/product/detail/${sku}`);
            const product = res.data.data;

            return {
                content: [
                    {
                        type: "text",
                        text: `🛍️ Product: ${product.name}\n💰 Price: ₹${product.price}\n📦 In stock: ${product.quantity}`,
                    },
                ],
            };
        } catch (err: any) {
            return {
                content: [
                    {
                        type: "text",
                        text: `❌ Failed to fetch product with SKU "${sku}": ${err.response?.data?.message || err.message}`,
                    },
                ],
            };
        }
    }
);

server.tool("get_all_category", "Fetch All Categories", {}, async () => {
    try {
        const res = await api.get(`/list/category`);
        const category = res.data.data;
        const categoryList = category
            // .slice(0, 5) // limit for display
            .map((cat: any) => `🛍️ Category: ${cat.name}\n💰 Category Slug: ₹${cat.categorySlug}\n📦`)
            .join("\n\n");
        return {
            content: [
                {
                    type: "text",
                    text: `Found Categories:\n\n${categoryList}`,
                    metadata: { data: category }
                },
            ],
        };
    }
    catch (err: any) {
        return {
            content: [
                {
                    type: "text",
                    text: `❌ Failed to fetch Category ${err.response?.data?.message || err.message}`,
                },
            ],
        };
    }
});

// Tool 2: Search products
server.tool(
    "search_products",
    "Search for products by keyword and price range",
    {
        keyword: z.string().describe("Search keyword"),
        fromPrice: z.number().min(0).describe("Minimum price"),
        toPrice: z.number().min(0).describe("Maximum price"),
        categorySlug: z.string().describe("Search By Category Slug"),
        latestArrival: z.number().describe("Set to 1 to fetch the latest arrivals within the filtered results. Set to 0 to disable this filter. Defaults to 0."),
    },
    async ({ keyword, fromPrice, toPrice, latestArrival }) => {
        try {
            const res = await api.get(`/list/custom-product-list`, {
                params: { keyword, piceFrom: fromPrice, priceTo: toPrice, latestArrival },
            });
            const products = res.data.data;

            console.log(res.data, 'res.data')

            if (products.length === 0) {
                return {
                    content: [{ type: "text", text: "No products found." }],
                };
            }

            const productList = products
                .slice(0, 5) // limit for display
                .map(
                    (p: any) =>
                        `🛒 ${p.name}\nSKU: ${p.sku}\nPrice: ₹${p.price}\nStock: ${p.stock}\n---`
                )
                .join("\n\n");

            return {
                content: [{ type: "text", text: `Found products:\n\n${productList}`, metadata: { data: products.slice(0, 5) } }],
            };
        } catch (err: any) {
            return {
                content: [
                    {
                        type: "text",
                        text: `❌ Error searching products: ${err.response?.data?.message || err.message}`,
                    },
                ],
            };
        }
    }
);

// Main entry
async function main() {
    const transport = new StdioServerTransport(); ``
    await server.connect(transport);
    console.error("🧠 E-commerce MCP Server running via stdio");
}

main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
