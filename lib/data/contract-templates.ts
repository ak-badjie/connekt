import type { ContractTemplate } from '@/lib/types/mail.types';

/**
 * Default System Contract Templates
 * 
 * Pre-defined contract templates for Connekt platform.
 * These are used for standard contracts and can be customized by agencies.
 */

export const SHORT_TERM_JOB_TEMPLATE: Omit<ContractTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
    name: 'Short-Term Job Contract',
    type: 'job_short_term',
    visibility: 'system',
    headerConfig: {
        showConnektLogo: true,
        showCoatOfArms: true,
        showGambianFlag: true
    },
    bodyTemplate: `# {{jobTitle}}

This Short-Term Employment Contract ("Contract") is entered into on {{contractDate}} between {{employerName}} ("Employer") and {{employeeName}} ("Employee") through the Connekt Platform, registered under the laws of the Republic of The Gambia.

## 1. POSITION AND DUTIES

The Employee agrees to perform the following services:

**Job Title:** {{jobTitle}}

**Description:** {{jobDescription}}

**Requirements:** {{jobRequirements}}

## 2. TERM OF EMPLOYMENT

This contract shall commence on {{startDate}} and terminate on {{endDate}}, unless terminated earlier in accordance with the provisions of this Contract.

**Duration:** {{duration}} {{durationUnit}}

## 3. COMPENSATION

The Employee shall be compensated as follows:

- **Payment Type:** {{paymentType}}
- **Amount:** {{paymentAmount}} {{paymentCurrency}}
- **Payment Schedule:** {{paymentSchedule}}

## 4. WORK ARRANGEMENT

- **Location:** {{workLocation}}
- **Hours:** {{hoursPerWeek}} hours per week

## 5. TERMINATION

Either party may terminate this Contract with {{noticePeriod}} days written notice.

{{terminationConditions}}`,
    defaultTerms: `1. **Intellectual Property:** All work product created by the Employee shall be the property of the Employer.

2. **Confidentiality:** The Employee agrees to maintain confidentiality of all proprietary information.

3. **Independent Contractor:** The Employee is an independent contractor, not an employee of the Employer.

4. **Payment Terms:** Payment shall be processed through the Connekt Platform within 5 business days of task completion and approval.

5. **Dispute Resolution:** Any disputes arising from this Contract shall be resolved through the Connekt Platform mediation process.

6. **Governing Law:** This Contract is governed by the laws of the Republic of The Gambia.

7. **Platform Enforcement:** The Connekt Platform enforces all payment and timeline terms of this Contract.

8. **Modifications:** No modifications to this Contract are valid unless made through the Connekt Platform.

By signing this Contract electronically through the Connekt Platform, both parties agree to all terms and conditions stated herein.`,
    variables: [
        { key: 'contractDate', label: 'Contract Date', type: 'date', required: true },
        { key: 'employerName', label: 'Employer Name', type: 'text', required: true },
        { key: 'employeeName', label: 'Employee Name', type: 'text', required: true },
        { key: 'jobTitle', label: 'Job Title', type: 'text', required: true },
        { key: 'jobDescription', label: 'Job Description', type: 'text', required: true },
        { key: 'jobRequirements', label: 'Job Requirements', type: 'text', required: false },
        { key: 'startDate', label: 'Start Date', type: 'date', required: true },
        { key: 'endDate', label: 'End Date', type: 'date', required: true },
        { key: 'duration', label: 'Duration', type: 'number', required: true },
        { key: 'durationUnit', label: 'Duration Unit', type: 'text', required: true },
        { key: 'paymentType', label: 'Payment Type', type: 'text', required: true },
        { key: 'paymentAmount', label: 'Payment Amount', type: 'currency', required: true },
        { key: 'paymentCurrency', label: 'Currency', type: 'text', required: true },
        { key: 'paymentSchedule', label: 'Payment Schedule', type: 'text', required: true },
        { key: 'workLocation', label: 'Work Location', type: 'text', required: true },
        { key: 'hoursPerWeek', label: 'Hours Per Week', type: 'number', required: false },
        { key: 'noticePeriod', label: 'Notice Period (days)', type: 'number', required: true },
        { key: 'terminationConditions', label: 'Termination Conditions', type: 'text', required: false }
    ]
};

