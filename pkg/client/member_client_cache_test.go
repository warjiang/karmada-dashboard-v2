package client

import (
	"net/http/httptest"
	"strings"
	"testing"
)

func TestBuildMemberClientCacheKey(t *testing.T) {
	reqA := httptest.NewRequest("GET", "/", nil)
	reqA.Header.Set(authorizationHeader, "Bearer token-A")
	reqB := httptest.NewRequest("GET", "/", nil)
	reqB.Header.Set(authorizationHeader, "Bearer token-B")
	reqA2 := httptest.NewRequest("GET", "/", nil)
	reqA2.Header.Set(authorizationHeader, "Bearer token-A")

	keyACluster1 := buildMemberClientCacheKey(reqA, "member1")
	keyBCluster1 := buildMemberClientCacheKey(reqB, "member1")
	keyACluster2 := buildMemberClientCacheKey(reqA, "member2")
	keyA2Cluster1 := buildMemberClientCacheKey(reqA2, "member1")

	if keyACluster1 == keyBCluster1 {
		t.Fatalf("expected different cache keys for different tokens, got %q", keyACluster1)
	}
	if keyACluster1 == keyACluster2 {
		t.Fatalf("expected different cache keys for different clusters, got %q", keyACluster1)
	}
	if keyACluster1 != keyA2Cluster1 {
		t.Fatalf("expected stable cache key for same token+cluster, got %q and %q", keyACluster1, keyA2Cluster1)
	}
	if strings.Contains(keyACluster1, "token-A") {
		t.Fatalf("cache key should not contain raw token, got %q", keyACluster1)
	}
}
