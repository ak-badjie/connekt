import type { ContractTemplate } from '@/lib/types/mail.types';
import { CONTRACT_TYPES, TEMPLATE_NAMES } from '../constants/contracts';

/**
 * ============================================================================
 * CONNEKT CONTRACT TEMPLATES - REFACTORED WITH SCHEDULE & CONDITIONS
 * ============================================================================
 * 
 * All templates now support:
 * - Schedule: workDays, startTime, endTime, breakDuration, isFlexible, timezone
 * - Conditions: penaltyPerLateTask, penaltyUnit, overtimeRate
 * 
 * Variables are auto-filled from:
 * 1. JobTemplates (saved templates with schedule/conditions)
 * 2. URL params when navigating to /mail
 * 3. CreateJobModal (job postings with schedule settings)
 */

// ============================================================================
// HELPER: Common schedule/penalty section for templates
// ============================================================================

const SCHEDULE_SECTION = `
## WORK SCHEDULE

**Schedule Type:** {{scheduleType}}
**Work Days:** {{workDaysFormatted}}
**Work Hours:** {{workStartTime}} - {{workEndTime}}
**Break Duration:** {{breakDuration}} minutes
**Timezone:** {{timezone}}
**Hours Per Week:** {{hoursPerWeek}} hours
`;

const PENALTY_SECTION = `
## PERFORMANCE & PENALTIES

**Late Delivery Penalty:** {{penaltyDisplay}}
**Overtime Rate:** {{overtimeRate}}x standard rate
`;

// ============================================================================
// 1. JOB CONTRACT TEMPLATE (Employment)
// ============================================================================

export const JOB_CONTRACT_TEMPLATE: Omit<ContractTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
    name: TEMPLATE_NAMES.EMPLOYMENT_CONTRACT,
    type: CONTRACT_TYPES.JOB,
    visibility: 'system',
    requiresEscrow: true,
    headerConfig: {
        showConnektLogo: true,
        showCoatOfArms: true,
        showGambianFlag: true
    },
    bodyTemplate: `# {{jobTitle}}

This Employment Contract ("Contract") is entered into on {{contractDate}} between {{employerName}} ("Employer") and {{employeeName}} ("Employee") through the Connekt Platform, registered under the laws of the Republic of The Gambia.

## 1. POSITION AND DUTIES

**Job Title:** {{jobTitle}}
**Description:** {{jobDescription}}
**Key Responsibilities:** {{jobRequirements}}

## 2. TERM OF EMPLOYMENT

**Start Date:** {{startDate}}
**Duration:** {{duration}} {{durationUnit}}
**Expected End Date:** {{endDate}}

## 3. COMPENSATION

**Salary:** {{paymentAmount}} {{paymentCurrency}}
**Payment Schedule:** {{paymentSchedule}}
**Payment Method:** Through Connekt Platform escrow system

## 4. WORK SCHEDULE

**Schedule Type:** {{scheduleType}}
**Work Days:** {{workDaysFormatted}}
**Work Hours:** {{workStartTime}} - {{workEndTime}}
**Break Duration:** {{breakDuration}} minutes
**Location:** {{workLocation}}
**Timezone:** {{timezone}}
**Hours Per Week:** {{hoursPerWeek}} hours

## 5. PERFORMANCE & PENALTIES

**Late Task Penalty:** {{penaltyDisplay}}
**Overtime Rate:** {{overtimeRate}}x standard rate

## 6. BENEFITS AND ENTITLEMENTS

{{benefits}}

## 7. TERMINATION

Either party may terminate this Contract with {{noticePeriod}} days written notice.

{{terminationConditions}}`,
    defaultTerms: `**STANDARD EMPLOYMENT TERMS (Connekt Platform)**

1. **Probation Period:** The first 30 days shall be a probationary period.
2. **Intellectual Property:** All work product belongs to the Employer.
3. **Confidentiality:** Employee agrees to maintain strict confidentiality.
4. **Payment Protection:** Payments enforced by Connekt Platform escrow.
5. **Schedule Enforcement:** Work hours monitored and enforced by platform.
6. **Penalty Enforcement:** Late delivery penalties automatically deducted.
7. **Performance Reviews:** Conducted every 3 months.
8. **Dispute Resolution:** Through Connekt Platform arbitration.
9. **Governing Law:** Laws of the Republic of The Gambia.

By signing electronically, both parties agree to all terms.`,
    variables: [
        // Core
        { key: 'contractDate', label: 'Contract Date', type: 'date', required: true },
        { key: 'employerName', label: 'Employer Name', type: 'text', required: true },
        { key: 'employeeName', label: 'Employee Name', type: 'text', required: true },
        { key: 'jobTitle', label: 'Job Title', type: 'text', required: true },
        { key: 'jobDescription', label: 'Job Description', type: 'text', required: true },
        { key: 'jobRequirements', label: 'Key Responsibilities', type: 'text', required: false },
        // Dates
        { key: 'startDate', label: 'Start Date', type: 'date', required: true },
        { key: 'duration', label: 'Duration', type: 'number', required: true },
        { key: 'durationUnit', label: 'Duration Unit', type: 'text', required: true },
        { key: 'endDate', label: 'End Date', type: 'date', required: true },
        // Payment
        { key: 'paymentAmount', label: 'Salary Amount', type: 'currency', required: true },
        { key: 'paymentCurrency', label: 'Currency', type: 'text', required: true },
        { key: 'paymentSchedule', label: 'Payment Schedule', type: 'text', required: true },
        // Schedule (auto-filled from job posting or template)
        { key: 'scheduleType', label: 'Schedule Type', type: 'text', required: false },
        { key: 'workDaysFormatted', label: 'Work Days', type: 'text', required: false },
        { key: 'workStartTime', label: 'Start Time', type: 'text', required: false },
        { key: 'workEndTime', label: 'End Time', type: 'text', required: false },
        { key: 'breakDuration', label: 'Break (minutes)', type: 'number', required: false },
        { key: 'timezone', label: 'Timezone', type: 'text', required: false },
        { key: 'workLocation', label: 'Work Location', type: 'text', required: false },
        { key: 'hoursPerWeek', label: 'Hours Per Week', type: 'number', required: false },
        // Penalties (auto-filled)
        { key: 'penaltyDisplay', label: 'Penalty Display', type: 'text', required: false },
        { key: 'overtimeRate', label: 'Overtime Rate', type: 'number', required: false },
        // Other
        { key: 'benefits', label: 'Benefits', type: 'text', required: false },
        { key: 'noticePeriod', label: 'Notice Period (days)', type: 'number', required: true },
        { key: 'terminationConditions', label: 'Termination Terms', type: 'text', required: false }
    ]
};

