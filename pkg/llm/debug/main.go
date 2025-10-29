package main

import (
	"bufio"
	"context"
	"fmt"
	"github.com/cloudwego/eino-ext/components/tool/mcp"
	"github.com/cloudwego/eino/compose"
	"github.com/karmada-io/dashboard/pkg/mcpclient"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/cloudwego/eino-ext/components/model/ark"
	"github.com/cloudwego/eino/flow/agent/react"
	"github.com/cloudwego/eino/schema"
	_ "github.com/joho/godotenv/autoload"
)

func CheckError(err error) {
	if err != nil {
		panic(err)
	}
}

func main() {
	ctx := context.TODO()
	// 先初始化所需的 chatModel
	toolableChatModel, err := ark.NewChatModel(ctx, &ark.ChatModelConfig{
		APIKey: os.Getenv("ARK_API_KEY"),
		Model:  os.Getenv("ARK_MODEL_ID"),
	})
	CheckError(err)

	mcpClient, err := mcpclient.NewMCPClientWithOptions(
		mcpclient.WithSSEMode("http://localhost:1234/mcp/sse"),
		mcpclient.WithConnectTimeout(60*time.Second),
		mcpclient.WithRequestTimeout(60*time.Second),
	)
	CheckError(err)

	//tools := mcpClient.GetTools()
	//for _, tool := range tools {
	//	fmt.Printf("%+v\n", tool)
	//}

	// 初始化所需的 tools
	mcpTools, err := mcp.GetTools(ctx, &mcp.Config{Cli: mcpClient.GetRawClient()})

	tools := compose.ToolsNodeConfig{
		Tools: mcpTools,
	}

	// 创建 agent
	agent, err := react.NewAgent(ctx, &react.AgentConfig{
		ToolCallingModel: toolableChatModel,
		ToolsConfig:      tools,
	})
	CheckError(err)

	msgs := make([]*schema.Message, 0)
	//	msgs = append(msgs, schema.SystemMessage(`You are a helpful assistant for Karmada cluster management.
	//You can provide guidance about Karmada concepts, best practices, and configuration help.
	//You can help with topics like:
	//- Cluster management and federation
	//- Resource propagation policies
	//- Scheduling and placement
	//- Multi-cluster applications
	//- Karmada installation and configuration
	//
	//Please provide clear and practical advice based on your knowledge of Karmada and Kubernetes.
	//You have access to Karmada cluster management tools through function calls. When users ask about cluster resources, deployments, namespaces, or other Karmada objects, use the available tools to retrieve real-time information from the cluster.
	//IMPORTANT: Use the function calling mechanism provided by the system. Do NOT output raw XML tags or tool syntax in your responses. Simply call the appropriate functions when needed.
	//`))

	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-sigs
		fmt.Println("\nReceived SIGTERM or SIGINT. Exiting gracefully...")
		os.Exit(0)
	}()

	scanner := bufio.NewScanner(os.Stdin)
	fmt.Println("Enter input (type 'exit' to quit):")
	//message := prepareSystemMessage(ctx, mcpClient)
	//message = message
	for {
		fmt.Printf("\nUser: ")
		if scanner.Scan() {
			input := scanner.Text()
			if input == "exit" {
				fmt.Println("Exiting...")
				break
			}
			newMsgs := []*schema.Message{
				{
					Role:    schema.User,
					Content: input,
				},
			}
			//msgs = append(msgs, newMsg)
			//streamResult, err := agent.Stream(ctx, msgs)
			//CheckError(err)
			//fmt.Printf("System: ")
			//reportStream(streamResult)
			result, err := agent.Generate(ctx, newMsgs)
			CheckError(err)
			fmt.Print(result.Content)

			//fmt.Printf("%s\n", generate.String())
		} else {
			fmt.Println("Error reading input:", scanner.Err())
			break
		}
	}

}
