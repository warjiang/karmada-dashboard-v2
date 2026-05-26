package oidc

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"strconv"
	"testing"
	"time"
)

func TestValidateState_InMemoryOneTime(t *testing.T) {
	p := &Provider{stateKey: []byte("test-key")}

	state, err := p.generateState()
	if err != nil {
		t.Fatalf("generate state failed: %v", err)
	}
	p.states.Store(state, stateEntry{createdAt: time.Now()})

	if err := p.ValidateState(state); err != nil {
		t.Fatalf("first validate should pass: %v", err)
	}
	if err := p.ValidateState(state); err == nil {
		t.Fatalf("second validate should fail for one-time in-memory state")
	}
}

func TestValidateState_StatelessFallback(t *testing.T) {
	p := &Provider{stateKey: []byte("test-key")}

	state, err := p.generateState()
	if err != nil {
		t.Fatalf("generate state failed: %v", err)
	}

	if err := p.ValidateState(state); err != nil {
		t.Fatalf("stateless validation should pass: %v", err)
	}
}

func TestValidateState_StatelessExpired(t *testing.T) {
	p := &Provider{stateKey: []byte("test-key")}

	nonce := "bm9uY2U"
	ts := strconv.FormatInt(time.Now().Add(-11*time.Minute).Unix(), 10)
	payload := nonce + "." + ts

	mac := hmac.New(sha256.New, p.stateKey)
	_, _ = mac.Write([]byte(payload))
	sigHex := hex.EncodeToString(mac.Sum(nil))
	state := payload + "." + sigHex

	if p.validateSignedState(state, 10*time.Minute) {
		t.Fatalf("expired state should fail")
	}
}
