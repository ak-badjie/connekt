import type { ContractTemplate } from '@/lib/types/mail.types';

/**
 * Default System Contract Templates
 */

export const JOB_CONTRACT_TEMPLATE: Omit<ContractTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
    name: 'Employment Contract',
    type: 'job',
    visibility: 'system',
    requiresEscrow: true,
    headerConfig: {
        showConnektLogo: true,
        showCoatOfArms: true,
        showGambianFlag: true
    },
    // ... (rest of JOB_TEMPLATE as before)
    bodyTemplate: `# {{jobTitle}}

This Employment Contract ("Contract") is entered into on {{contractDate}} between {{employerName}} ("Employer") and {{employeeName}} ("Employee") through the Connekt Platform, registered under the laws of the Republic of The Gambia.

## 1. POSITION AND DUTIES

**Job Title:** {{jobTitle}}

**Description:** {{jobDescription}}

**Key Responsibilities:** {{jobRequirements}}

## 2. TERM OF EMPLOYMENT

This contract shall commence on {{startDate}} and continue for a period of {{duration}} {{durationUnit}}, renewable by mutual agreement.

**Expected End Date:** {{endDate}}

## 3. COMPENSATION

**Salary:** {{paymentAmount}} {{paymentCurrency}}

**Payment Schedule:** Paid on the {{paymentSchedule}}

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
        { key: 'paymentAmount', label: 'Salary Amount', type: 'currency', required: true },
        { key: 'paymentCurrency', label: 'Currency', type: 'text', required: true },
        { key: 'paymentSchedule', label: 'Payment Schedule', type: 'text', required: true },
        { key: 'workLocation', label: 'Work Location', type: 'text', required: true },
        { key: 'hoursPerWeek', label: 'Expected Hours Per Week', type: 'number', required: true },
        { key: 'benefits', label: 'Benefits (if any)', type: 'text', required: false },
        { key: 'noticePeriod', label: 'Notice Period (days)', type: 'number', required: true },
        { key: 'terminationConditions', label: 'Additional Termination Terms', type: 'text', required: false }
    ]
};

export const FREELANCE_CONTRACT_TEMPLATE: Omit<ContractTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
    name: 'Freelance Contract (Workspace, Project or Task)',
    type: 'project',
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
**Payment Method:** Direct transfer or platform wallet as agreed.

## 4. DELIVERABLES AND ACCEPTANCE
The Contractor shall deliver all specified deliverables by the agreed deadlines. The Client shall have {{reviewPeriod}} days to review and provide feedback.

## 5. REVISIONS
The contract includes {{revisionRounds}} rounds of revisions.

## 6. TERMINATION
{{terminationConditions}}
Notice Period: {{noticePeriod}} days`,
    defaultTerms: `1. **Ownership:** Upon full payment, all deliverables and intellectual property transfer to the Client.
2. **Payment:** Payments are processed directly or via wallet upon approval of work. Escrow is NOT required.
3. **Quality Standards:** All work must meet professional industry standards and client specifications.
4. **Revisions:** Included revisions must be requested within 14 days of delivery.
5. **Delays:** If delays occur beyond Contractor's control, timeline may be extended by mutual agreement.
6. **Confidentiality:** Both parties agree to maintain confidentiality of all engagement information.
7. **Dispute Resolution:** Disputes handled through Connekt Platform mediation before arbitration.
8. **Governing Law:** This Contract is governed by the laws of the Republic of The Gambia.
9. **Platform Fees:** Standard Connekt Platform fees apply.
10. **Contract Enforcement:** The Connekt Platform records the agreement but does not hold funds in escrow for this contract type.

Both parties acknowledge they have reviewed and agree to all terms by signing electronically.`,
    variables: [
        { key: 'contractDate', label: 'Contract Date', type: 'date', required: true },
        { key: 'clientName', label: 'Client Name', type: 'text', required: true },
        { key: 'contractorName', label: 'Contractor Name', type: 'text', required: true },
        { key: 'projectTitle', label: 'Engagement Title', type: 'text', required: true },
        { key: 'projectDescription', label: 'Engagement Description', type: 'text', required: true },
        { key: 'deliverables', label: 'Deliverables List', type: 'text', required: true },
        { key: 'startDate', label: 'Start Date', type: 'date', required: true },
        { key: 'endDate', label: 'Completion Deadline', type: 'date', required: true },
        { key: 'duration', label: 'Duration', type: 'number', required: true },
        { key: 'durationUnit', label: 'Duration Unit', type: 'text', required: true },
        { key: 'paymentAmount', label: 'Total Budget', type: 'currency', required: true },
        { key: 'paymentCurrency', label: 'Currency', type: 'text', required: true },
        { key: 'paymentType', label: 'Payment Type', type: 'text', required: true },
        { key: 'paymentMilestones', label: 'Payment Milestones (if applicable)', type: 'text', required: false },
        { key: 'reviewPeriod', label: 'Review Period (days)', type: 'number', required: true },
        { key: 'revisionRounds', label: 'Included Revision Rounds', type: 'number', required: true },
        { key: 'noticePeriod', label: 'Notice Period (days)', type: 'number', required: true },
        { key: 'terminationConditions', label: 'Termination Conditions', type: 'text', required: false }
    ]
};

