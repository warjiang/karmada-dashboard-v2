import {Client} from "@modelcontextprotocol/sdk/client/index.js";
import {SSEClientTransport} from "@modelcontextprotocol/sdk/client/sse.js";
import {useEffect} from "react";

let client: Client | undefined = undefined
const baseUrl = new URL(window.origin + "/mcp/sse");
console.log('url', window.origin + "/mcp/sse")
try {
    client = new Client({
        name: 'sse-client',
        version: '1.0.0',
    });
    const sseTransport = new SSEClientTransport(baseUrl);
    await client.connect(sseTransport);
    console.log("Connected using SSE transport");
} catch (e) {
    console.log(e)
}

const McpPage = () => {
    useEffect(()=> {
        void (async ()=> {
            if(!client) return
            const {tools} = await client.listTools();
            const toolSchemas = tools.map(t => ({
                name: t.name,
                description: t.description,
                parameters: t.inputSchema
            }));
            console.log(toolSchemas)
            const prompt = `可用工具：${JSON.stringify(toolSchemas)}\n用户需求：`;
            console.log(prompt)
            const y = await client.callTool({
                name: "list_clusters",
            });
            console.log(y)
        })()
    }, [])
    return <>
        this is mcp page
    </>
}

export default McpPage;