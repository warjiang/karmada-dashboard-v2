package mcp

const (
	McpClientName    = "Karmada-Dashboard-MCP-Client"
	McpClientVersion = "0.0.0-dev"
)

// TransportMode defines the MCP transport mode
type TransportMode string

const (
	// TransportModeStdio represents the stdio transport mode for MCP communication
	TransportModeStdio TransportMode = "stdio"
	// TransportModeSSE represents the Server-Sent Events transport mode.
	TransportModeSSE TransportMode = "sse"
)