export const PROJECT_ADMIN_TEMPLATE: Omit<ContractTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
    name: 'Project Admin Contract (Temporary Owner)',
    type: 'project_admin',
    visibility: 'system',
    requiresEscrow: false,
    headerConfig: {
        showConnektLogo: true,
        showCoatOfArms: true,
        showGambianFlag: true
    },
    bodyTemplate: `# Project Administration: {{projectTitle}}

This Agreement appoints {{contractorName}} as the **Project Administrator (Temporary Owner)** for the project "{{projectTitle}}" by {{clientName}}.

## 1. AUTHORITY AND ROLE
The Project Administrator is granted full administrative authority ("admin" role) over the project.
This includes:
- Managing tasks and timelines.
- Sub-contracting work and assigning tasks to other members.
- Setting pricing and budgets for sub-tasks.
- Managing project resources.

## 2. SCOPE AND DELIVERABLES
**Project:** {{projectTitle}}
**Objective:** {{projectDescription}}
**Final Deliverable:** Proof of Project Completion (POP) submitted for Client approval.

## 3. COMPENSATION
**Total Fee:** {{paymentAmount}} {{paymentCurrency}}
**Payment Condition:** Payment is released upon successful submission and approval of the Proof of Project Completion (POP).
**Sub-Contracting Budget:** {{subContractingBudget}} (Managed by Administrator)

## 4. DURATION
**Start Date:** {{startDate}}
**Target Completion:** {{endDate}}

## 5. TERMINATION OF AUTHORITY
Authority is revoked automatically upon contract expiration or termination. The Client retains the right to revoke administrative access at any time for breach of contract.

{{terminationConditions}}`,
    defaultTerms: `1. **Fiduciary Duty:** The Project Administrator agrees to act in the best interest of the Client and project efficiency.
2. **Sub-Contracting:** The Administrator may assign tasks to third parties within the platform but remains liable for the overall project quality.
3. **Proof of Completion (POP):** Payment is strictly contingent upon Verified POP. 
4. **Authority Limits:** Administrator cannot change the Project Ownership permanently or delete the project without Client consent.
5. **Confidentiality:** Strict confidentiality regarding project stats and trade secrets.
6. **Payment:** Compensation is transferred upon final POP approval.
7. **Role Revocation:** The "admin" role is temporary and tied to this contract.

By signing, the Project Administrator accepts these responsibilities and the temporary delegatory authority.`,
    variables: [
        { key: 'contractDate', label: 'Contract Date', type: 'date', required: true },
        { key: 'clientName', label: 'Client Name', type: 'text', required: true },
        { key: 'contractorName', label: 'Contractor Name', type: 'text', required: true },
        { key: 'projectTitle', label: 'Project Title', type: 'text', required: true },
        { key: 'projectDescription', label: 'Project Objectives', type: 'text', required: true },
        { key: 'startDate', label: 'Start Date', type: 'date', required: true },
        { key: 'endDate', label: 'Target Completion Date', type: 'date', required: true },
        { key: 'paymentAmount', label: 'Admin Fee', type: 'currency', required: true },
        { key: 'paymentCurrency', label: 'Currency', type: 'text', required: true },
        { key: 'subContractingBudget', label: 'Sub-Contracting Budget', type: 'currency', required: false },
        { key: 'terminationConditions', label: 'Termination Conditions', type: 'text', required: false }
    ]
};

export const TASK_ADMIN_TEMPLATE: Omit<ContractTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
    name: 'Task Admin Contract (Delegated Authority)',
    type: 'task_admin',
    visibility: 'system',
    requiresEscrow: false,
    headerConfig: {
        showConnektLogo: true,
        showCoatOfArms: false,
        showGambianFlag: false
    },
    bodyTemplate: `# Task Administration: {{taskTitle}}

This Agreement appoints {{contractorName}} as the **Task Administrator** for the task "{{taskTitle}}".

## 1. AUTHORITY
The Task Administrator is granted "admin" level control over this task and its sub-tasks.
Authority includes:
- Breaking down the task into sub-tasks.
- Assigning sub-tasks to other contributors.
- Setting pricing for sub-tasks.
- Submitting final Proof of Completion.

## 2. SCOPE
**Task:** {{taskTitle}}
**Description:** {{taskDescription}}

## 3. COMPENSATION
**Fee:** {{paymentAmount}} {{paymentCurrency}}
**Payment Condition:** Payment released upon approval of final Task Completion (POP).

## 4. TIMELINE
**Deadline:** {{endDate}}`,
    defaultTerms: `1. **Delegation:** Administrator may delegate parts of the task but ensures final quality.
2. **Payment:** Contingent on successful completion and approval.
3. **Liability:** Administrator assumes responsibility for sub-task management.
4. **Revocation:** Admin rights are revocable by the Client at any time.

By signing, the Task Administrator accepts full responsibility for the task execution.`,
    variables: [
        { key: 'contractDate', label: 'Contract Date', type: 'date', required: true },
        { key: 'clientName', label: 'Client Name', type: 'text', required: true },
        { key: 'contractorName', label: 'Contractor Name', type: 'text', required: true },
        { key: 'taskTitle', label: 'Task Title', type: 'text', required: true },
        { key: 'taskDescription', label: 'Task Description', type: 'text', required: true },
        { key: 'endDate', label: 'Deadline', type: 'date', required: true },
        { key: 'paymentAmount', label: 'Fee', type: 'currency', required: true },
        { key: 'paymentCurrency', label: 'Currency', type: 'text', required: true }
    ]
};

/**
 * All system templates
 */
export const SYSTEM_TEMPLATES = [
    JOB_CONTRACT_TEMPLATE,
    FREELANCE_CONTRACT_TEMPLATE,
    PROJECT_ADMIN_TEMPLATE,
    TASK_ADMIN_TEMPLATE
];
