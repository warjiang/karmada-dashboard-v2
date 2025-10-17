package mcpclient

import (
	"errors"
	"fmt"
	"os"
	"time"

	"k8s.io/klog/v2"
)

// MCPConfig holds configuration values used to initialize and control
// the behavior of an MCP client instance.
//
// Fields control transport selection, connection timeouts, kubernetes
// integration points and feature flags used by the client.
type MCPConfig struct {
	// Transport configuration
	TransportMode TransportMode
	// for stdio mode
	ServerPath     string
	StdioArguments []string
	// for sse mode
	SSEEndpoint    string
	ConnectTimeout time.Duration
	RequestTimeout time.Duration
	MaxRetries     int
}

// Validate verifies that required fields for the chosen transport are set
// and performs lightweight checks for file paths. It returns an error
// when a required value is missing.
func (c *MCPConfig) Validate() error {
	// Validate transport mode
	switch c.TransportMode {
	case TransportModeStdio:
		if c.ServerPath == "" {
			return errors.New("server path is required for stdio transport mode")
		}
		// Only check if file exists, don't fail if it doesn't (might be in PATH)
		if _, err := os.Stat(c.ServerPath); err != nil {
			klog.Warningf("MCP server not found at %s, assuming it's in PATH: %v", c.ServerPath, err)
		}
	case TransportModeSSE:
		if c.SSEEndpoint == "" {
			return errors.New("SSE endpoint is required for SSE transport mode")
		}
	default:
		return fmt.Errorf("unsupported transport mode: %s", c.TransportMode)
	}

	return nil
}

// NewMCPConfig creates a new `MCPConfig` using the provided option
// functions. Options are applied on top of the values returned by
// `DefaultMCPConfig`.
func NewMCPConfig(opts ...MCPConfigOption) *MCPConfig {
	cfg := DefaultMCPConfig()
	for _, opt := range opts {
		opt(cfg)
	}
	return cfg
}

// DefaultMCPConfig returns a sensible default configuration tuned for
// local development, using stdio transport and conservative timeouts.
func DefaultMCPConfig() *MCPConfig {
	return &MCPConfig{
		TransportMode:  TransportModeStdio,
		ConnectTimeout: 45 * time.Second,
		RequestTimeout: 60 * time.Second,
		MaxRetries:     3,
	}
}

type MCPConfigOption func(cfg *MCPConfig)

func WithSSEMode(endpoint string) MCPConfigOption {
	return func(cfg *MCPConfig) {
		cfg.TransportMode = TransportModeSSE
		cfg.SSEEndpoint = endpoint
	}
}
func WithConnectTimeout(connectTimeout time.Duration) MCPConfigOption {
	return func(cfg *MCPConfig) {
		cfg.ConnectTimeout = connectTimeout
	}
}
func WithRequestTimeout(requestTimeout time.Duration) MCPConfigOption {
	return func(cfg *MCPConfig) {
		cfg.RequestTimeout = requestTimeout
	}
}
func WithMaxRetries(maxRetries int) MCPConfigOption {
	return func(cfg *MCPConfig) {
		cfg.MaxRetries = maxRetries
	}
}
func WithStdioMode(serverPath string) MCPConfigOption {
	return func(cfg *MCPConfig) {
		cfg.TransportMode = TransportModeStdio
		cfg.ServerPath = serverPath
	}
}

func WithStdioArguments(stdioArguments ...string) MCPConfigOption {
	return func(cfg *MCPConfig) {
		cfg.StdioArguments = stdioArguments
	}
}