export const LONG_TERM_JOB_TEMPLATE: Omit<ContractTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
    name: 'Long-Term Job Contract',
    type: 'job_long_term',
    visibility: 'system',
    headerConfig: {
        showConnektLogo: true,
        showCoatOfArms: true,
        showGambianFlag: true
    },
    bodyTemplate: `# {{jobTitle}}

This Long-Term Employment Contract ("Contract") is entered into on {{contractDate}} between {{employerName}} ("Employer") and {{employeeName}} ("Employee") through the Connekt Platform, registered under the laws of the Republic of The Gambia.

## 1. POSITION AND DUTIES

**Job Title:** {{jobTitle}}

**Description:** {{jobDescription}}

**Key Responsibilities:** {{jobRequirements}}

## 2. TERM OF EMPLOYMENT

This contract shall commence on {{startDate}} and continue for a period of {{duration}} {{durationUnit}}, renewable by mutual agreement.

**Expected End Date:** {{endDate}}

## 3. COMPENSATION

**Monthly Salary:** {{paymentAmount}} {{paymentCurrency}}

**Payment Schedule:** Paid monthly on the {{paymentSchedule}}

**Payment Method:** Through Connekt Platform escrow system

## 4. WORK ARRANGEMENT

- **Location:** {{workLocation}}
- **Expected Hours:** {{hoursPerWeek}} hours per week
- **Flexibility:** As mutually agreed upon

## 5. BENEFITS AND ENTITLEMENTS

{{benefits}}

## 6. TERMINATION

Either party may terminate this Contract with {{noticePeriod}} days written notice.

{{terminationConditions}}`,
    defaultTerms: `1. **Probation Period:** The first 30 days shall be a probationary period during which either party may terminate with 7 days notice.

2. **Intellectual Property:** All work product and intellectual property created during employment belongs to the Employer.

3. **Confidentiality:** Employee agrees to maintain strict confidentiality of all proprietary and sensitive information.

4. **Non-Compete:** Employee agrees not to work for direct competitors during employment and for 3 months after termination.

5. **Payment Protection:** Monthly payments are locked and enforced by the Connekt Platform escrow system.

6. **Performance Reviews:** Formal performance reviews will be conducted every 3 months.

7. **Leave Policy:** Employee is entitled to reasonable leave with advance notice, subject to Employer approval.

8. **Dispute Resolution:** Disputes shall be resolved through Connekt Platform arbitration before legal action.

9. **Contract Modifications:** Any changes must be agreed upon by both parties through the Connekt Platform.

10. **Governing Law:** This Contract is governed by the laws of the Republic of The Gambia.

11. **Platform Enforcement:** The Connekt Platform enforces payment schedules and contract compliance.

By signing electronically, both parties acknowledge they have read, understood, and agree to all terms.`,
    variables: [
        { key: 'contractDate', label: 'Contract Date', type: 'date', required: true },
        { key: 'employerName', label: 'Employer Name', type: 'text', required: true },
        { key: 'employeeName', label: 'Employee Name', type: 'text', required: true },
        { key: 'jobTitle', label: 'Job Title', type: 'text', required: true },
        { key: 'jobDescription', label: 'Job Description', type: 'text', required: true },
        { key: 'jobRequirements', label: 'Key Responsibilities', type: 'text', required: true },
        { key: 'startDate', label: 'Start Date', type: 'date', required: true },
        { key: 'duration', label: 'Duration', type: 'number', required: true },
        { key: 'durationUnit', label: 'Duration Unit (months/years)', type: 'text', required: true },
        { key: 'endDate', label: 'Expected End Date', type: 'date', required: true },
        { key: 'paymentAmount', label: 'Monthly Salary', type: 'currency', required: true },
        { key: 'paymentCurrency', label: 'Currency', type: 'text', required: true },
        { key: 'paymentSchedule', label: 'Payment Day (e.g., 1st, 15th)', type: 'text', required: true },
        { key: 'workLocation', label: 'Work Location', type: 'text', required: true },
        { key: 'hoursPerWeek', label: 'Expected Hours Per Week', type: 'number', required: true },
        { key: 'benefits', label: 'Benefits (if any)', type: 'text', required: false },
        { key: 'noticePeriod', label: 'Notice Period (days)', type: 'number', required: true },
        { key: 'terminationConditions', label: 'Additional Termination Terms', type: 'text', required: false }
    ]
};

