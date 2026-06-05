"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { ComponentProps } from "react";

interface SubmitButtonProps extends ComponentProps<typeof Button> {
  pendingText?: string;
}

export function SubmitButton({ 
  children, 
  pendingText, 
  ...props 
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending || props.disabled} {...props}>
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {pendingText || children}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
