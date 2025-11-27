'use client';

import MailPage from '@/app/mail/page';

// Reusing the MailPage logic for now, but wrapped for Admin route
// In the future, this could have extra admin features (like viewing all system mails)
export default function AdminMailPage() {
    return <MailPage />;
}