export const PROJECT_BASED_JOB_TEMPLATE: Omit<ContractTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
    name: 'Project-Based Job Contract',
    type: 'job_project_based',
    visibility: 'system',
    headerConfig: {
        showConnektLogo: true,
        showCoatOfArms: true,
        showGambianFlag: true
    },
    bodyTemplate: `# {{projectTitle}}

This Project-Based Contract ("Contract") is entered into on {{contractDate}} between {{clientName}} ("Client") and {{contractorName}} ("Contractor") through the Connekt Platform, registered under the laws of the Republic of The Gambia.

## 1. PROJECT SCOPE

**Project Title:** {{projectTitle}}

**Project Description:** {{projectDescription}}

**Deliverables:** {{deliverables}}

## 2. PROJECT TIMELINE

**Start Date:** {{startDate}}

**Completion Deadline:** {{endDate}}

**Duration:** {{duration}} {{durationUnit}}

## 3. COMPENSATION

**Total Project Budget:** {{paymentAmount}} {{paymentCurrency}}

**Payment Structure:** {{paymentType}}

{{paymentMilestones}}

**Final Payment:** Upon project completion and client approval

## 4. DELIVERABLES AND ACCEPTANCE

The Contractor shall deliver all specified deliverables by the agreed deadlines. The Client shall have {{reviewPeriod}} days to review and provide feedback.

## 5. REVISIONS

The contract includes {{revisionRounds}} rounds of revisions. Additional revisions may incur extra charges.

## 6. TERMINATION

{{terminationConditions}}

Notice Period: {{noticePeriod}} days`,
    defaultTerms: `1. **Ownership:** Upon full payment, all deliverables and intellectual property transfer to the Client.

2. **Payment Milestones:** Payments are held in Connekt Platform escrow and released upon milestone approval.

3. **Quality Standards:** All work must meet professional industry standards and client specifications.

4. **Revisions:** Included revisions must be requested within 14 days of delivery.

5. **Delays:** If delays occur beyond Contractor's control, timeline may be extended by mutual agreement.

6. **Confidentiality:** Both parties agree to maintain confidentiality of all project information.

7. **Non-Solicitation:** Client agrees not to directly hire Contractor outside the platform during project and for 6 months after.

8. **Dispute Resolution:** Disputes handled through Connekt Platform mediation before arbitration.

9. **Force Majeure:** Neither party liable for delays due to circumstances beyond reasonable control.

10. **Governing Law:** This Contract is governed by the laws of the Republic of The Gambia.

11. **Platform Fees:** Standard Connekt Platform fees apply as per platform terms.

12. **Contract Enforcement:** The Connekt Platform enforces all payment and delivery terms.

Both parties acknowledge they have reviewed and agree to all terms by signing electronically.`,
    variables: [
        { key: 'contractDate', label: 'Contract Date', type: 'date', required: true },
        { key: 'clientName', label: 'Client Name', type: 'text', required: true },
        { key: 'contractorName', label: 'Contractor Name', type: 'text', required: true },
        { key: 'projectTitle', label: 'Project Title', type: 'text', required: true },
        { key: 'projectDescription', label: 'Project Description', type: 'text', required: true },
        { key: 'deliverables', label: 'Deliverables List', type: 'text', required: true },
        { key: 'startDate', label: 'Start Date', type: 'date', required: true },
        { key: 'endDate', label: 'Completion Deadline', type: 'date', required: true },
        { key: 'duration', label: 'Duration', type: 'number', required: true },
        { key: 'durationUnit', label: 'Duration Unit', type: 'text', required: true },
        { key: 'paymentAmount', label: 'Total Budget', type: 'currency', required: true },
        { key: 'paymentCurrency', label: 'Currency', type: 'text', required: true },
        { key: 'paymentType', label: 'Payment Type (fixed/milestone)', type: 'text', required: true },
        { key: 'paymentMilestones', label: 'Payment Milestones (if applicable)', type: 'text', required: false },
        { key: 'reviewPeriod', label: 'Review Period (days)', type: 'number', required: true },
        { key: 'revisionRounds', label: 'Included Revision Rounds', type: 'number', required: true },
        { key: 'noticePeriod', label: 'Notice Period (days)', type: 'number', required: true },
        { key: 'terminationConditions', label: 'Termination Conditions', type: 'text', required: false }
    ]
};