// ============================================================================
// 2. FREELANCE CONTRACT TEMPLATE (Project/Task Work)
// ============================================================================

export const FREELANCE_CONTRACT_TEMPLATE: Omit<ContractTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
    name: TEMPLATE_NAMES.FREELANCE_CONTRACT,
    type: CONTRACT_TYPES.PROJECT,
    visibility: 'system',
    requiresEscrow: false,
    headerConfig: {
        showConnektLogo: true,
        showCoatOfArms: true,
        showGambianFlag: true
    },
    bodyTemplate: `# {{projectTitle}}

This Freelance Contract ("Contract") is entered into on {{contractDate}} between {{clientName}} ("Client") and {{contractorName}} ("Contractor") through the Connekt Platform.

## 1. SCOPE OF WORK

**Engagement Title:** {{projectTitle}}
**Description:** {{projectDescription}}
**Deliverables:** {{deliverables}}

## 2. TIMELINE

**Start Date:** {{startDate}}
**Completion Deadline:** {{endDate}}
**Duration:** {{duration}} {{durationUnit}}

## 3. COMPENSATION

**Total Budget:** {{paymentAmount}} {{paymentCurrency}}
**Payment Structure:** {{paymentType}}
{{paymentMilestones}}
**Payment Method:** Connekt Platform wallet

## 4. WORK SCHEDULE

**Schedule Type:** {{scheduleType}}
**Work Days:** {{workDaysFormatted}}
**Work Hours:** {{workStartTime}} - {{workEndTime}}
**Break Duration:** {{breakDuration}} minutes
**Timezone:** {{timezone}}

## 5. PERFORMANCE & PENALTIES

**Late Delivery Penalty:** {{penaltyDisplay}}
**Overtime Rate:** {{overtimeRate}}x standard rate

## 6. DELIVERABLES AND ACCEPTANCE

The Contractor shall deliver all specified deliverables by the agreed deadlines. The Client shall have {{reviewPeriod}} days to review and provide feedback.

## 7. REVISIONS

The contract includes {{revisionRounds}} rounds of revisions.

## 8. TERMINATION

{{terminationConditions}}
Notice Period: {{noticePeriod}} days`,
    defaultTerms: `**STANDARD FREELANCE TERMS (Connekt Platform)**

1. **Ownership:** Upon full payment, all deliverables transfer to the Client.
2. **Quality Standards:** All work must meet professional industry standards.
3. **Revisions:** Must be requested within 14 days of delivery.
4. **Schedule Tracking:** Work hours and delivery times are tracked.
5. **Penalty Enforcement:** Late delivery penalties automatically applied.
6. **Confidentiality:** Both parties maintain confidentiality.
7. **Dispute Resolution:** Through Connekt Platform mediation.
8. **Governing Law:** Laws of the Republic of The Gambia.

Both parties agree to all terms by signing electronically.`,
    variables: [
        // Core
        { key: 'contractDate', label: 'Contract Date', type: 'date', required: true },
        { key: 'clientName', label: 'Client Name', type: 'text', required: true },
        { key: 'contractorName', label: 'Contractor Name', type: 'text', required: true },
        { key: 'projectTitle', label: 'Project Title', type: 'text', required: true },
        { key: 'projectDescription', label: 'Description', type: 'text', required: true },
        { key: 'deliverables', label: 'Deliverables', type: 'text', required: true },
        // Dates
        { key: 'startDate', label: 'Start Date', type: 'date', required: true },
        { key: 'endDate', label: 'Deadline', type: 'date', required: true },
        { key: 'duration', label: 'Duration', type: 'number', required: true },
        { key: 'durationUnit', label: 'Duration Unit', type: 'text', required: true },
        // Payment
        { key: 'paymentAmount', label: 'Budget', type: 'currency', required: true },
        { key: 'paymentCurrency', label: 'Currency', type: 'text', required: true },
        { key: 'paymentType', label: 'Payment Type', type: 'text', required: true },
        { key: 'paymentMilestones', label: 'Milestones', type: 'text', required: false },
        // Schedule (auto-filled)
        { key: 'scheduleType', label: 'Schedule Type', type: 'text', required: false },
        { key: 'workDaysFormatted', label: 'Work Days', type: 'text', required: false },
        { key: 'workStartTime', label: 'Start Time', type: 'text', required: false },
        { key: 'workEndTime', label: 'End Time', type: 'text', required: false },
        { key: 'breakDuration', label: 'Break (minutes)', type: 'number', required: false },
        { key: 'timezone', label: 'Timezone', type: 'text', required: false },
        // Penalties (auto-filled)
        { key: 'penaltyDisplay', label: 'Penalty Display', type: 'text', required: false },
        { key: 'overtimeRate', label: 'Overtime Rate', type: 'number', required: false },
        // Other
        { key: 'reviewPeriod', label: 'Review Period (days)', type: 'number', required: true },
        { key: 'revisionRounds', label: 'Revision Rounds', type: 'number', required: true },
        { key: 'noticePeriod', label: 'Notice Period (days)', type: 'number', required: true },
        { key: 'terminationConditions', label: 'Termination Terms', type: 'text', required: false }
    ]
};

