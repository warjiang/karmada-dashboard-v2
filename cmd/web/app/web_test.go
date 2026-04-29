package app

import "testing"

func TestIsAnonymousProxyPath(t *testing.T) {
	tests := []struct {
		name   string
		path   string
		expect bool
	}{
	{
		name:   "oidc enabled path",
		path:   "/api/v1/auth/oidc/enabled",
		expect: true,
	},
	{
		name:   "oidc login path",
		path:   "/api/v1/auth/oidc/login",
		expect: true,
	},
		{
			name:   "oidc callback path",
			path:   "/api/v1/auth/oidc/callback",
			expect: true,
		},
	{
		name:   "oidc enabled path with prefix",
		path:   "/dashboard/api/v1/auth/oidc/enabled",
		expect: true,
	},
	{
		name:   "oidc login path with prefix",
		path:   "/dashboard/api/v1/auth/oidc/login",
		expect: true,
		},
		{
			name:   "oidc callback path with prefix",
			path:   "/dashboard/api/v1/auth/oidc/callback",
			expect: true,
		},
		{
			name:   "non-oidc path",
			path:   "/api/v1/me",
			expect: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := isAnonymousProxyPath(tt.path)
			if got != tt.expect {
				t.Fatalf("isAnonymousProxyPath(%q) = %v, want %v", tt.path, got, tt.expect)
			}
		})
	}
}
