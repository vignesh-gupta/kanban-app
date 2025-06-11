import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, RotateCcw, Search } from "lucide-react";

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        {/* Animated 404 */}
        <div className="relative mb-8">
          <h1 className="text-9xl font-bold text-slate-200 select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-bounce">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                <Search className="w-8 h-8 text-white animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Fun message */}
        <div className="space-y-4 mb-8">
          <h2 className="text-3xl font-bold text-slate-800">
            Oops! Page Not Found
          </h2>
          <p className="text-lg text-slate-600">
            Looks like this page got lost in the Kanban board! 📋
          </p>
          <p className="text-slate-500">
            The page you're looking for might have been moved, deleted, or you
            might have mistyped the URL.
          </p>
        </div>

        {/* Fun illustration with CSS */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            {/* Kanban board illustration */}
            <div className="flex space-x-2">
              <div className="w-20 h-24 bg-blue-100 rounded-lg border-2 border-blue-200 p-2">
                <div className="w-full h-2 bg-blue-300 rounded mb-1"></div>
                <div className="w-3/4 h-2 bg-blue-200 rounded mb-1"></div>
                <div className="w-1/2 h-2 bg-blue-100 rounded"></div>
              </div>
              <div className="w-20 h-24 bg-yellow-100 rounded-lg border-2 border-yellow-200 p-2">
                <div className="w-full h-2 bg-yellow-300 rounded mb-1"></div>
                <div className="w-2/3 h-2 bg-yellow-200 rounded mb-1"></div>
              </div>
              <div className="w-20 h-24 bg-green-100 rounded-lg border-2 border-green-200 p-2">
                <div className="w-full h-2 bg-green-300 rounded mb-1"></div>
              </div>
            </div>
            {/* Floating question mark */}
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold animate-bounce">
              ?
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-3 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
          <Button
            onClick={() => navigate("/dashboard")}
            className="w-full sm:w-auto"
            size="lg"
          >
            <Home className="w-4 h-4 mr-2" />
            Go to Dashboard
          </Button>
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="w-full sm:w-auto"
            size="lg"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>

        {/* Footer message */}
        <div className="mt-8 text-sm text-slate-400">
          <p>
            Lost? Try checking your board invitations or create a new board to
            get started!
          </p>
        </div>
      </div>
    </div>
  );
}
