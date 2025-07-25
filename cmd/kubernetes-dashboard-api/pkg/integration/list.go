// Copyright 2017 The Kubernetes Authors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package integration

import (
	"github.com/karmada-io/dashboard/cmd/kubernetes-dashboard-api/pkg/integration/api"
)

// Getter is responsible for listing all supported integrations.
type Getter interface {
	// List returns list of all supported integrations.
	List() []api.Integration
}

// List implements integration getter interface. See Getter for
// more information.
func (in *manager) List() []api.Integration {
	result := make([]api.Integration, 0)

	// Append all types of integrations
	result = append(result, in.Metric().List()...)

	return result
}
