package main

import (
	"context"
	"os"

	"github.com/cloudwego/eino-ext/components/model/openai"

	"github.com/cloudwego/eino/components/model"
	"github.com/cloudwego/eino/components/tool"
	"github.com/cloudwego/eino/compose"
	"github.com/cloudwego/eino/flow/agent/react"
	"github.com/cloudwego/eino/schema"
	"github.com/cloudwego/eino-ext/components/model/ark"
)

func CheckError(err error) {
	if err != nil {
		panic(err)
	}
}

func main() {
	ctx := context.TODO()
	// 先初始化所需的 chatModel
	chatModel, err := ark.NewChatModel(ctx, &ark.ChatModelConfig{
		APIKey: os.Getenv("ARK_API_KEY"),
		Model:  os.Getenv("ARK_MODEL_ID"),
	})
	CheckError(err)


	toolableChatModel, err := openai.NewChatModel(ctx, &openai.ChatModelConfig{
		APIKey:               "",
		Timeout:              0,
		HTTPClient:           nil,
		ByAzure:              false,
		AzureModelMapperFunc: nil,
		BaseURL:              "",
		APIVersion:           "",
		Model:                "",
		MaxTokens:            nil,
		MaxCompletionTokens:  nil,
		Temperature:          nil,
		TopP:                 nil,
		Stop:                 nil,
		PresencePenalty:      nil,
		ResponseFormat:       nil,
		Seed:                 nil,
		FrequencyPenalty:     nil,
		LogitBias:            nil,
		User:                 nil,
		ExtraFields:          nil,
		ReasoningEffort:      "",
		Modalities:           nil,
		Audio:                nil,
	})

	// 初始化所需的 tools
	tools := compose.ToolsNodeConfig{
		Tools: []tool.BaseTool{
			mytool,
			...
		},
	}

	// 创建 agent
	agent, err := react.NewAgent(ctx, &react.AgentConfig{
		ToolCallingModel: toolableChatModel,
		ToolsConfig:      tools,
		...
	}
}
