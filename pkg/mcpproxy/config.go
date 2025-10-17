package mcpproxy

import (
	"errors"
	"fmt"
	"os"
	"time"

	"k8s.io/klog/v2"
)

// MCPConfig holds configuration for initializing the MCP client.
type MCPConfig struct {
	// Transport configuration
	TransportMode TransportMode
	ServerPath    string
	SSEEndpoint   string

	// Kubernetes configuration
	KubeconfigPath    string
	KubeconfigContext string

	// Connection settings
	ConnectTimeout time.Duration
	RequestTimeout time.Duration
	MaxRetries     int

	// Feature flags
	EnableMCP      bool
	StdioArguments []string
}

// Validate checks if the configuration is valid
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

	// Only warn about kubeconfig, don't fail
	if _, err := os.Stat(c.KubeconfigPath); err != nil {
		klog.Warningf("Kubeconfig not found at %s: %v", c.KubeconfigPath, err)
	}

	return nil
}

func NewMCPConfig(opts ...MCPConfigOption) *MCPConfig {
	cfg := DefaultMCPConfig()
	for _, opt := range opts {
		opt(cfg)
	}
	return cfg
}

// DefaultMCPConfig returns default configuration
func DefaultMCPConfig() *MCPConfig {
	return &MCPConfig{
		TransportMode:     TransportModeStdio,
		KubeconfigContext: "karmada-apiserver",
		ConnectTimeout:    45 * time.Second,
		RequestTimeout:    60 * time.Second,
		MaxRetries:        3,
		EnableMCP:         true,
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
func WithKubeconfigPath(kubeconfigPath string) MCPConfigOption {
	return func(cfg *MCPConfig) {
		cfg.KubeconfigPath = kubeconfigPath
	}
}
func WithKubeconfigContext(kubeconfigContext string) MCPConfigOption {
	return func(cfg *MCPConfig) {
		cfg.KubeconfigContext = kubeconfigContext
	}
}

func WithStdioArguments(stdioArguments ...string) MCPConfigOption {
	return func(cfg *MCPConfig) {
		cfg.StdioArguments = stdioArguments
	}
}
