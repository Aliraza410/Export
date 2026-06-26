import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Button } from "./button";
import { Bell, Home, Search, Settings } from "lucide-react";

export default function CircularNavbar() {
  return (
    // add fixed to the nav class name to make the navbar stick to the bottom of the screen
    <nav className="fixed bottom-0 left-0 right-0 border-t bg-background p-4 backdrop-blur-sm z-50 lg:hidden">
      <div className="container mx-auto flex items-center justify-between">
        <Button size="icon" className="rounded-full" variant="ghost">
          <Home className="h-6 w-6" />
          <span className="sr-only">Home</span>
        </Button>
        <Button size="icon" className="rounded-full" variant="ghost">
          <Search className="h-6 w-6" />
          <span className="sr-only">Search</span>
        </Button>
        <Button
          size="icon"
          className="rounded-full bg-primary text-primary-foreground"
        >
          <Bell className="h-6 w-6" />
          <span className="sr-only">Notifications</span>
        </Button>
        <Button size="icon" className="rounded-full" variant="ghost">
          <Settings className="h-6 w-6" />
          <span className="sr-only">Settings</span>
        </Button>
        <Avatar>
          <AvatarImage src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80" alt="User" />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      </div>
    </nav>
  );
}
