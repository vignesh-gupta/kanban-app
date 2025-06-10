import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../store";
import { LoginForm } from "../components/auth/LoginForm";
import { SignupForm } from "../components/auth/SignupForm";
import { Kanban } from "lucide-react";

export function AuthPage() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [isLogin, setIsLogin] = useState(true);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Kanban className="h-12 w-12 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">KanbanFlow</h1>
          </div>
          <p className="text-muted-foreground">
            Collaborate in real-time with powerful Kanban boards
          </p>
        </div>

        {isLogin ? (
          <LoginForm onToggleMode={() => setIsLogin(false)} />
        ) : (
          <SignupForm onToggleMode={() => setIsLogin(true)} />
        )}
      </div>
    </div>
  );
}
