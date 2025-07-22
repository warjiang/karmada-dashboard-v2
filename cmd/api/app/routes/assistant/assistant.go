/*
Copyright 2024 The Karmada Authors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package assistant

import (
	"context"
	"fmt"
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sashabaranov/go-openai"
	"k8s.io/klog/v2"

	"github.com/karmada-io/dashboard/cmd/api/app/router"
)

func init() {
	router.V1().POST("/assistant", Answering)
}

type AnsweringRequest struct {
	Prompt string `json:"prompt"`
}

// Answering is a handler for users to ask question to llm
func Answering(c *gin.Context) {
	var request AnsweringRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		klog.Errorf("Failed to bind request: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// In a real application, you would get the token from a secure source
	// and manage the client lifecycle appropriately.
	// For this example, we'll create a new client for each request.
	// IMPORTANT: Replace "your-api-key" with your actual OpenAI API key.
	// Consider using environment variables or a secret management system for the key.
	// IMPORTANT: Replace "your-api-key" with your actual OpenAI API key.
	// Consider using environment variables or a secret management system for the key.
	config := openai.DefaultConfig("xxx")
	// For users who have a self-hosted llm, they can configure the BaseURL.
	// For example:
	// config.BaseURL = "http://127.0.0.1:1234/v1"
	client := openai.NewClientWithConfig(config)

	resp, err := client.CreateChatCompletionStream(
		context.Background(),
		openai.ChatCompletionRequest{
			Model: openai.GPT3Dot5Turbo,
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleUser,
					Content: request.Prompt,
				},
			},
		},
	)
	if err != nil {
		klog.Errorf("Failed to create chat completion stream: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get response from LLM"})
		return
	}
	defer resp.Close()

	c.Writer.Header().Set("Content-Type", "text/event-stream")
	c.Writer.Header().Set("Cache-Control", "no-cache")
	c.Writer.Header().Set("Connection", "keep-alive")
	c.Writer.Header().Set("Access-Control-Allow-Origin", "*")

	for {
		response, err := resp.Recv()
		if err == io.EOF {
			break
		}
		if err != nil {
			klog.Errorf("Error receiving stream response: %v", err)
			// Handle the error, maybe by sending an error message to the client
			return
		}

		fmt.Fprintf(c.Writer, "data: %s\n\n", response.Choices[0].Delta.Content)
		c.Writer.Flush()
	}
}