// ============================================================================
// 3. PROJECT ADMIN TEMPLATE (Temporal Project Ownership)
// ============================================================================

export const PROJECT_ADMIN_TEMPLATE: Omit<ContractTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
    name: TEMPLATE_NAMES.PROJECT_ADMIN,
    type: CONTRACT_TYPES.PROJECT_ADMIN,
    visibility: 'system',
    requiresEscrow: true,
    headerConfig: {
        showConnektLogo: true,
        showCoatOfArms: true,
        showGambianFlag: true
    },
    bodyTemplate: `# Project Administration: {{projectTitle}}

This Agreement appoints {{contractorName}} as the **Project Administrator (Temporal Owner)** for the project "{{projectTitle}}".

## 1. AUTHORITY: TEMPORAL OWNER

The Administrator is granted **Totalitarian Access** to the project for the duration of this contract.

**Rights Granted:**
- Task Assignment: Sole authority to assign tasks to any workspace member
- Resource Management: Full control over project budget and resources
- Renaming & Structuring: Authority to rename and restructure tasks
- Sub-Contracting: Power to sub-contract parts of the project

## 2. SCOPE AND DELIVERABLES

**Project:** {{projectTitle}}
**Objective:** {{projectDescription}}
**Final Deliverable:** Verified **Proof of Project Completion (POP)**

## 3. COMPENSATION

**Admin Fee:** {{paymentAmount}} {{paymentCurrency}}
**Payment Condition:** Released ONLY upon Client approval of **POP**
**Sub-Contracting Budget:** {{subContractingBudget}}

## 4. WORK SCHEDULE

**Schedule Type:** {{scheduleType}}
**Work Days:** {{workDaysFormatted}}
**Work Hours:** {{workStartTime}} - {{workEndTime}}
**Timezone:** {{timezone}}

## 5. PERFORMANCE & PENALTIES

**Late Delivery Penalty:** {{penaltyDisplay}}
**Penalty Enforcement:** Deducted from admin fee before release

## 6. DURATION

**Start Date:** {{startDate}}
**Target Completion:** {{endDate}}

## 7. TERMINATION & REVOCATION

This "Temporal Ownership" is conditional. The Client retains the ultimate right to revoke access at any time if terms are breached or deadlines are missed.

{{terminationConditions}}`,
    defaultTerms: `**PROJECT ADMINISTRATION TERMS (Connekt Platform)**

1. **Temporal Ownership:** Administrator status is temporary and revocable.
2. **Proof of Project Completion (POP):** Payment triggered only by verified POP.
3. **Liability:** Administrator responsible for quality of all sub-tasks.
4. **Authority:** Full rights to manage, rename, and assign within scope.
5. **Schedule Tracking:** Availability and work hours are tracked.
6. **Penalty Enforcement:** Late penalties automatically deducted from escrow.
7. **Confidentiality:** Strict confidentiality regarding all project data.
8. **Revocation:** Client may revoke access immediately for cause.
9. **Governing Law:** Laws of The Gambia.

By signing, the Project Administrator accepts these responsibilities.`,
    variables: [
        // Core
        { key: 'contractDate', label: 'Contract Date', type: 'date', required: true },
        { key: 'clientName', label: 'Client Name', type: 'text', required: true },
        { key: 'contractorName', label: 'Administrator Name', type: 'text', required: true },
        { key: 'projectTitle', label: 'Project Title', type: 'text', required: true },
        { key: 'projectDescription', label: 'Project Objectives', type: 'text', required: true },
        // Dates
        { key: 'startDate', label: 'Start Date', type: 'date', required: true },
        { key: 'endDate', label: 'Target Completion', type: 'date', required: true },
        // Payment
        { key: 'paymentAmount', label: 'Admin Fee', type: 'currency', required: true },
        { key: 'paymentCurrency', label: 'Currency', type: 'text', required: true },
        { key: 'subContractingBudget', label: 'Sub-Contracting Budget', type: 'currency', required: false },
        // Schedule (auto-filled)
        { key: 'scheduleType', label: 'Schedule Type', type: 'text', required: false },
        { key: 'workDaysFormatted', label: 'Work Days', type: 'text', required: false },
        { key: 'workStartTime', label: 'Start Time', type: 'text', required: false },
        { key: 'workEndTime', label: 'End Time', type: 'text', required: false },
        { key: 'timezone', label: 'Timezone', type: 'text', required: false },
        // Penalties (auto-filled)
        { key: 'penaltyDisplay', label: 'Penalty Display', type: 'text', required: false },
        // Other
        { key: 'terminationConditions', label: 'Termination Terms', type: 'text', required: false }
    ]
};

