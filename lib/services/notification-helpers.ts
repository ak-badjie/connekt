import { NotificationService } from './notification-service';

/**
 * Task Notification Helper
 * Centralized notification triggers for task-related events
 */
export const TaskNotificationHelper = {
    /**
     * Notify when task is assigned
     */
    async notifyTaskAssignment(
        assigneeId: string,
        taskId: string,
        taskTitle: string,
        projectId: string,
        assignerId: string,
        assignerUsername: string,
        priority: 'low' | 'medium' | 'high' | 'urgent',
        deadline?: string
    ): Promise<void> {
        try {
            await NotificationService.createNotification(
                assigneeId,
                'task',
                'New Task Assigned',
                `You've been assigned "${taskTitle}" by ${assignerUsername}`,
                priority,
                {
                    type: 'task',
                    taskId,
                    taskTitle,
                    projectId,
                    action: 'assigned',
                    assignerId,
                    assignerUsername,
                    deadline,
                    priority
                },
                `/projects/${projectId}/tasks/${taskId}`,
                'View Task'
            );
        } catch (error) {
            console.error('Error creating task assignment notification:', error);
        }
    },

    /**
     * Notify when task is reassigned
     */
    async notifyTaskReassignment(
        oldAssigneeId: string,
        newAssigneeId: string,
        taskId: string,
        taskTitle: string,
        projectId: string,
        assignerUsername: string
    ): Promise<void> {
        try {
            // Notify old assignee
            await NotificationService.createNotification(
                oldAssigneeId,
                'task',
                'Task Reassigned',
                `"${taskTitle}" has been reassigned to someone else`,
                'low',
                {
                    type: 'task',
                    taskId,
                    taskTitle,
                    projectId,
                    action: 'reassigned',
                    assignerUsername
                },
                `/projects/${projectId}`,
                'View Project'
            );

            // Notify new assignee
            await this.notifyTaskAssignment(
                newAssigneeId,
                taskId,
                taskTitle,
                projectId,
                '',
                assignerUsername,
                'medium'
            );
        } catch (error) {
            console.error('Error creating task reassignment notifications:', error);
        }
    },

    /**
     * Notify supervisors when POT is submitted
     */
    async notifyPotSubmission(
        supervisorIds: string[],
        taskId: string,
        taskTitle: string,
        projectId: string,
        submittedBy: string,
        submittedByUsername: string
    ): Promise<void> {
        try {
            const notifications = supervisorIds.map(supervisorId =>
                NotificationService.createNotification(
                    supervisorId,
                    'pot',
                    'New POT Submitted',
                    `${submittedByUsername} submitted proof for "${taskTitle}"`,
                    'high',
                    {
                        type: 'pot',
                        taskId,
                        taskTitle,
                        projectId,
                        action: 'submitted',
                        submittedBy,
                        submittedByUsername
                    },
                    `/projects/${projectId}/tasks/${taskId}/pot`,
                    'Review POT'
                )
            );

            await Promise.all(notifications);
        } catch (error) {
            console.error('Error creating POT submission notifications:', error);
        }
    },

    /**
     * Notify assignee when POT is validated
     */
    async notifyPotValidation(
        assigneeId: string,
        taskId: string,
        taskTitle: string,
        projectId: string,
        decision: 'approved' | 'rejected' | 'revision_requested',
        validatorUsername: string,
        notes?: string
    ): Promise<void> {
        try {
            const titles = {
                approved: 'POT Approved ✓',
                rejected: 'POT Rejected',
                revision_requested: 'POT Needs Revision'
            };

            const messages = {
                approved: `Your proof for "${taskTitle}" was approved by ${validatorUsername}`,
                rejected: `Your proof for "${taskTitle}" was rejected by ${validatorUsername}`,
                revision_requested: `${validatorUsername} requested revisions for "${taskTitle}"`
            };

            const priorities: Record<typeof decision, 'low' | 'medium' | 'high' | 'urgent'> = {
                approved: 'high',
                rejected: 'high',
                revision_requested: 'medium'
            };

            await NotificationService.createNotification(
                assigneeId,
                'pot',
                titles[decision],
                messages[decision],
                priorities[decision],
                {
                    type: 'pot',
                    taskId,
                    taskTitle,
                    projectId,
                    action: decision,
                    validatedByUsername: validatorUsername,
                    validationNotes: notes
                },
                `/projects/${projectId}/tasks/${taskId}`,
                'View Task'
            );
        } catch (error) {
            console.error('Error creating POT validation notification:', error);
        }
    },

    /**
     * Notify when help is requested
     */
    async notifyHelpRequest(
        recipientIds: string[],
        taskId: string,
        taskTitle: string,
        projectId: string,
        requestedBy: string,
        requestedByUsername: string,
        message: string
    ): Promise<void> {
        try {
            const notifications = recipientIds.map(recipientId =>
                NotificationService.createNotification(
                    recipientId,
                    'task',
                    'Help Requested',
                    `${requestedByUsername} needs help with "${taskTitle}"`,
                    'medium',
                    {
                        type: 'task',
                        taskId,
                        taskTitle,
                        projectId,
                        action: 'help_requested',
                        assignerId: requestedBy,
                        assignerUsername: requestedByUsername
                    },
                    `/projects/${projectId}/tasks/${taskId}`,
                    'View Task'
                )
            );

            await Promise.all(notifications);
        } catch (error) {
            console.error('Error creating help request notifications:', error);
        }
    }
};

