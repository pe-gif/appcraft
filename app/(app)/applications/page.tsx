"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ApplicationListItem } from "@/lib/types";

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/applications");
      if (!response.ok) {
        setError("Sign in to view applications.");
        setLoading(false);
        return;
      }
      const body = await response.json();
      setApplications(body.applications ?? []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
          <p className="text-muted-foreground">Review every application kit you have generated.</p>
        </div>
        <Button asChild>
          <Link href="/applications/new">
            <Plus className="mr-2 h-4 w-4" />
            New application
          </Link>
        </Button>
      </div>
      {loading ? <p className="text-muted-foreground">Loading...</p> : null}
      {error ? <p className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">{error}</p> : null}
      <div className="grid gap-4">
        {applications.map((application) => (
          <Card key={application.id}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-xl">
                  {application.job_title ?? "Untitled role"}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {application.company_name ?? "Unknown company"} ·{" "}
                  {new Date(application.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{application.status ?? "draft"}</Badge>
                <Badge variant={application.generation_status === "complete" ? "default" : "outline"}>
                  {application.generation_status ?? "pending"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href={`/applications/${application.id}`}>Open kit</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
        {!loading && !applications.length && !error ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No application kits yet.</p>
              <Button asChild className="mt-4">
                <Link href="/applications/new">Generate your first kit</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
