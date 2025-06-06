/*
Copyright 2024 The Karmada Authors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package common

import (
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/karmada-io/dashboard/pkg/dataselect"
	"github.com/karmada-io/dashboard/pkg/resource/common"
)

func parsePaginationPathParameter(request *gin.Context) *dataselect.PaginationQuery {
	itemsPerPage, err := strconv.ParseInt(request.Query("itemsPerPage"), 10, 0)
	if err != nil {
		return dataselect.NoPagination
	}

	page, err := strconv.ParseInt(request.Query("page"), 10, 0)
	if err != nil {
		return dataselect.NoPagination
	}

	// Frontend pages start from 1 and backend starts from 0
	return dataselect.NewPaginationQuery(int(itemsPerPage), int(page-1))
}

func parseFilterPathParameter(request *gin.Context) *dataselect.FilterQuery {
	return dataselect.NewFilterQuery(strings.Split(request.Query("filterBy"), ","))
}

// Parses query parameters of the request and returns a SortQuery object
func parseSortPathParameter(request *gin.Context) *dataselect.SortQuery {
	return dataselect.NewSortQuery(strings.Split(request.Query("sortBy"), ","))
}

// ParseDataSelectPathParameter parses query parameters of the request and returns a DataSelectQuery object
func ParseDataSelectPathParameter(request *gin.Context) *dataselect.DataSelectQuery {
	paginationQuery := parsePaginationPathParameter(request)
	sortQuery := parseSortPathParameter(request)
	filterQuery := parseFilterPathParameter(request)
	return dataselect.NewDataSelectQuery(paginationQuery, sortQuery, filterQuery)
}

// ParseNamespacePathParameter parses namespace selector for list pages in path parameter.
// The namespace selector is a comma separated list of namespaces that are trimmed.
// No namespaces mean "view all user namespaces", i.e., everything except kube-system.
func ParseNamespacePathParameter(request *gin.Context) *common.NamespaceQuery {
	namespace := request.Param("namespace")
	namespaces := strings.Split(namespace, ",")
	var nonEmptyNamespaces []string
	for _, n := range namespaces {
		n = strings.Trim(n, " ")
		if len(n) > 0 {
			nonEmptyNamespaces = append(nonEmptyNamespaces, n)
		}
	}
	return common.NewNamespaceQuery(nonEmptyNamespaces)
}
