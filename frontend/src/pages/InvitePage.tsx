import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Check, 
  X, 
  Mail, 
  Calendar, 
  User, 
  ExternalLink,
  Loader2 
} from "lucide-react";
import toast from "react-hot-toast";
import type { RootState } from "@/store";
import api from "@/services/api";

interface InvitationData {
  _id: string;
  boardId: {
    _id: string;
    title: string;
    description?: string;
    color: string;
    owner: {
      name: string;
      email: string;
    };
  };
  email: string;
  role: string;
  invitedBy: {
    name: string;
    email: string;
  };
  createdAt: string;
  status: string;
}

export function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch invitation details
  useEffect(() => {
    const fetchInvitation = async () => {
      if (!token) {
        setError("Invalid invitation link");
        setLoading(false);
        return;
      }

      try {
        // For now, we'll need to get invitation details from the backend
        // Since the existing endpoints require authentication, we'll handle this differently
        const response = await api.get(`/boards/invitation/${token}/details`);
        setInvitation(response.data);
      } catch (err: any) {
        console.error("Error fetching invitation:", err);
        setError(err.response?.data?.message || "Failed to load invitation");
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [token]);

  // Accept invitation mutation
  const acceptMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/boards/invitation/${token}/accept`);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Invitation accepted! Redirecting to board...");
      // Navigate to the board after a short delay
      setTimeout(() => {
        if (invitation?.boardId?._id) {
          navigate(`/board/${invitation.boardId._id}`);
        } else {
          navigate("/dashboard");
        }
      }, 1500);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to accept invitation");
    },
  });

  // Reject invitation mutation
  const rejectMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/boards/invitation/${token}/reject`);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Invitation rejected");
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to reject invitation");
    },
  });

  console.log({
    user,
    isAuthenticated,
  });
  

  // Redirect to auth if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Board Invitation</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              You need to be logged in to accept board invitations.
            </p>
            <div className="space-y-2">
              <Button 
                onClick={() => navigate("/auth")} 
                className="w-full"
              >
                Sign In to Continue
              </Button>
              <Button 
                onClick={() => navigate("/dashboard")} 
                variant="outline" 
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-red-700">Invalid Invitation</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              {error || "This invitation link is invalid or has expired."}
            </p>
            <Button 
              onClick={() => navigate("/dashboard")} 
              variant="outline" 
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show success state after accepting
  if (acceptMutation.isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-700">Welcome Aboard!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              You've successfully joined <strong>{invitation.boardId.title}</strong>!
            </p>
            <p className="text-sm text-gray-500">
              Redirecting you to the board...
            </p>
            <Button 
              onClick={() => navigate(`/board/${invitation.boardId._id}`)}
              className="w-full"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Go to Board
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show success state after rejecting
  if (rejectMutation.isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-gray-600" />
            </div>
            <CardTitle className="text-2xl text-gray-700">Invitation Declined</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              You've declined the invitation to join <strong>{invitation.boardId.title}</strong>.
            </p>
            <Button 
              onClick={() => navigate("/dashboard")}
              variant="outline" 
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Board Invitation</CardTitle>
          <p className="text-gray-600">
            You've been invited to collaborate on a board!
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Board Info */}
          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-start space-x-3">
              <div 
                className="w-4 h-4 rounded flex-shrink-0 mt-1"
                style={{ backgroundColor: invitation.boardId.color }}
              ></div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{invitation.boardId.title}</h3>
                {invitation.boardId.description && (
                  <p className="text-gray-600 text-sm mt-1">
                    {invitation.boardId.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Invitation Details */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-sm">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Invited by:</span>
              <span className="font-medium">{invitation.invitedBy.name}</span>
            </div>
            
            <div className="flex items-center space-x-3 text-sm">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Your email:</span>
              <span className="font-medium">{invitation.email}</span>
            </div>
            
            <div className="flex items-center space-x-3 text-sm">
              <Badge variant="secondary" className="capitalize">
                {invitation.role}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-3 text-sm">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Invited:</span>
              <span className="font-medium">
                {new Date(invitation.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Current user check */}
          {user?.email !== invitation.email && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-yellow-700 text-sm">
                ⚠️ This invitation was sent to <strong>{invitation.email}</strong>, 
                but you're signed in as <strong>{user?.email}</strong>.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              onClick={() => acceptMutation.mutate()}
              disabled={acceptMutation.isPending || rejectMutation.isPending || user?.email !== invitation.email}
              className="flex-1"
              size="lg"
            >
              {acceptMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Accept Invitation
            </Button>
            
            <Button
              onClick={() => rejectMutation.mutate()}
              disabled={acceptMutation.isPending || rejectMutation.isPending || user?.email !== invitation.email}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              {rejectMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <X className="w-4 h-4 mr-2" />
              )}
              Decline
            </Button>
          </div>

          {/* Help text */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Not interested? You can always change your mind later.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