// ============================================================================
// 4. TASK ADMIN TEMPLATE (Task Administration)
// ============================================================================

export const TASK_ADMIN_TEMPLATE: Omit<ContractTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
    name: TEMPLATE_NAMES.TASK_ADMIN,
    type: CONTRACT_TYPES.TASK_ADMIN,
    visibility: 'system',
    requiresEscrow: true,
    headerConfig: {
        showConnektLogo: true,
        showCoatOfArms: false,
        showGambianFlag: false
    },
    bodyTemplate: `# Task Administration: {{taskTitle}}

This Agreement appoints {{contractorName}} as the **Task Administrator** for "{{taskTitle}}".

## 1. AUTHORITY: TOTALITARIAN ACCESS

The Task Administrator is granted **Totalitarian Access** to this specific task.

**Rights Granted:**
- Sub-Tasking: Authority to break down and create sub-tasks
- Assignment: Power to assign sub-tasks to other contributors
- Budgeting: Control over the task's allocated budget

## 2. SCOPE

**Task:** {{taskTitle}}
**Description:** {{taskDescription}}
**Final Deliverable:** Verified **Proof of Task Completion (POT)**

## 3. COMPENSATION

**Fee:** {{paymentAmount}} {{paymentCurrency}}
**Payment Condition:** Released ONLY upon approval of **POT**

## 4. WORK SCHEDULE

**Schedule Type:** {{scheduleType}}
**Work Days:** {{workDaysFormatted}}
**Work Hours:** {{workStartTime}} - {{workEndTime}}
**Timezone:** {{timezone}}

## 5. PERFORMANCE & PENALTIES

**Late Delivery Penalty:** {{penaltyDisplay}}
**Penalty Enforcement:** Deducted from fee before release

## 6. TIMELINE

**Start Date:** {{startDate}}
**Deadline:** {{endDate}}`,
    defaultTerms: `**TASK ADMINISTRATION TERMS (Connekt Platform)**

1. **Task Ownership:** Administrator has full control over task execution.
2. **Proof of Task Completion (POT):** Payment requires verified POT.
3. **Sub-Contracting:** Administrator may delegate but remains responsible.
4. **Schedule Tracking:** Work hours and availability tracked.
5. **Penalty Enforcement:** Late penalties automatically deducted.
6. **Revocation:** Client may revoke rights at any time.
7. **Standard Terms:** All platform terms apply.

By signing, the Task Administrator accepts full responsibility.`,
    variables: [
        // Core
        { key: 'contractDate', label: 'Contract Date', type: 'date', required: true },
        { key: 'clientName', label: 'Client Name', type: 'text', required: true },
        { key: 'contractorName', label: 'Administrator Name', type: 'text', required: true },
        { key: 'taskTitle', label: 'Task Title', type: 'text', required: true },
        { key: 'taskDescription', label: 'Task Description', type: 'text', required: true },
        // Dates
        { key: 'startDate', label: 'Start Date', type: 'date', required: true },
        { key: 'endDate', label: 'Deadline', type: 'date', required: true },
        // Payment
        { key: 'paymentAmount', label: 'Fee', type: 'currency', required: true },
        { key: 'paymentCurrency', label: 'Currency', type: 'text', required: true },
        // Schedule (auto-filled)
        { key: 'scheduleType', label: 'Schedule Type', type: 'text', required: false },
        { key: 'workDaysFormatted', label: 'Work Days', type: 'text', required: false },
        { key: 'workStartTime', label: 'Start Time', type: 'text', required: false },
        { key: 'workEndTime', label: 'End Time', type: 'text', required: false },
        { key: 'timezone', label: 'Timezone', type: 'text', required: false },
        // Penalties (auto-filled)
        { key: 'penaltyDisplay', label: 'Penalty Display', type: 'text', required: false }
    ]
};

