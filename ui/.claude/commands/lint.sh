#!/bin/bash
# Run ESLint on the Karmada Dashboard
echo "Running ESLint on dashboard..."
cd apps/dashboard && pnpm lint