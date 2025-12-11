
export const CONTRACT_TYPES = {
    // Employment / Jobs
    JOB: 'job',
    JOB_SHORT_TERM: 'job_short_term',
    JOB_LONG_TERM: 'job_long_term',
    JOB_PROJECT_BASED: 'job_project_based',

    // Freelance / Projects
    PROJECT: 'project',
    TASK: 'task',
    FREELANCE: 'freelance',

    // Admin / Temporal Ownership
    PROJECT_ADMIN: 'project_admin',
    TASK_ADMIN: 'task_admin',

    // Invitations & Requests
    TASK_ASSIGNMENT: 'task_assignment',
    PROJECT_ASSIGNMENT: 'project_assignment',
    WORKSPACE_INVITE: 'workspace_invite',
    AGENCY_INVITE: 'agency_invite',
    PAYMENT_REQUEST: 'payment_request',

    // Proposals / General
    GENERAL: 'general',
    PROPOSAL: 'proposal',
} as const;

export const TEMPLATE_IDS = {
    EMPLOYMENT_CONTRACT: 'Employment Contract',
    FREELANCE_CONTRACT: 'Freelance Contract',
    PROJECT_ADMIN: 'Project Admin Contract',
    TASK_ADMIN: 'Task Admin Contract',

    // Proposals
    JOB_PROPOSAL: 'job_proposal',
    PROJECT_PROPOSAL: 'project_proposal',
    TASK_PROPOSAL: 'task_proposal',
} as const;

export const TEMPLATE_NAMES = {
    EMPLOYMENT_CONTRACT: 'Employment Contract',
    FREELANCE_CONTRACT: 'Freelance Contract (Workspace, Project or Task)',
    PROJECT_ADMIN: 'Project Admin Contract (Temporal Owner)',
    TASK_ADMIN: 'Task Admin Contract (Task Ownership)',

    // Proposals
    JOB_PROPOSAL: 'Job Proposal (Employment)',
    PROJECT_PROPOSAL: 'Project Proposal (Freelance)',
    TASK_PROPOSAL: 'Task Bid',
} as const;
