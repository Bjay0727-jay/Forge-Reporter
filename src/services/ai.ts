/**
 * ForgeComply 360 Reporter - AI Service (ForgeML)
 * Provides AI-powered writing assistance for SSP sections
 */

import { api, isOnlineMode } from './api';

// =============================================================================
// Types
// =============================================================================

export interface AIGenerateRequest {
  sectionKey: string;
  sectionLabel: string;
  currentContent?: string;
  systemContext: SystemContext;
  mode: 'generate' | 'refine' | 'expand';
  customInstructions?: string;
}

export interface SystemContext {
  systemName?: string;
  systemAcronym?: string;
  impactLevel?: string;
  orgName?: string;
  authType?: string;
  cloudModel?: string;
  deployModel?: string;
}

export interface AIGenerateResponse {
  content: string;
  tokens?: number;
  model?: string;
}

// =============================================================================
// Section Prompts - Professional FISMA/FedRAMP Language
// =============================================================================

export const SECTION_PROMPTS: Record<string, { system: string; user: string }> = {
  // System Information
  sysinfo: {
    system: `You are a senior cybersecurity compliance consultant specializing in FISMA and FedRAMP authorizations. Generate professional System Security Plan content that follows NIST SP 800-18 guidelines. Use formal, technical language appropriate for federal compliance documentation.`,
    user: `Write a comprehensive system description for "{{systemName}}" ({{systemAcronym}}), a {{impactLevel}}-impact {{cloudModel}} system operated by {{orgName}}.

Include:
- System purpose and business functions
- Types of data processed (federal, PII, CUI, etc.)
- Key user communities and access methods
- Integration points with other systems
- Operational context and deployment environment

Write 200-400 words in formal SSP language. Do not include headers or bullets - write as continuous prose.`,
  },

  // FIPS 199 Categorization
  fips199: {
    system: `You are a federal security categorization expert. Generate FIPS 199 security categorization justification following NIST SP 800-60 guidelines.`,
    user: `Write a FIPS 199 categorization justification for "{{systemName}}" with:
- Confidentiality: {{conf}}
- Integrity: {{integ}}
- Availability: {{avail}}
- Overall Impact: {{impactLevel}}

Explain the rationale for each impact level citing specific NIST SP 800-60 information types. Justify the overall system categorization based on the high-water mark principle. 150-250 words.`,
  },

  // Information Types
  infotypes: {
    system: `You are a NIST SP 800-60 information classification expert. Generate professional descriptions of information types processed by federal systems.`,
    user: `Describe the information types processed by "{{systemName}}" ({{impactLevel}} impact).

For each information type, explain:
- The NIST SP 800-60 category
- Why the assigned C/I/A levels are appropriate
- How this contributes to the overall system categorization

Focus on federal mission data, administrative data, and any PII/CUI. Write 150-250 words.`,
  },

  // Control Baseline
  baseline: {
    system: `You are a NIST 800-53 control baseline specialist. Generate professional documentation of control baseline selection and tailoring.`,
    user: `Document the control baseline selection for "{{systemName}}" ({{impactLevel}} impact system).

Include:
- Baseline selection rationale (Low/Moderate/High per NIST SP 800-53B)
- Any tailoring decisions and their justification
- Organizational overlays applied
- Compensating controls if applicable

Write 150-250 words in formal SSP language.`,
  },

  // RMF Lifecycle
  rmf: {
    system: `You are an RMF process expert. Document RMF lifecycle status per NIST SP 800-37 Rev 2.`,
    user: `Document the RMF lifecycle status for "{{systemName}}":
- Current RMF step (Prepare/Categorize/Select/Implement/Assess/Authorize/Monitor)
- Key activities completed
- Target ATO date and authorization artifacts
- Continuous monitoring integration plans

Write 100-200 words.`,
  },

  // Authorization Boundary
  boundary: {
    system: `You are a system architecture security expert. Generate authorization boundary descriptions per FedRAMP and FISMA requirements.`,
    user: `Describe the authorization boundary for "{{systemName}}" ({{cloudModel}} deployment).

Include:
- Physical and logical boundaries
- Network perimeter and segmentation
- External connections and data flows
- Components explicitly within scope
- Components explicitly excluded from scope

Write 200-300 words. Be specific about boundary demarcation.`,
  },

  // Data Flow
  dataflow: {
    system: `You are a data security architect. Document data flows and protection mechanisms.`,
    user: `Document the data flows for "{{systemName}}":
- Data ingestion points and sources
- Internal data movement and processing
- Data egress points and destinations
- Encryption at rest and in transit
- Key management approach
- Data retention and disposal

Write 200-300 words with focus on security controls.`,
  },

  // Network Architecture
  network: {
    system: `You are a network security architect. Document network architecture for federal systems.`,
    user: `Describe the network architecture for "{{systemName}}" ({{deployModel}} deployment):
- Network zones and segmentation
- Security groups and access control lists
- Primary and secondary data center locations
- Network monitoring and intrusion detection
- Connectivity to external networks

Write 200-300 words.`,
  },

  // Ports, Protocols, Services
  pps: {
    system: `You are a network security specialist. Document ports, protocols, and services.`,
    user: `Provide a narrative summary of network services for "{{systemName}}":
- Critical services and their ports
- Protocols in use (HTTP/S, SSH, etc.)
- Business justification for each service
- Compliance with FedRAMP/FISMA requirements

Write 100-150 words as a summary paragraph.`,
  },

  // Interconnections
  intercon: {
    system: `You are a system interconnection specialist. Document ISAs and MOUs.`,
    user: `Document system interconnections for "{{systemName}}":
- Connected external systems
- Data exchange agreements (ISA/MOU)
- Security requirements for connections
- Monitoring and audit of interconnections

Write 100-150 words.`,
  },

  // Cryptography
  crypto: {
    system: `You are a cryptography compliance expert. Document FIPS 140 validated cryptographic implementations.`,
    user: `Document the cryptographic protection strategy for "{{systemName}}":
- FIPS 140-2/3 validated modules in use
- Encryption algorithms for data at rest
- Encryption for data in transit
- Key management practices
- Certificate management

Write 150-250 words.`,
  },

  // Personnel
  personnel: {
    system: `You are an organizational security expert. Document personnel security roles and responsibilities.`,
    user: `Document the key security personnel for "{{systemName}}":
- System Owner responsibilities
- Authorizing Official role
- ISSO duties and qualifications
- Security team structure
- Training requirements

Write 100-150 words.`,
  },

  // Digital Identity
  identity: {
    system: `You are a digital identity specialist. Document IAL/AAL/FAL per NIST SP 800-63-3.`,
    user: `Document the digital identity requirements for "{{systemName}}":
- Identity Assurance Level (IAL) and justification
- Authenticator Assurance Level (AAL) and justification
- Federation Assurance Level (FAL) if applicable
- MFA methods implemented
- Identity proofing process

Write 150-200 words.`,
  },

  // Separation of Duties
  sepduty: {
    system: `You are an access control specialist. Document separation of duties per AC-5.`,
    user: `Document separation of duties for "{{systemName}}":
- Role-based access control structure
- Incompatible role combinations
- Dual-control requirements
- Privileged access management
- Audit of role assignments

Write 100-150 words.`,
  },

  // Control Implementations
  controls: {
    system: `You are a security control implementation expert. Document control implementation statements.`,
    user: `Provide guidance on documenting control implementations for "{{systemName}}" ({{impactLevel}} baseline):
- How to structure implementation statements
- Common vs. system-specific controls
- Inherited controls from cloud provider
- Evidence requirements

Write 150-200 words.`,
  },

  // Security Policies
  policies: {
    system: `You are a security policy specialist. Document policy framework and governance.`,
    user: `Document the security policy framework for "{{systemName}}":
- Policy documents by control family
- Policy ownership and review cycles
- Policy exception process
- Alignment with NIST 800-53

Write 100-150 words.`,
  },

  // SCRM
  scrm: {
    system: `You are a supply chain risk management expert. Document SCRM per NIST SP 800-161.`,
    user: `Document the supply chain risk management program for "{{systemName}}":
- SCRM plan summary
- Critical supplier identification
- SBOM requirements
- Software provenance verification
- Vendor risk assessment process

Write 150-200 words.`,
  },

  // Privacy
  privacy: {
    system: `You are a privacy compliance expert. Document privacy requirements per Privacy Act and OMB guidance.`,
    user: `Document the privacy analysis for "{{systemName}}":
- PII collection and types
- Privacy Threshold Assessment findings
- PIA requirement determination
- SORN status
- Privacy controls implemented

Write 150-200 words.`,
  },

  // Contingency Plan
  conplan: {
    system: `You are a business continuity expert. Document contingency planning per NIST SP 800-34.`,
    user: `Document the contingency plan summary for "{{systemName}}":
- Contingency plan purpose and scope
- Recovery objectives (RTO/RPO/MTD)
- Backup strategy and frequency
- Testing schedule and results

Write 150-200 words.`,
  },

  // Incident Response
  irplan: {
    system: `You are an incident response expert. Document IR capabilities per NIST SP 800-61.`,
    user: `Document the incident response plan for "{{systemName}}":
- IR plan purpose and scope
- Incident severity levels
- Response timeframes
- Notification requirements
- Testing and exercises

Write 150-200 words.`,
  },

  // Configuration Management
  cmplan: {
    system: `You are a configuration management expert. Document CM processes per NIST 800-128.`,
    user: `Document the configuration management program for "{{systemName}}":
- CM governance and oversight
- Baseline management approach
- Change control process
- Deviation management
- Compliance scanning

Write 150-200 words.`,
  },

  // Continuous Monitoring
  conmon: {
    system: `You are an ISCM expert. Document continuous monitoring per NIST SP 800-137.`,
    user: `Document the continuous monitoring strategy for "{{systemName}}":
- ISCM program type
- Control assessment rotation
- Automated monitoring tools
- Significant change criteria
- ATO renewal approach

Write 150-200 words.`,
  },

  // POA&M
  poam: {
    system: `You are a remediation management expert. Document POA&M processes.`,
    user: `Document the POA&M management process for "{{systemName}}":
- POA&M review frequency
- Remediation workflow
- Milestone tracking
- Risk acceptance process

Write 100-150 words.`,
  },
};

