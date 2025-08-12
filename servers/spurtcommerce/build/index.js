#!/usr/bin/env node
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
const dotenv_1 = __importDefault(require("dotenv"));
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const axios_1 = __importDefault(require("axios"));
const zod_1 = require("zod");
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, "../.env") });
// Update this to your real API base URL
const API_BASE = process.env.SPURTCOMMERCE_API_URL;
const API_KEY = process.env.SPURTCOMMERCE_API_KEY;
const api = axios_1.default.create({
    baseURL: API_BASE,
    headers: {
        "Content-Type": "application/json",
        "key": API_KEY
    },
});
// Create server instance
const server = new mcp_js_1.McpServer({
    name: "ecommerce",
    version: "1.0.0",
    capabilities: {
        resources: {},
        tools: {},
    },
});
// Tool 1: Get product by SKU
server.tool("get_product_by_sku", "Fetch a product's details by SKU", {
    sku: zod_1.z.string().describe("The SKU of the product"),
}, (_a) => __awaiter(void 0, [_a], void 0, function* ({ sku }) {
    var _b, _c;
    try {
        const res = yield api.get(`/product-store/product/detail/${sku}`);
        const product = res.data.data;
        return {
            content: [
                {
                    type: "text",
                    text: `🛍️ Product: ${product.name}\n💰 Price: ₹${product.price}\n📦 In stock: ${product.quantity}`,
                },
            ],
        };
    }
    catch (err) {
        return {
            content: [
                {
                    type: "text",
                    text: `❌ Failed to fetch product with SKU "${sku}": ${((_c = (_b = err.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.message) || err.message}`,
                },
            ],
        };
    }
}));
server.tool("get_all_category", "Fetch All Categories", {}, () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const res = yield api.get(`/list/category`);
        const category = res.data.data;
        const categoryList = category
            // .slice(0, 5) // limit for display
            .map((cat) => `🛍️ Category: ${cat.name}\n💰 Category Slug: ₹${cat.categorySlug}\n📦`)
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
    catch (err) {
        return {
            content: [
                {
                    type: "text",
                    text: `❌ Failed to fetch Category ${((_b = (_a = err.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || err.message}`,
                },
            ],
        };
    }
}));
// Tool 2: Search products
server.tool("search_products", "Search for products by keyword and price range", {
    keyword: zod_1.z.string().describe("Search keyword"),
    fromPrice: zod_1.z.number().min(0).describe("Minimum price"),
    toPrice: zod_1.z.number().min(0).describe("Maximum price"),
    categorySlug: zod_1.z.string().describe("Search By Category Slug"),
    latestArrival: zod_1.z.number().describe("Set to 1 to fetch the latest arrivals within the filtered results. Set to 0 to disable this filter. Defaults to 0."),
}, (_a) => __awaiter(void 0, [_a], void 0, function* ({ keyword, fromPrice, toPrice, latestArrival }) {
    var _b, _c;
    try {
        const res = yield api.get(`/list/custom-product-list`, {
            params: { keyword, piceFrom: fromPrice, priceTo: toPrice, latestArrival },
        });
        const products = res.data.data;
        console.log(res.data, 'res.data');
        if (products.length === 0) {
            return {
                content: [{ type: "text", text: "No products found." }],
            };
        }
        const productList = products
            .slice(0, 5) // limit for display
            .map((p) => `🛒 ${p.name}\nSKU: ${p.sku}\nPrice: ₹${p.price}\nStock: ${p.stock}\n---`)
            .join("\n\n");
        return {
            content: [{ type: "text", text: `Found products:\n\n${productList}`, metadata: { data: products.slice(0, 5) } }],
        };
    }
    catch (err) {
        return {
            content: [
                {
                    type: "text",
                    text: `❌ Error searching products: ${((_c = (_b = err.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.message) || err.message}`,
                },
            ],
        };
    }
}));
// Main entry
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const transport = new stdio_js_1.StdioServerTransport();
        ``;
        yield server.connect(transport);
        console.error("🧠 E-commerce MCP Server running via stdio");
    });
}
main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
