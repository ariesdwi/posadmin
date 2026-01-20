"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import api from "@/lib/api";

type VerificationStatus = "loading" | "success" | "error";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<VerificationStatus>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link. No token provided.");
      return;
    }

    verifyEmail(token);
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    try {
      const response = await api.get(`/auth/verify?token=${token}`);

      if (response.status === 200) {
        setStatus("success");
        setMessage("Email verified successfully! Redirecting to login...");

        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      }
    } catch (error: any) {
      setStatus("error");
      setMessage(
        error.response?.data?.message || 
        "Verification failed. The link may be invalid or expired."
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            {status === "loading" && (
              <div className="p-6 rounded-full bg-primary/10">
                <Loader2 className="w-16 h-16 text-primary animate-spin" />
              </div>
            )}

            {status === "success" && (
              <div className="p-6 rounded-full bg-green-100 dark:bg-green-900/30 animate-in zoom-in duration-500">
                <CheckCircle2 className="w-16 h-16 text-green-600 dark:text-green-400" />
              </div>
            )}

            {status === "error" && (
              <div className="p-6 rounded-full bg-red-100 dark:bg-red-900/30 animate-in zoom-in duration-500">
                <XCircle className="w-16 h-16 text-red-600 dark:text-red-400" />
              </div>
            )}
          </div>

          <CardTitle className="text-2xl">
            {status === "loading" && "Verifying Your Email"}
            {status === "success" && "Success!"}
            {status === "error" && "Verification Failed"}
          </CardTitle>

          <CardDescription className="text-base mt-2">
            {status === "loading" && "Please wait while we verify your email address..."}
            {message}
          </CardDescription>
        </CardHeader>

        {status === "error" && (
          <CardContent className="text-center pb-6">
            <Button
              onClick={() => router.push("/login")}
              className="w-full"
            >
              Go to Login
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="p-6 rounded-full bg-primary/10">
                <Loader2 className="w-16 h-16 text-primary animate-spin" />
              </div>
            </div>
            <CardTitle className="text-2xl">Verifying Your Email</CardTitle>
            <CardDescription className="text-base mt-2">
              Please wait while we verify your email address...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