// =============================================================================
// AI Generation Functions
// =============================================================================

/**
 * Generate or refine content for an SSP section using AI
 */
export async function generateSectionContent(request: AIGenerateRequest): Promise<AIGenerateResponse> {
  const { sectionKey, currentContent, systemContext, mode, customInstructions } = request;

  // Get prompts for this section
  const prompts = SECTION_PROMPTS[sectionKey];
  if (!prompts) {
    throw new Error(`No AI prompts configured for section: ${sectionKey}`);
  }

  // Build the user prompt with variable substitution
  let userPrompt = prompts.user;
  userPrompt = substituteVariables(userPrompt, systemContext);

  // Modify prompt based on mode
  let systemPrompt = prompts.system;
  if (mode === 'refine' && currentContent) {
    systemPrompt += '\n\nYou are refining existing content. Improve clarity, completeness, and compliance language while maintaining the original intent.';
    userPrompt = `Current content:\n\n${currentContent}\n\n${customInstructions || 'Improve this content for better clarity and compliance language.'}`;
  } else if (mode === 'expand' && currentContent) {
    systemPrompt += '\n\nYou are expanding existing content. Add more detail and specificity while maintaining consistency with what is already written.';
    userPrompt = `Current content:\n\n${currentContent}\n\n${customInstructions || 'Expand this content with more detail and specificity.'}`;
  }

  // Check if online mode - if not, use local generation
  if (!isOnlineMode()) {
    return generateOfflineContent(request);
  }

  // Call the API
  try {
    const response = await api<{ content: string; tokens?: number }>('/api/v1/ai/generate', {
      method: 'POST',
      body: JSON.stringify({
        system_prompt: systemPrompt,
        user_prompt: userPrompt,
        max_tokens: 1024,
        temperature: 0.3,
      }),
    });

    return {
      content: response.content,
      tokens: response.tokens,
      model: 'llama-3.1-8b-instruct',
    };
  } catch (error) {
    console.error('AI generation failed:', error);
    // Fall back to offline generation
    return generateOfflineContent(request);
  }
}