// ============================================================================
// PROPOSAL TEMPLATES (For applications/bids)
// ============================================================================

export const JOB_PROPOSAL_TEMPLATE: Omit<ContractTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
    name: TEMPLATE_NAMES.JOB_PROPOSAL,
    type: CONTRACT_TYPES.GENERAL,
    visibility: 'system',
    headerConfig: { showConnektLogo: true, showCoatOfArms: false, showGambianFlag: false },
    bodyTemplate: `# Application: {{jobTitle}}

**Applicant:** {{applicantName}}
**Key Skills:** {{skills}}

## Cover Letter
{{coverLetter}}

## Proposed Terms
- **Availability:** {{availability}}
- **Expected Salary:** {{proposedRate}}
- **Preferred Schedule:** {{scheduleType}}
- **Preferred Work Hours:** {{workStartTime}} - {{workEndTime}}
- **Experience:** {{experience}} years

I have reviewed the job requirements and believe I am a strong fit for this position.`,
    defaultTerms: `Professional Proposal Terms:
1. This proposal is valid for 14 days.
2. The applicant confirms the accuracy of the provided information.`,
    variables: [
        { key: 'applicantName', label: 'Full Name', type: 'text', required: true },
        { key: 'jobTitle', label: 'Job Title', type: 'text', required: true },
        { key: 'skills', label: 'Key Skills', type: 'text', required: true },
        { key: 'coverLetter', label: 'Cover Letter', type: 'text', required: true },
        { key: 'proposedRate', label: 'Expected Salary', type: 'currency', required: true },
        { key: 'availability', label: 'Availability', type: 'date', required: true },
        { key: 'experience', label: 'Years of Experience', type: 'number', required: true },
        // Schedule preferences
        { key: 'scheduleType', label: 'Schedule Preference', type: 'text', required: false },
        { key: 'workStartTime', label: 'Preferred Start Time', type: 'text', required: false },
        { key: 'workEndTime', label: 'Preferred End Time', type: 'text', required: false }
    ]
};

