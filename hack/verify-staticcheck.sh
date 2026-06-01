#!/usr/bin/env bash
# copyright 2024 the karmada authors.
#
# licensed under the apache license, version 2.0 (the "license");
# you may not use this file except in compliance with the license.
# you may obtain a copy of the license at
#
#     http://www.apache.org/licenses/license-2.0
#
# unless required by applicable law or agreed to in writing, software
# distributed under the license is distributed on an "as is" basis,
# without warranties or conditions of any kind, either express or implied.
# see the license for the specific language governing permissions and
# limitations under the license.


set -o errexit
set -o nounset
set -o pipefail

REPO_ROOT=$(dirname "${BASH_SOURCE[0]}")/..
GOLANGCI_LINT_VER="v2.8.0"
GOLANGCI_LINT_BIN="$(go env GOPATH)/bin/golangci-lint"

cd "${REPO_ROOT}"

echo "Installing golangci-lint ${GOLANGCI_LINT_VER} with $(go version)"
# Build golangci-lint with the current Go toolchain to avoid
# "built with lower Go version than targeted module" errors.
GOBIN="$(go env GOPATH)/bin" go install "github.com/golangci/golangci-lint/v2/cmd/golangci-lint@${GOLANGCI_LINT_VER}"
echo "Using golangci-lint version:"
"${GOLANGCI_LINT_BIN}" version

if "${GOLANGCI_LINT_BIN}" run; then
  echo 'Congratulations!  All Go source files have passed staticcheck.'
else
  echo # print one empty line, separate from warning messages.
  echo 'Please review the above warnings.'
  echo 'Tips: The golangci-lint might help you fix some issues, try with the command "golangci-lint run --fix".'
  echo 'If the above warnings do not make sense, feel free to file an issue.'
  exit 1
fi