/**
 * Generate content offline using templates
 */
function generateOfflineContent(request: AIGenerateRequest): AIGenerateResponse {
  const { sectionKey, sectionLabel, systemContext, mode, currentContent } = request;
  const { systemName, impactLevel, orgName } = systemContext;

  if (mode === 'refine' || mode === 'expand') {
    return {
      content: currentContent || '',
      model: 'offline-template',
    };
  }

  // Generate template-based content
  const templates: Record<string, string> = {
    sysinfo: `${systemName || '[System Name]'} is a ${impactLevel || 'Moderate'}-impact information system operated by ${orgName || '[Organization]'}. The system provides [describe primary functions and capabilities].

Key users include [describe user communities]. The system processes [describe data types including any federal data, PII, or CUI].

The system is deployed as [describe deployment model] and integrates with [describe key integrations]. Access is provided through [describe access methods].`,

    fips199: `Based on analysis per NIST SP 800-60 and FIPS 199, ${systemName || 'this system'} has been categorized as ${impactLevel || 'Moderate'} impact overall.

Confidentiality is rated [Level] due to [justification].
Integrity is rated [Level] due to [justification].
Availability is rated [Level] due to [justification].

The overall categorization follows the high-water mark principle.`,

    boundary: `The authorization boundary for ${systemName || 'this system'} encompasses all components necessary for system operation including [describe components].

The boundary is demarcated by [describe network boundaries]. Components within scope include [list components]. Components explicitly excluded include [list exclusions].`,

    default: `[This section requires content describing ${sectionLabel || sectionKey} for ${systemName || 'the system'}. Please provide details relevant to your organization's implementation.]`,
  };

  return {
    content: templates[sectionKey] || templates.default,
    model: 'offline-template',
  };
}

/**
 * Substitute template variables in prompt
 */
function substituteVariables(template: string, context: SystemContext): string {
  const vars: Record<string, string> = {
    systemName: context.systemName || '[System Name]',
    systemAcronym: context.systemAcronym || '[Acronym]',
    impactLevel: context.impactLevel || 'Moderate',
    orgName: context.orgName || '[Organization]',
    authType: context.authType || 'FISMA Agency ATO',
    cloudModel: context.cloudModel || 'cloud',
    deployModel: context.deployModel || 'cloud',
    conf: context.impactLevel || 'Moderate',
    integ: context.impactLevel || 'Moderate',
    avail: context.impactLevel || 'Moderate',
  };

  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return result;
}

/**
 * Get available AI modes for a section
 */
export function getAIModes(hasContent: boolean): Array<{ id: string; label: string; icon: string }> {
  const modes = [
    { id: 'generate', label: 'Generate', icon: '✨' },
  ];

  if (hasContent) {
    modes.push(
      { id: 'refine', label: 'Refine', icon: '🔄' },
      { id: 'expand', label: 'Expand', icon: '📝' }
    );
  }

  return modes;
}
