import type { Metadata } from 'next'

import FeedbackView from '@/views/student/FeedbackView'

export const metadata: Metadata = {
  title: 'Feedback',
  description: 'Share feedback about your stay'
}

const StudentFeedbackPage = () => <FeedbackView />

export default StudentFeedbackPage
