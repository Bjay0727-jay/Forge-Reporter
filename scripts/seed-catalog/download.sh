#!/bin/bash
# Download NIST OSCAL source data for Phase 1 catalog seeding
# Run from repo root: bash scripts/seed-catalog/download.sh

set -e
DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Downloading NIST 800-53 Rev 5 OSCAL catalog..."
curl -sL "https://raw.githubusercontent.com/usnistgov/oscal-content/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_catalog.json" \
  -o "$DIR/nist-800-53-rev5-catalog.json"

echo "Downloading baseline profiles..."
curl -sL "https://raw.githubusercontent.com/usnistgov/oscal-content/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_LOW-baseline_profile.json" \
  -o "$DIR/nist-800-53b-low.json"
curl -sL "https://raw.githubusercontent.com/usnistgov/oscal-content/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_MODERATE-baseline_profile.json" \
  -o "$DIR/nist-800-53b-moderate.json"
curl -sL "https://raw.githubusercontent.com/usnistgov/oscal-content/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_HIGH-baseline_profile.json" \
  -o "$DIR/nist-800-53b-high.json"

echo "Done. Files in $DIR:"
ls -lh "$DIR"/*.json
echo ""
echo "Next: node scripts/seed-catalog/parse-catalog.cjs"
