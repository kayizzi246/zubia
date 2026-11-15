"use client";

import { Loader2, LogIn } from "lucide-react";
import { useActionState } from "react";
import { signIn } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-2xl font-bold">Admin sign in</CardTitle>
        <CardDescription>Manage listings, agents and admins.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required className="h-11" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="h-11"
            />
          </div>
          {state && !state.ok && (
            <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.message}
            </p>
          )}
          <Button type="submit" disabled={pending} className="h-11 w-full text-base">
            {pending ? <Loader2 className="animate-spin" /> : <LogIn />}
            Sign in
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
