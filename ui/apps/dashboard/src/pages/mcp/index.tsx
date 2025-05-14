import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { useEffect, useState } from 'react';
import { generateText } from 'ai';
import { custom } from '@ai-sdk/custom';

import { Button, Input } from 'antd';

let client: Client | undefined = undefined;
const baseUrl = new URL(window.origin + '/mcp/sse');
try {
  client = new Client({
    name: 'sse-client',
    version: '1.0.0',
  });
  const sseTransport = new SSEClientTransport(baseUrl);
  await client.connect(sseTransport);
  console.log('Connected using SSE transport');
} catch (e) {
  console.log(e);
}

const McpPage = () => {
  useEffect(() => {
    void (async () => {
      if (!client) return;
      const { tools } = await client.listTools();
      const toolSchemas = tools.map((t) => ({
        name: t.name,
        description: t.description,
        parameters: t.inputSchema,
      }));
      console.log(toolSchemas);
      const prompt = `可用工具：${JSON.stringify(toolSchemas)}\n用户需求：`;
      console.log(prompt);
      const y = await client.callTool({
        name: 'list_clusters',
      });
      console.log(y);
    })();
  }, []);
  const [query, setQuery] = useState('');
  return (
    <>
      this is mcp page
      <Input
        onChange={(e) => {
          setQuery(e.target.value);
        }}
      />
      <Button
        onClick={async () => {
          console.log('query is', query);
          const { text } = await generateText({
            model: custom('model-id'),
            prompt: 'Write a vegetarian lasagna recipe for 4 people.',
          });
        }}
      >
        ask me
      </Button>
    </>
  );
};

export default McpPage;
