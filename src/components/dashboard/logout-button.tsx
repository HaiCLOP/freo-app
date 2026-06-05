"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";

export function LogoutButton({ signOutAction, isMobile = false }: { signOutAction: () => Promise<void>, isMobile?: boolean }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    await signOutAction();
  };

  const triggerButton = isMobile ? (
    <Button variant="ghost" size="icon" className="text-[#8E8F94] hover:text-white">
      <LogOut className="w-5 h-5" />
    </Button>
  ) : (
    <Button variant="ghost" size="icon" className="h-8 w-8 text-[#8E8F94] hover:text-white hover:bg-[#3A3B41] rounded-full">
      <LogOut className="w-4 h-4" />
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={triggerButton} />
      <DialogContent className="sm:max-w-[425px] bg-[#1B1C20] border-[#3A3B41] text-white rounded-2xl shadow-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold font-[family-name:var(--font-fredoka)] mb-2">Log Out</DialogTitle>
          <DialogDescription className="text-gray-400 text-base leading-relaxed">
            Are you sure you want to log out of your Freo account? You will need to sign in again to manage your events.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-2">
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)} 
            disabled={loading} 
            className="flex-1 py-5 border-[#3A3B41] bg-transparent text-gray-300 hover:text-white hover:bg-[#2A2B31] rounded-xl font-medium"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleLogout} 
            disabled={loading} 
            className="flex-1 py-5 bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-500/30 hover:border-red-500/50 shadow-none hover:shadow-red-500/10 transition-all rounded-xl font-semibold"
          >
            {loading ? "Logging out..." : "Log Out"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