export const GENERAL_PROPOSAL_TEMPLATE: Omit<ContractTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
    name: 'General Business Proposal',
    type: 'general',
    visibility: 'system',
    headerConfig: {
        showConnektLogo: true,
        showCoatOfArms: false,
        showGambianFlag: false
    },
    bodyTemplate: `# {{proposalTitle}}

**Date:** {{date}}
**To:** {{recipientName}}
**From:** {{senderName}}

## Executive Summary

{{executiveSummary}}

## Proposed Solution

{{solutionDetails}}

## Timeline

{{timeline}}

## Investment

**Total Cost:** {{totalCost}} {{currency}}

{{paymentTerms}}

## Validity

This proposal is valid until {{validUntil}}.

## Acceptance

By signing below, you accept this proposal and authorize us to proceed with the described work.`,
    defaultTerms: `1. **Confidentiality:** This proposal contains proprietary information.
2. **Validity:** Prices are valid for the period specified.
3. **Payment:** 50% deposit required to commence work.
4. **Changes:** Any changes to scope may affect timeline and cost.
5. **Governing Law:** Governed by the laws of The Gambia.`,
    variables: [
        { key: 'proposalTitle', label: 'Proposal Title', type: 'text', required: true },
        { key: 'date', label: 'Date', type: 'date', required: true },
        { key: 'recipientName', label: 'Recipient Name', type: 'text', required: true },
        { key: 'senderName', label: 'Sender Name', type: 'text', required: true },
        { key: 'executiveSummary', label: 'Executive Summary', type: 'text', required: true },
        { key: 'solutionDetails', label: 'Solution Details', type: 'text', required: true },
        { key: 'timeline', label: 'Timeline', type: 'text', required: true },
        { key: 'totalCost', label: 'Total Cost', type: 'currency', required: true },
        { key: 'currency', label: 'Currency', type: 'text', required: true },
        { key: 'paymentTerms', label: 'Payment Terms', type: 'text', required: true },
        { key: 'validUntil', label: 'Valid Until', type: 'date', required: true }
    ]
};