/**
 * Project Notification Helper
 */
export const ProjectNotificationHelper = {
    /**
     * Notify when project is reassigned
     */
    async notifyProjectReassignment(
        newOwnerId: string,
        projectId: string,
        projectTitle: string,
        assignerUsername: string
    ): Promise<void> {
        try {
            await NotificationService.createNotification(
                newOwnerId,
                'project',
                'Project Assigned to You',
                `You've been assigned as owner of "${projectTitle}"`,
                'high',
                {
                    type: 'project',
                    projectId,
                    projectTitle,
                    action: 'assigned',
                    assignerUsername
                },
                `/projects/${projectId}`,
                'View Project'
            );
        } catch (error) {
            console.error('Error creating project reassignment notification:', error);
        }
    },

    /**
      * Notify when member is added to project
      */
    async notifyMemberAdded(
        userId: string,
        projectId: string,
        projectTitle: string,
        role: 'supervisor' | 'member',
        addedBy: string
    ): Promise<void> {
        try {
            await NotificationService.createNotification(
                userId,
                'project',
                `Added to Project as ${role === 'supervisor' ? 'Supervisor' : 'Member'}`,
                `You've been added to "${projectTitle}"`,
                'medium',
                {
                    type: 'project',
                    projectId,
                    projectTitle,
                    action: role === 'supervisor' ? 'supervisor_added' : 'member_added',
                    assignerUsername: addedBy
                },
                `/projects/${projectId}`,
                'View Project'
            );
        } catch (error) {
            console.error('Error creating member added notification:', error);
        }
    },

    /**
     * Notify when member is removed from project
     */
    async notifyMemberRemoved(
        userId: string,
        projectId: string,
        projectTitle: string,
        role: 'supervisor' | 'member'
    ): Promise<void> {
        try {
            await NotificationService.createNotification(
                userId,
                'project',
                `Removed from Project`,
                `You've been removed from "${projectTitle}"`,
                'medium',
                {
                    type: 'project',
                    projectId,
                    projectTitle,
                    action: role === 'supervisor' ? 'supervisor_removed' : 'member_removed'
                },
                `/projects`,
                'View Projects'
            );
        } catch (error) {
            console.error('Error creating member removed notification:', error);
        }
    },

    /**
     * Notify about approaching deadline
     */
    async notifyDeadlineReminder(
        userId: string,
        projectId: string,
        projectTitle: string,
        deadline: string,
        daysUntilDeadline: number
    ): Promise<void> {
        try {
            const priority = daysUntilDeadline === 1 ? 'urgent' : daysUntilDeadline <= 3 ? 'high' : 'medium';

            await NotificationService.createNotification(
                userId,
                'project',
                'Project Deadline Approaching',
                `"${projectTitle}" is due in ${daysUntilDeadline} day${daysUntilDeadline > 1 ? 's' : ''}`,
                priority,
                {
                    type: 'project',
                    projectId,
                    projectTitle,
                    action: 'deadline_reminder',
                    deadline,
                    daysUntilDeadline
                },
                `/projects/${projectId}`,
                'View Project'
            );
        } catch (error) {
            console.error('Error creating deadline reminder notification:', error);
        }
    }
};

/**
 * Workspace Notification Helper
 */
