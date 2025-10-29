package main

import (
	"context"
	"github.com/cloudwego/eino/components/prompt"
	"github.com/cloudwego/eino/schema"
	"github.com/karmada-io/dashboard/pkg/mcpclient"
)

func prepareSystemMessage(ctx context.Context, mcpClient *mcpclient.MCPClient) []*schema.Message {
	msgs := make([]*schema.Message, 0)
	template := prompt.FromMessages(schema.GoTemplate,
		schema.SystemMessage(`
You are a helpful assistant for Karmada cluster management.
You can provide guidance about Karmada concepts, best practices, and configuration help.
You can help with topics like:
- Cluster management and federation
- Resource propagation policies
- Scheduling and placement
- Multi-cluster applications
- Karmada installation and configuration

Please provide clear and practical advice based on your knowledge of Karmada and Kubernetes.
You have access to Karmada cluster management tools through function calls. When users ask about cluster resources, deployments, namespaces, or other Karmada objects, use the available tools to retrieve real-time information from the cluster.
IMPORTANT: Use the function calling mechanism provided by the system. Do NOT output raw XML tags or tool syntax in your responses. Simply call the appropriate functions when needed.
`),
	)
	tools := mcpClient.GetTools()
	result, err := template.Format(ctx, map[string]any{
		"tools": tools,
	})
	if err != nil {
		return msgs
	}
	return result
}
