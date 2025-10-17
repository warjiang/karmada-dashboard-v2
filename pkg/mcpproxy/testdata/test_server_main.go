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

// +build ignore

package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"

	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"
)

func main() {
	s := server.NewMCPServer("Test MCP Server", "1.0.0")

	// Add test tools
	s.AddTool(
		mcp.NewTool("test_echo",
			mcp.WithString("message", mcp.Required()),
			mcp.WithString("prefix", mcp.Optional()),
		),
		testEchoHandler,
	)

	s.AddTool(
		mcp.NewTool("test_calculate",
			mcp.WithNumber("a", mcp.Required()),
			mcp.WithNumber("b", mcp.Required()),
			mcp.WithString("operation", mcp.Required()),
		),
		testCalculateHandler,
	)

	s.AddTool(
		mcp.NewTool("test_delay",
			mcp.WithNumber("milliseconds", mcp.Required()),
		),
		testDelayHandler,
	)

	// Add test resources
	s.AddResource("test://resource1", "Test Resource 1", "text/plain", func() string {
		return "Test resource content 1"
	})

	s.AddResource("test://resource2", "Test Resource 2", "application/json", func() string {
		data := map[string]interface{}{
			"name":  "Test Resource 2",
			"value": 42,
			"items": []string{"item1", "item2", "item3"},
		}
		jsonData, _ := json.Marshal(data)
		return string(jsonData)
	})

	// Start the server with stdio transport
	server.ServeStdio(s)
}

func testEchoHandler(arguments map[string]interface{}) (*mcp.CallToolResult, error) {
	message, ok := arguments["message"].(string)
	if !ok {
		return nil, fmt.Errorf("message parameter is required and must be a string")
	}

	prefix := ""
	if prefixArg, exists := arguments["prefix"]; exists {
		prefix, _ = prefixArg.(string)
	}

	result := prefix + message

	return &mcp.CallToolResult{
		Content: []mcp.Content{
			{Type: "text", Text: result},
		},
	}, nil
}

func testCalculateHandler(arguments map[string]interface{}) (*mcp.CallToolResult, error) {
	a, ok1 := arguments["a"].(float64)
	b, ok2 := arguments["b"].(float64)
	operation, ok3 := arguments["operation"].(string)

	if !ok1 || !ok2 || !ok3 {
		return nil, fmt.Errorf("a, b, and operation parameters are required")
	}

	var result float64
	switch operation {
	case "add":
		result = a + b
	case "subtract":
		result = a - b
	case "multiply":
		result = a * b
	case "divide":
		if b == 0 {
			return nil, fmt.Errorf("division by zero")
		}
		result = a / b
	default:
		return nil, fmt.Errorf("unsupported operation: %s", operation)
	}

	return &mcp.CallToolResult{
		Content: []mcp.Content{
			{Type: "text", Text: fmt.Sprintf("%.2f", result)},
		},
	}, nil
}

func testDelayHandler(arguments map[string]interface{}) (*mcp.CallToolResult, error) {
	milliseconds, ok := arguments["milliseconds"].(float64)
	if !ok || milliseconds < 0 {
		return nil, fmt.Errorf("milliseconds parameter is required and must be a positive number")
	}

	// In a real implementation, we'd use time.Sleep here
	// For testing purposes, we'll just return immediately
	_ = milliseconds

	return &mcp.CallToolResult{
		Content: []mcp.Content{
			{Type: "text", Text: fmt.Sprintf("Delayed for %.0f milliseconds", milliseconds)},
		},
	}, nil
}