export const WorkspaceNotificationHelper = {
    /**
     * Notify when user is added to workspace
     */
    async notifyMemberAdded(
        userId: string,
        workspaceId: string,
        workspaceName: string,
        role: 'owner' | 'admin' | 'member',
        addedBy: string
    ): Promise<void> {
        try {
            await NotificationService.createNotification(
                userId,
                'workspace',
                'Added to Workspace',
                `You've been added to "${workspaceName}" as ${role}`,
                'medium',
                {
                    type: 'workspace',
                    workspaceId,
                    workspaceName,
                    action: 'added',
                    addedByUsername: addedBy,
                    role
                },
                `/dashboard/workspaces/${workspaceId}`,
                'View Workspace'
            );
        } catch (error) {
            console.error('Error creating workspace member added notification:', error);
        }
    },

    /**
     * Notify when user is removed from workspace
     */
    async notifyMemberRemoved(
        userId: string,
        workspaceId: string,
        workspaceName: string
    ): Promise<void> {
        try {
            await NotificationService.createNotification(
                userId,
                'workspace',
                'Removed from Workspace',
                `You've been removed from "${workspaceName}"`,
                'medium',
                {
                    type: 'workspace',
                    workspaceId,
                    workspaceName,
                    action: 'removed'
                },
                `/dashboard/workspaces`,
                'View Workspaces'
            );
        } catch (error) {
            console.error('Error creating workspace member removed notification:', error);
        }
    }
};

/**
 * Agency Notification Helper
 */
export const AgencyNotificationHelper = {
    /**
     * Notify when user is added to agency
     */
    async notifyMemberAdded(
        userId: string,
        agencyId: string,
        agencyName: string,
        agencyEmail: string,
        role: 'admin' | 'member',
        addedBy: string
    ): Promise<void> {
        try {
            await NotificationService.createNotification(
                userId,
                'agency',
                'Added to Agency',
                `You've been added to ${agencyName} as ${role}`,
                'high',
                {
                    type: 'agency',
                    agencyId,
                    agencyName,
                    action: 'member_added',
                    addedByUsername: addedBy,
                    agencyEmail
                },
                `/agency/${agencyId}`,
                'View Agency'
            );
        } catch (error) {
            console.error('Error creating agency member added notification:', error);
        }
    },

    /**
     * Notify when user is removed from agency
     */
    async notifyMemberRemoved(
        userId: string,
        agencyId: string,
        agencyName: string
    ): Promise<void> {
        try {
            await NotificationService.createNotification(
                userId,
                'agency',
                'Removed from Agency',
                `You've been removed from ${agencyName}`,
                'high',
                {
                    type: 'agency',
                    agencyId,
                    agencyName,
                    action: 'member_removed'
                },
                `/agency`,
                'View Agencies'
            );
        } catch (error) {
            console.error('Error creating agency member removed notification:', error);
        }
    },

    /**
     * Send agency-wide announcement
     */
    async sendAnnouncement(
        memberIds: string[],
        agencyId: string,
        agencyName: string,
        title: string,
        content: string
    ): Promise<void> {
        try {
            const notifications = memberIds.map(memberId =>
                NotificationService.createNotification(
                    memberId,
                    'agency',
                    title,
                    content,
                    'medium',
                    {
                        type: 'agency',
                        agencyId,
                        agencyName,
                        action: 'announcement',
                        announcementContent: content
                    },
                    `/agency/${agencyId}`,
                    'View Agency'
                )
            );

            await Promise.all(notifications);
        } catch (error) {
            console.error('Error creating agency announcement notifications:', error);
        }
    }
};

/**
 * Contract Notification Helper
 */
export const ContractNotificationHelper = {
    /**
     * Notify when contract is signed
     */
    async sendContractSignedNotification(
        recipientId: string,
        recipientUsername: string,
        signerId: string,
        signerUsername: string,
        signerFullName: string,
        contractTitle: string,
        contractId: string
    ): Promise<void> {
        try {
            await NotificationService.createNotification(
                recipientId,
                'contract',
                'Contract Signed',
                `${signerFullName} (@${signerUsername}) signed "${contractTitle}"`,
                'high',
                {
                    type: 'contract',
                    contractId,
                    contractTitle,
                    action: 'signed',
                    signerId,
                    signerUsername,
                    signerFullName
                },
                `/mail`, // Link to mail where contract was sent
                'View Mail'
            );
        } catch (error) {
            console.error('Error creating contract signed notification:', error);
        }
    }
};

// Export unified NotificationHelpers
export const NotificationHelpers = {
    sendContractSignedNotification: ContractNotificationHelper.sendContractSignedNotification,
    ...TaskNotificationHelper,
    ...ProjectNotificationHelper,
    ...WorkspaceNotificationHelper,
    ...AgencyNotificationHelper
};