export const SERVICE_AGREEMENT_TEMPLATE: Omit<ContractTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
    name: 'Service Agreement',
    type: 'general',
    visibility: 'system',
    headerConfig: {
        showConnektLogo: true,
        showCoatOfArms: true,
        showGambianFlag: true
    },
    bodyTemplate: `# Service Agreement: {{serviceName}}

This Service Agreement ("Agreement") is made on {{date}} between:

**Provider:** {{providerName}}
**Client:** {{clientName}}

## 1. Services Provided

The Provider agrees to deliver the following services:

{{serviceDescription}}

## 2. Term

This Agreement shall begin on {{startDate}} and continue until {{endDate}} or until terminated.

## 3. Fees and Payment

**Fee:** {{feeAmount}} {{currency}} per {{feePeriod}}

**Payment Terms:** {{paymentTerms}}

## 4. Obligations

**Provider Obligations:**
{{providerObligations}}

**Client Obligations:**
{{clientObligations}}

## 5. Termination

{{terminationClause}}`,
    defaultTerms: `1. **Independent Contractor:** Provider is an independent contractor.
2. **Intellectual Property:** Client owns final deliverables upon full payment.
3. **Confidentiality:** Both parties agree to keep information confidential.
4. **Liability:** Provider liability limited to fees paid.
5. **Dispute Resolution:** Mediation through Connekt Platform.
6. **Governing Law:** Laws of The Gambia.`,
    variables: [
        { key: 'serviceName', label: 'Service Name', type: 'text', required: true },
        { key: 'date', label: 'Date', type: 'date', required: true },
        { key: 'providerName', label: 'Provider Name', type: 'text', required: true },
        { key: 'clientName', label: 'Client Name', type: 'text', required: true },
        { key: 'serviceDescription', label: 'Service Description', type: 'text', required: true },
        { key: 'startDate', label: 'Start Date', type: 'date', required: true },
        { key: 'endDate', label: 'End Date', type: 'date', required: true },
        { key: 'feeAmount', label: 'Fee Amount', type: 'currency', required: true },
        { key: 'currency', label: 'Currency', type: 'text', required: true },
        { key: 'feePeriod', label: 'Fee Period (e.g. month, hour)', type: 'text', required: true },
        { key: 'paymentTerms', label: 'Payment Terms', type: 'text', required: true },
        { key: 'providerObligations', label: 'Provider Obligations', type: 'text', required: true },
        { key: 'clientObligations', label: 'Client Obligations', type: 'text', required: true },
        { key: 'terminationClause', label: 'Termination Clause', type: 'text', required: true }
    ]
};

export const SINGLE_TASK_ASSIGNMENT_TEMPLATE: Omit<ContractTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
    name: 'Single Task Assignment',
    type: 'task_assignment',
    visibility: 'system',
    headerConfig: {
        showConnektLogo: true,
        showCoatOfArms: false,
        showGambianFlag: false
    },
    bodyTemplate: `# Task Assignment: {{taskTitle}}

This agreement confirms the assignment of the task described below from {{clientName}} to {{contractorName}}.

## Task Details

**Task:** {{taskTitle}}

**Description:** {{taskDescription}}

**Deadline:** {{taskDeadline}}

## Compensation

**Payment:** {{taskPayment}} {{taskCurrency}}

**Terms:** {{paymentTerms}}

## Acceptance

By signing this agreement, the Contractor agrees to complete the task by the deadline and according to the requirements. The Client agrees to release payment upon satisfactory completion.`,
    defaultTerms: `1. **Completion:** Task must be marked as complete and proof submitted by the deadline.
2. **Payment:** Funds are held in escrow and released upon approval of the work.
3. **Disputes:** Connekt Platform mediation applies.`,
    variables: [
        { key: 'taskTitle', label: 'Task Title', type: 'text', required: true },
        { key: 'taskDescription', label: 'Task Description', type: 'text', required: true },
        { key: 'taskDeadline', label: 'Deadline', type: 'date', required: true },
        { key: 'taskPayment', label: 'Payment Amount', type: 'currency', required: true },
        { key: 'taskCurrency', label: 'Currency', type: 'text', required: true },
        { key: 'paymentTerms', label: 'Payment Terms', type: 'text', required: true },
        { key: 'clientName', label: 'Client Name', type: 'text', required: true },
        { key: 'contractorName', label: 'Contractor Name', type: 'text', required: true }
    ]
};

/**
 * All system templates
 */
export const SYSTEM_TEMPLATES = [
    SHORT_TERM_JOB_TEMPLATE,
    LONG_TERM_JOB_TEMPLATE,
    PROJECT_BASED_JOB_TEMPLATE,
    GENERAL_PROPOSAL_TEMPLATE,
    SERVICE_AGREEMENT_TEMPLATE,
    SINGLE_TASK_ASSIGNMENT_TEMPLATE
];
