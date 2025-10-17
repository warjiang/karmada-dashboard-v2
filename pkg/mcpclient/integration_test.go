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

package mcpclient

import (
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"testing"
	"time"
)

// TestIntegration_MCPServer_SSE tests real MCP client-server communication using SSE transport
func TestIntegration_MCPServer_SSE(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	// Create test MCP server using mcp-go framework
	addr := "localhost:8080"
	testServer := NewTestSSEServer(addr)
	go func() {
		testServer.StartSSEServer()
	}()

	// Create MCP client with SSE configuration
	config := NewMCPConfig(
		WithSSEMode(testServer.CompleteSseEndpoint()),
		WithConnectTimeout(10*time.Second),
		WithRequestTimeout(10*time.Second),
	)

	client, err := NewMCPClient(config)
	if err != nil {
		t.Fatalf("Failed to create MCP client: %v", err)
	}
	defer client.Close()

	// Test 1: Verify server connection and capabilities
	if !client.HasToolsSupport() {
		t.Error("Expected server to have tools support")
	}

	// Test 2: List available tools
	tools := client.GetTools()
	if len(tools) == 0 {
		t.Error("Expected to get tools from server")
	}
	expectedTools := GetTestTools()
	if len(tools) != len(expectedTools) {
		t.Errorf("Expected %d tools, got %d", len(expectedTools), len(tools))
	}

	// Verify tool names match
	toolNames := make(map[string]bool)
	for _, tool := range tools {
		toolNames[tool.Name] = true
	}

	for _, expectedTool := range expectedTools {
		if !toolNames[expectedTool.Name] {
			t.Errorf("Expected tool %s not found", expectedTool.Name)
		}
	}

	// Test 3: List available resources
	resources, err := client.ListResources()
	if err != nil {
		t.Fatalf("Failed to list resources: %v", err)
	}

	expectedResources := GetTestResources()
	if len(resources) != len(expectedResources) {
		t.Errorf("Expected %d resources, got %d", len(expectedResources), len(resources))
	}

	// Test 4: Call tools with different parameters
	t.Run("ToolCalls", func(t *testing.T) {
		// Test echo tool
		result, err := client.CallTool("test_echo", map[string]interface{}{
			"message": "Hello, MCP!",
			"prefix":  "Test: ",
		})
		if err != nil {
			t.Errorf("Failed to call test_echo: %v", err)
		}
		expected := "Test: Hello, MCP!"
		if result != expected {
			t.Errorf("Expected %q, got %q", expected, result)
		}

		// Test calculate tool - addition
		result, err = client.CallTool("test_calculate", map[string]interface{}{
			"a":         10.5,
			"b":         20.3,
			"operation": "add",
		})
		if err != nil {
			t.Errorf("Failed to call test_calculate: %v", err)
		}
		expected = "30.80"
		if result != expected {
			t.Errorf("Expected %q, got %q", expected, result)
		}

		// Test calculate tool - division
		result, err = client.CallTool("test_calculate", map[string]interface{}{
			"a":         100,
			"b":         4,
			"operation": "divide",
		})
		if err != nil {
			t.Errorf("Failed to call test_calculate: %v", err)
		}
		expected = "25.00"
		if result != expected {
			t.Errorf("Expected %q, got %q", expected, result)
		}
	})
}

// TestIntegration_MCPServer_Stdio tests real MCP client-server communication using stdio transport
func TestIntegration_MCPServer_Stdio(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	if runtime.GOOS == "windows" {
		t.Skip("Skipping stdio test on Windows")
	}

	// Build a simple test server executable
	serverPath := buildTestServer(t)
	if serverPath == "" {
		t.Skip("Cannot build test server - this is expected in some environments")
		return
	}
	defer os.Remove(serverPath)

	// Create MCP client with stdio configuration
	config := NewMCPConfig(
		WithStdioMode(serverPath),
		WithConnectTimeout(10*time.Second),
		WithRequestTimeout(10*time.Second),
	)

	client, err := NewMCPClient(config)
	if err != nil {
		t.Fatalf("Failed to create MCP client: %v", err)
	}
	defer client.Close()

	// Test basic functionality
	if !client.HasToolsSupport() {
		t.Error("Expected server to have tools support")
	}

	tools := client.GetTools()
	if len(tools) == 0 {
		t.Error("Expected to get tools from server")
	}

	// Test tool call
	result, err := client.CallTool("test_echo", map[string]interface{}{
		"message": "Hello from stdio!",
	})
	if err != nil {
		t.Errorf("Failed to call test_echo: %v", err)
	}
	if result != "Hello from stdio!" {
		t.Errorf("Expected 'Hello from stdio!', got %q", result)
	}
}

// buildTestServer builds a simple test server executable for stdio testing
func buildTestServer(t *testing.T) string {
	// Create a temporary directory for the test server
	tempDir, err := os.MkdirTemp("", "mcp-test-server")
	if err != nil {
		t.Logf("Failed to create temp directory: %v", err)
		return ""
	}

	serverPath := filepath.Join(tempDir, "test-mcp-server")

	// Resolve absolute path to the testdata entry so build works regardless of CWD
	_, thisFile, _, ok := runtime.Caller(0)
	if !ok {
		t.Logf("Failed to get caller information")
		return ""
	}
	pkgDir := filepath.Dir(thisFile)
	entry := filepath.Join(pkgDir, "testdata", "test_server_main.go")

	// Build the test server from the testdata directory using absolute path
	cmd := exec.Command("go", "build", "-o", serverPath, entry)
	if err := cmd.Run(); err != nil {
		t.Logf("Failed to build test server: %v", err)
		return ""
	}

	return serverPath
}
