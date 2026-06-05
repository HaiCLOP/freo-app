export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { sendVerificationEmail, resetVerification } from "./actions";

export default async function ProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ verified?: string; error?: string }>;
}) {
  const resolvedParams = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: creator } = await supabase
    .from("creators")
    .select("notification_email, notification_email_verified")
    .eq("id", user.id)
    .single();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Progress
        </h1>
        <p className="text-gray-500">
          Manage your account progress and email preferences.
        </p>
      </div>

      {resolvedParams.verified === "true" && (
        <div className="bg-green-50 text-green-700 p-4 rounded-md border border-green-200">
          Your notification email has been successfully verified!
        </div>
      )}
      {resolvedParams.error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md border border-red-200">
          Verification failed: {resolvedParams.error}. Please try sending the verification email again.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Notification Email</CardTitle>
          <CardDescription>
            Where should we send event updates and registration notifications?
          </CardDescription>
        </CardHeader>
        <CardContent>
          {creator?.notification_email && creator.notification_email_verified ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg border">
                <span className="font-medium text-gray-900">
                  {creator.notification_email}
                </span>
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-transparent pointer-events-none">
                  Verified
                </Badge>
              </div>
              <form action={resetVerification}>
                <SubmitButton variant="outline" pendingText="Changing...">
                  Change Email
                </SubmitButton>
              </form>
            </div>
          ) : (
            <form action={sendVerificationEmail} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="notification_email">Email Address</Label>
                  {creator?.notification_email && !creator.notification_email_verified && (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200 pointer-events-none">
                      Pending verification
                    </Badge>
                  )}
                </div>
                <Input
                  key={creator?.notification_email || "new"}
                  id="notification_email"
                  name="notification_email"
                  type="email"
                  placeholder="notifications@example.com"
                  defaultValue={creator?.notification_email || ""}
                  required
                />
              </div>
              <SubmitButton 
                className="bg-[#1B1C20] hover:bg-black text-[#DDFE55] transition-colors"
                pendingText="Sending..."
              >
                {creator?.notification_email && !creator.notification_email_verified
                  ? "Resend Verification Email"
                  : "Send Verification"}
              </SubmitButton>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
