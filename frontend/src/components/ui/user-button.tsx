import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Settings } from "lucide-react";
import { logout } from "@/store/slices/authSlice";
import { getInitials } from "@/lib/utils";
import { socketService } from "@/services/socket";
import type { RootState } from "@/store";

interface UserButtonProps {
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  align?: "start" | "center" | "end";
}

export function UserButton({ 
  showLabel = false, 
  size = "md",
  align = "end" 
}: UserButtonProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    socketService.disconnect();
    dispatch(logout());
    navigate("/auth");
  };

  if (!user) {
    return null;
  }

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12"
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center space-x-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200 hover:opacity-80">
          <Avatar className={sizeClasses[size]}>
            <AvatarImage 
              src={user.avatar} 
              alt={user.name}
              className="object-cover"
            />
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          {showLabel && (
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          )}
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align={align} className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => navigate("/profile")}
          className="cursor-pointer"
        >
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => navigate("/settings")}
          className="cursor-pointer"
        >
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={handleLogout}
          className="cursor-pointer text-red-600 focus:text-red-600"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
