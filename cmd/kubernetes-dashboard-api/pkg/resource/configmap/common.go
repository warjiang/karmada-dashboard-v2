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

package configmap

import (
	api "k8s.io/api/core/v1"
	"github.com/karmada-io/dashboard/cmd/kubernetes-dashboard-api/pkg/resource/dataselect"
)

// The code below allows to perform complex data section on []api.ConfigMap

type ConfigMapCell api.ConfigMap

func (self ConfigMapCell) GetProperty(name dataselect.PropertyName) dataselect.ComparableValue {
	switch name {
	case dataselect.NameProperty:
		return dataselect.StdComparableString(self.ObjectMeta.Name)
	case dataselect.CreationTimestampProperty:
		return dataselect.StdComparableTime(self.ObjectMeta.CreationTimestamp.Time)
	case dataselect.NamespaceProperty:
		return dataselect.StdComparableString(self.ObjectMeta.Namespace)
	default:
		// if name is not supported then just return a constant dummy value, sort will have no effect.
		return nil
	}
}

func toCells(std []api.ConfigMap) []dataselect.DataCell {
	cells := make([]dataselect.DataCell, len(std))
	for i := range std {
		cells[i] = ConfigMapCell(std[i])
	}
	return cells
}

func fromCells(cells []dataselect.DataCell) []api.ConfigMap {
	std := make([]api.ConfigMap, len(cells))
	for i := range std {
		std[i] = api.ConfigMap(cells[i].(ConfigMapCell))
	}
	return std
}
