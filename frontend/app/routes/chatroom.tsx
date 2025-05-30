import { ProtectedRoute } from '~/components/ProtectedRoute';
import { Navbar } from '~/components/Navbar';
import { ChatRoom } from '~/components/ChatRoom';

function ChatroomContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <ChatRoom />
    </div>
  );
}

export default function ChatroomPage() {
  return (
    <ProtectedRoute>
      <ChatroomContent />
    </ProtectedRoute>
  );
} 