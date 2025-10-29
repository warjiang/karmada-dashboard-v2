package main

import (
	"bufio"
	"context"
	"fmt"
	"github.com/mark3labs/mcp-go/client"
	"os"
	"os/signal"
	"syscall"

	"github.com/cloudwego/eino-ext/components/model/ark"
	"github.com/cloudwego/eino-ext/components/tool/mcp"
	"github.com/cloudwego/eino/compose"
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

	mcpClient, err := client.NewSSEMCPClient("http://localhost:1234/mcp/sse")
	CheckError(err)
	err = mcpClient.Start(ctx)
	CheckError(err)
	mcpTools, err := mcp.GetTools(ctx, &mcp.Config{Cli: mcpClient})

	// 初始化所需的 tools
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
	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-sigs
		fmt.Println("\nReceived SIGTERM or SIGINT. Exiting gracefully...")
		os.Exit(0)
	}()

	scanner := bufio.NewScanner(os.Stdin)
	fmt.Println("Enter input (type 'exit' to quit):")

	for {
		fmt.Printf("\nUser: ")
		if scanner.Scan() {
			input := scanner.Text()
			if input == "exit" {
				fmt.Println("Exiting...")
				break
			}
			newMsg := &schema.Message{
				Role:    schema.User,
				Content: input,
			}
			msgs = append(msgs, newMsg)
			streamResult, err := agent.Stream(ctx, msgs)
			CheckError(err)
			fmt.Printf("System: ")
			reportStream(streamResult)
			//fmt.Printf("%s\n", generate.String())
		} else {
			fmt.Println("Error reading input:", scanner.Err())
			break
		}
	}

}
