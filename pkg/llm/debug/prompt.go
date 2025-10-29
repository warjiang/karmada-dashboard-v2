package main

import (
	"context"
	mcpp "github.com/cloudwego/eino-ext/components/prompt/mcp"
	"github.com/cloudwego/eino/schema"
	"github.com/mark3labs/mcp-go/client"
)

func prepareSystemMessage(ctx context.Context, mcpClient *client.Client) []*schema.Message {
	//	systemContent := `
	//You are a helpful assistant for Karmada cluster management.
	//You can provide guidance about Karmada concepts, best practices, and configuration help.
	//You can help with topics like:
	//- Cluster management and federation
	//- Resource propagation policies
	//- Scheduling and placement
	//- Multi-cluster applications
	//- Karmada installation and configuration
	//Please provide clear and practical advice based on your knowledge of Karmada and Kubernetes.
	//
	//You have access to Karmada cluster management tools through function calls. When users ask about cluster resources, deployments, namespaces, or other Karmada objects, use the available tools to retrieve real-time information from the cluster.
	//IMPORTANT: Use the function calling mechanism provided by the system. Do NOT output raw XML tags or tool syntax in your responses. Simply call the appropriate functions when needed, and then provide a natural language summary of the results to the user.
	//Available tools will be provided automatically. Use them when relevant to give accurate, up-to-date information about the Karmada cluster.`

	mcpPrompt, err := mcpp.NewPromptTemplate(ctx, &mcpp.Config{Cli: mcpClient})
	if err != nil {

	}
	result, err := mcpPrompt.Format(ctx, map[string]interface{}{"persona": "Describe the content of the image"})

	return result
}
