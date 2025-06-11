import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { Toaster } from "react-hot-toast";
import { store } from "./store";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";
import { BoardPage } from "./pages/BoardPage";
import { InvitePage } from "./pages/InvitePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="min-h-screen bg-background">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/invite/:token" element={<InvitePage />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/board/:boardId"
                element={
                  <ProtectedRoute>
                    <BoardPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
            <Toaster
              position="bottom-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: "var(--card)",
                  color: "var(--card-foreground)",
                  border: "1px solid var(--border)",
                },
              }}
            />
          </div>
        </Router>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;
