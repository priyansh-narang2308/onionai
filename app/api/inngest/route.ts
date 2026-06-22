import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { publishScheduledPost, publishScheduledPostsCron } from "@/inngest/functions/publish-scheduled-posts";
import { syncIdeaInngest, deleteIdeaInngest, syncPostInngest, deletePostInngest } from "@/inngest/functions/neo4j-sync";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    publishScheduledPostsCron,
    publishScheduledPost,
    syncIdeaInngest,
    deleteIdeaInngest,
    syncPostInngest,
    deletePostInngest
  ],
});