// LearnLynk Tech Test - Task 3: Edge Function create-task

// Deno + Supabase Edge Functions style
// Docs reference: https://supabase.com/docs/guides/functions

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type CreateTaskPayload = {
  application_id: string;
  task_type: string;
  due_at: string;
};

const VALID_TYPES = ["call", "email", "review"];

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = (await req.json()) as Partial<CreateTaskPayload>;
    const { application_id, task_type, due_at } = body;

    // TODO: validate application_id, task_type, due_at
    // - check task_type in VALID_TYPES
    // - parse due_at and ensure it's in the future

    if (!application_id || typeof application_id !== "string") {
      return new Response(JSON.stringify({ error: "application_id is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!task_type || typeof task_type !== "string" || !VALID_TYPES.includes(task_type)) {
      return new Response(JSON.stringify({ error: "task_type must be call, email, or review" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!due_at || typeof due_at !== "string") {
      return new Response(JSON.stringify({ error: "due_at is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const dueDate = new Date(due_at);
    if (Number.isNaN(dueDate.getTime())) {
      return new Response(JSON.stringify({ error: "due_at must be a valid ISO timestamp" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (dueDate.getTime() <= Date.now()) {
      return new Response(JSON.stringify({ error: "due_at must be in the future" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // TODO: insert into tasks table using supabase client

    const { data: application, error: applicationError } = await supabase
      .from("applications")
      .select("id, tenant_id")
      .eq("id", application_id)
      .single();

    if (applicationError || !application) {
      return new Response(JSON.stringify({ error: "application_id is invalid" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Example:
    // const { data, error } = await supabase
    //   .from("tasks")
    //   .insert({ ... })
    //   .select()
    //   .single();

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        tenant_id: application.tenant_id,
        application_id,
        type: task_type,
        due_at: dueDate.toISOString(),
      })
      .select("id")
      .single();

    // TODO: handle error and return appropriate status code

    if (error || !data) {
      console.error("Failed to insert task", error);
      return new Response(JSON.stringify({ error: "Failed to create task" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Example successful response:
    // return new Response(JSON.stringify({ success: true, task_id: data.id }), {
    //   status: 200,
    //   headers: { "Content-Type": "application/json" },
    // });

    //   return new Response(
    //   JSON.stringify({ error: "Not implemented. Please complete this function." }),
    //   { status: 501, headers: { "Content-Type": "application/json" } },
    // );
    return new Response(JSON.stringify({ success: true, task_id: data.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
