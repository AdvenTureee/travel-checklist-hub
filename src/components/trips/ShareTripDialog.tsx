import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ShareTripDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string | null;
}

export const ShareTripDialog: React.FC<ShareTripDialogProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <div className="text-center p-4">
          <h2 className="text-lg font-bold mb-2">Compartilhamento de viagens</h2>
          <p className="text-gray-600">Esta funcionalidade está temporariamente desativada.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
