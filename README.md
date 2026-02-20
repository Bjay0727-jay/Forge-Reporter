# ForgeComply 360 Reporter

Standalone FISMA/FedRAMP System Security Plan (SSP) authoring engine with OSCAL 1.1.2 validation.

[![CI](https://github.com/Bjay0727-jay/Forge-Reporter/actions/workflows/ci.yml/badge.svg)](https://github.com/Bjay0727-jay/Forge-Reporter/actions/workflows/ci.yml)
[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://forge-reporter.pages.dev)

## Overview

ForgeComply 360 Reporter is a 23-section guided wizard for creating NIST RMF-compliant System Security Plans. It features:

- **OSCAL 1.1.2 Compliance**: Export validated against official NIST JSON Schema
- **Offline-First**: Works without internet using localStorage persistence
- **Bidirectional Sync**: Connects to ForgeComply 360 backend for cloud storage
- **AI Assistance**: ForgeML-powered narrative generation (connected mode)
- **Multi-Format Export**: OSCAL JSON, OSCAL XML, PDF Report

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## Architecture

```
src/
├── components/         # Shared UI components
│   ├── ErrorBoundary   # Crash prevention
│   ├── Header/Footer   # Navigation
│   ├── Sidebar         # Section navigator
│   ├── ExportModal     # Export with validation
│   └── ImportModal     # OSCAL import
├── sections/           # 23 SSP section renderers
│   ├── SystemInfo      # Section 1: System overview
│   ├── FIPS199         # Section 2: Security categorization
│   ├── Controls        # Section 15: Control implementations
│   └── ...             # All 23 RMF sections
├── hooks/              # React hooks
│   ├── useAuth         # JWT authentication
│   ├── useSync         # Backend synchronization
│   └── useAI           # AI narrative generation
├── services/           # Business logic
│   ├── api             # HTTP client
│   ├── ai              # ForgeML integration
│   └── sspMapper       # Data transformation (871 lines)
├── utils/              # Utilities
│   ├── oscalExport     # OSCAL JSON/XML generation
│   ├── oscalImport     # OSCAL parsing
│   ├── oscalValidator  # Ajv schema validation
│   ├── pdfExport       # PDF generation
│   └── validation      # Field validation
└── types/              # TypeScript definitions
    ├── index           # SSPData (294 fields)
    └── oscal           # OSCAL type definitions
```

## SSP Section Coverage

| # | Section | RMF Step | Reference |
|---|---------|----------|-----------|
| 1 | System Information | Prepare | SSP Section 1-4 |
| 2 | FIPS 199 Categorization | Categorize | FIPS 199 |
| 3 | Information Types | Categorize | SP 800-60 |
| 4 | Control Baseline | Select | SP 800-53B |
| 5 | RMF Lifecycle Tracker | All Steps | SP 800-37 |
| 6 | Authorization Boundary | Implement | SSP Section 8 |
| 7 | Data Flow | Implement | SSP Section 8.2 |
| 8 | Network Architecture | Implement | SSP Section 8.1 |
| 9 | Ports, Protocols & Services | Implement | Appendix Q |
| 10 | System Interconnections | Implement | SSP Section 10-11 |
| 11 | Cryptographic Modules | Implement | FIPS 140 |
| 12 | Personnel & Roles | Prepare | SSP Section 9.1-9.4 |
| 13 | Digital Identity | Implement | SP 800-63 |
| 14 | Separation of Duties | Implement | AC-5 |
| 15 | Control Implementations | Implement | Appendix A |
| 16 | Security Policies | Implement | Appendix C |
| 17 | Supply Chain Risk Mgmt | Implement | SP 800-161 |
| 18 | Privacy Analysis | Implement | E-Gov Act |
| 19 | Contingency Plan | Implement | SP 800-34 |
| 20 | Incident Response | Implement | SP 800-61 |
| 21 | Configuration Management | Implement | Appendix H |
| 22 | Continuous Monitoring | Monitor | SP 800-137 |
| 23 | POA&M | Monitor | Appendix O |

## OSCAL Validation

The Reporter validates exports against the official NIST OSCAL 1.1.2 SSP JSON Schema using Ajv:

```typescript
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import oscalSchema from './schemas/oscal-ssp-schema.json';

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(oscalSchema);
```

Validation runs in three modes:
1. **Schema validation** - Structural compliance with NIST schema
2. **Best-practice checks** - Custom rules for federal compliance
3. **Force export** - Download with warnings for iterative authoring

## Operating Modes

### Offline Mode (Default)
- Data stored in browser localStorage
- Zero backend dependency
- Full export/import capabilities
- Ideal for air-gapped environments

### Connected Mode
- Authenticate via URL hash: `#token=JWT&ssp=ID&api=URL`
- Bidirectional sync with ForgeComply 360 backend
- AI-assisted narrative generation
- Real-time save status indicators

## Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.0 | UI framework |
| TypeScript | 5.9.3 | Type safety |
| Vite | 7.3.1 | Build tool |
| Tailwind CSS | 4.1.18 | Styling |
| Ajv | 8.18.0 | JSON Schema validation |
| jsPDF | 4.1.0 | PDF generation |
| js2xmlparser | 5.0.0 | XML export |

## Environment Variables

Create `.env` based on `.env.example`:

```env
# API Configuration (optional - only for connected mode)
VITE_API_URL=https://forge-comply360-api.stanley-riley.workers.dev
VITE_APP_NAME=ForgeComply 360 Reporter
```

## Deployment

The Reporter is deployed to Cloudflare Pages via GitHub Actions:

- **Production**: https://forge-reporter.pages.dev
- **Preview**: Auto-deployed for PRs

### Manual Deploy

```bash
npm run build
npx wrangler pages deploy dist --project-name=forge-reporter
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit a pull request

## License

Proprietary - Forge Cyber Defense, Inc.

---

**Forge Cyber Defense** - Service-Disabled Veteran-Owned Small Business (SDVOSB)
