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
    name: 'Project Admin Contract (Temporal Owner)',
    type: 'project_admin',
    visibility: 'system',
    requiresEscrow: false,
    headerConfig: {
        showConnektLogo: true,
        showCoatOfArms: true,
        showGambianFlag: true
    },
    bodyTemplate: `# Project Administration: {{projectTitle}}

This Agreement appoints {{contractorName}} as the **Project Administrator (Temporal Owner)** for the project "{{projectTitle}}".

## 1. AUTHORITY: TEMPORAL OWNER
The Administrator is granted **Totalitarian Access** to the project for the duration of this contract.
Rights include:
- **Task Assignment:** Sole authority to assign tasks to any workspace member.
- **Resource Management:** Full control over project budget and resources.
- **Renaming & Structuring:** Authority to rename the project and restructure tasks.
- **Sub-Contracting:** Power to sub-contract parts of the project.

## 2. SCOPE AND DELIVERABLES
**Project:** {{projectTitle}}
**Objective:** {{projectDescription}}
**Final Deliverable:** Verified **Proof of Project Completion (POP)**.

## 3. COMPENSATION
**Fee:** {{paymentAmount}} {{paymentCurrency}}
**Payment Condition:** Payment is released STRICTLY upon submission and Client approval of the **Proof of Project Completion (POP)**.
**Sub-Contracting Budget:** {{subContractingBudget}} (Managed by Administrator)

## 4. DURATION
**Start Date:** {{startDate}}
**Target Completion:** {{endDate}}

## 5. TERMINATION & REVOCATION
This "Temporal Ownership" is conditional. The Client retains the ultimate right to revoke access at any time if terms are breached or deadlines are missed.

{{terminationConditions}}`,
    defaultTerms: `1. **Temporal Ownership:** Administrator acts as the owner but acknowledges this status is temporary and revocable.
2. **Proof of Project Completion (POP):** Payment is triggered only by a verified POP.
3. **Liability:** Administrator assumes responsibility for the quality of all assigned sub-tasks.
4. **Authority:** Administrator has full rights to manage, rename, and assign within the project scope.
5. **Confidentiality:** Strict confidentiality regarding all project data.
6. **Revocation:** Client may revoke "Temporal Owner" status immediately for cause.
7. **Governing Law:** Governed by the laws of The Gambia.

By signing, the Project Administrator accepts these responsibilities and the conditional authority.`,
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
    name: 'Task Admin Contract (Task Ownership)',
    type: 'task_admin',
    visibility: 'system',
    requiresEscrow: false,
    headerConfig: {
        showConnektLogo: true,
        showCoatOfArms: false,
        showGambianFlag: false
    },
    bodyTemplate: `# Task Administration: {{taskTitle}}

This Agreement appoints {{contractorName}} as the **Task Administrator** for "{{taskTitle}}".

## 1. AUTHORITY: TOTALITARIAN ACCESS
The Task Administrator is granted **Totalitarian Access** to this specific task.
Rights include:
- **Sub-Tasking:** Authority to break down and create sub-tasks.
- **Assignment:** Power to assign sub-tasks to other contributors.
- **Budgeting:** Control over the task's allocated budget.

## 2. SCOPE
**Task:** {{taskTitle}}
**Description:** {{taskDescription}}
**Final Deliverable:** Verified **Proof of Task Completion (POT)**.

## 3. COMPENSATION
**Fee:** {{paymentAmount}} {{paymentCurrency}}
**Payment Condition:** Payment is released STRICTLY upon submission and approval of the **Proof of Task Completion (POT)**.

## 4. TIMELINE
**Deadline:** {{endDate}}`,
    defaultTerms: `1. **Task Ownership:** Administrator has full control over the execution of this task.
2. **Proof of Task Completion (POT):** Payment requires a verified POT.
3. **Sub-Contracting:** Administrator may delegate work but remains the primary responsible party.
4. **Revocation:** Client may revoke administration rights at any time.
5. **Standard Terms:** All standard platform terms apply.

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