export const PROJECT_PROPOSAL_TEMPLATE: Omit<ContractTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
    name: TEMPLATE_NAMES.PROJECT_PROPOSAL,
    type: CONTRACT_TYPES.GENERAL,
    visibility: 'system',
    headerConfig: { showConnektLogo: true, showCoatOfArms: false, showGambianFlag: false },
    bodyTemplate: `# Proposal: {{projectTitle}}

**Freelancer:** {{applicantName}}

## Approach & Methodology
{{approach}}

## Timeline & Milestones
{{timeline}}

## Financial Bid
**Total Bid:** {{proposedRate}}
**Payment Terms:** {{paymentTerms}}

## Availability
- **Schedule Type:** {{scheduleType}}
- **Work Hours:** {{workStartTime}} - {{workEndTime}}

I am ready to deliver high-quality results for this project.`,
    defaultTerms: `Standard Project Proposal Terms.`,
    variables: [
        { key: 'applicantName', label: 'Freelancer Name', type: 'text', required: true },
        { key: 'projectTitle', label: 'Project Title', type: 'text', required: true },
        { key: 'approach', label: 'Approach', type: 'text', required: true },
        { key: 'timeline', label: 'Timeline', type: 'text', required: true },
        { key: 'proposedRate', label: 'Bid Amount', type: 'currency', required: true },
        { key: 'paymentTerms', label: 'Payment Terms', type: 'text', required: true },
        // Schedule
        { key: 'scheduleType', label: 'Schedule Type', type: 'text', required: false },
        { key: 'workStartTime', label: 'Start Time', type: 'text', required: false },
        { key: 'workEndTime', label: 'End Time', type: 'text', required: false }
    ]
};

export const TASK_PROPOSAL_TEMPLATE: Omit<ContractTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
    name: TEMPLATE_NAMES.TASK_PROPOSAL,
    type: CONTRACT_TYPES.GENERAL,
    visibility: 'system',
    headerConfig: { showConnektLogo: true, showCoatOfArms: false, showGambianFlag: false },
    bodyTemplate: `# Bid for Task: {{taskTitle}}

**Bidder:** {{applicantName}}

**Bid Amount:** {{proposedRate}}
**Delivery Date:** {{deliveryDate}}

## Availability
- **Schedule Type:** {{scheduleType}}
- **Work Hours:** {{workStartTime}} - {{workEndTime}}

## Notes
{{notes}}`,
    defaultTerms: `Task Bid Terms.`,
    variables: [
        { key: 'applicantName', label: 'Your Name', type: 'text', required: true },
        { key: 'taskTitle', label: 'Task Title', type: 'text', required: true },
        { key: 'proposedRate', label: 'Bid Amount', type: 'currency', required: true },
        { key: 'deliveryDate', label: 'Delivery Date', type: 'date', required: true },
        { key: 'notes', label: 'Notes', type: 'text', required: false },
        // Schedule
        { key: 'scheduleType', label: 'Schedule Type', type: 'text', required: false },
        { key: 'workStartTime', label: 'Start Time', type: 'text', required: false },
        { key: 'workEndTime', label: 'End Time', type: 'text', required: false }
    ]
};

// ============================================================================
// SYSTEM TEMPLATES EXPORT
// ============================================================================

export const SYSTEM_TEMPLATES = [
    JOB_CONTRACT_TEMPLATE,
    FREELANCE_CONTRACT_TEMPLATE,
    PROJECT_ADMIN_TEMPLATE,
    TASK_ADMIN_TEMPLATE,
    JOB_PROPOSAL_TEMPLATE,
    PROJECT_PROPOSAL_TEMPLATE,
    TASK_PROPOSAL_TEMPLATE
];
