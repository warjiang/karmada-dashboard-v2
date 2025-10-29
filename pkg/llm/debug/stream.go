package main

import (
	"fmt"
	"github.com/cloudwego/eino/schema"
	"io"
)

func reportStream(sr *schema.StreamReader[*schema.Message]) {
	defer sr.Close()

	i := 0
	for {
		message, err := sr.Recv()
		if err == io.EOF {
			return
		}
		if err != nil {
			fmt.Printf("recv failed: %v", err)
		}
		fmt.Printf("%s", message.Content)
		i++
	}
}
