package mcp

import "github.com/mark3labs/mcp-go/mcp"

// MCPTool represents a tool available from the MCP server.
type MCPTool struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	InputSchema struct {
		Type       string                 `json:"type"`
		Properties map[string]interface{} `json:"properties"`
		Required   []string               `json:"required,omitempty"`
	} `json:"inputSchema"`
}

func FromStandardTool(tool mcp.Tool) MCPTool {
	mcpTool := MCPTool{
		Name:        tool.Name,
		Description: tool.Description,
	}

	// Convert input schema
	mcpTool.InputSchema.Type = tool.InputSchema.Type
	mcpTool.InputSchema.Properties = tool.InputSchema.Properties
	mcpTool.InputSchema.Required = tool.InputSchema.Required

	return mcpTool
}
