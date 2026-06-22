import { inngest } from "../client";
import { getInsforgeAdminClient } from "@/lib/insforge-server";
import { syncIdeaNode, syncPostNode, deletePostNode, runCypher } from "@/lib/neo4j";

/**
 * Inngest function to sync an Idea node when created or updated
 */
export const syncIdeaInngest = inngest.createFunction(
  {
    id: "sync-idea-neo4j",
    name: "Sync Idea to Neo4j",
    triggers: {
      event: "idea/sync.requested",
    },
  },
  async ({ event, step }) => {
    const { ideaId } = event.data;

    // Fetch the idea details from Postgres using Admin client
    const idea = await step.run("fetch-idea-details", async () => {
      const insforge = getInsforgeAdminClient();
      const { data, error } = await insforge.database
        .from("ideas")
        .select("*")
        .eq("id", ideaId)
        .single();

      if (error || !data) {
        throw new Error(`Failed to fetch idea ${ideaId}: ${error?.message}`);
      }
      return data;
    });

    // Write to Neo4j
    await step.run("sync-idea-node", async () => {
      await syncIdeaNode({
        id: idea.id,
        title: idea.title,
        description: idea.description,
        userId: idea.user_id,
      });
    });

    return { success: true, ideaId };
  }
);

/**
 * Inngest function to delete an Idea node when deleted
 */
export const deleteIdeaInngest = inngest.createFunction(
  {
    id: "delete-idea-neo4j",
    name: "Delete Idea from Neo4j",
    triggers: {
      event: "idea/delete.requested",
    },
  },
  async ({ event, step }) => {
    const { ideaId } = event.data;

    await step.run("delete-idea-node", async () => {
      const query = `
        MATCH (i:Idea {id: $id})
        DETACH DELETE i
      `;
      await runCypher(query, { id: ideaId });
    });

    return { success: true, ideaId };
  }
);

/**
 * Inngest function to sync a Post node when scheduled or created
 */
export const syncPostInngest = inngest.createFunction(
  {
    id: "sync-post-neo4j",
    name: "Sync Post to Neo4j",
    triggers: {
      event: "post/sync.requested",
    },
  },
  async ({ event, step }) => {
    const { postId, ideaId } = event.data;

    // Fetch the post details from Postgres including user_channels and channel_types
    const postWithChannel = await step.run("fetch-post-details", async () => {
      const insforge = getInsforgeAdminClient();
      const { data, error } = await insforge.database
        .from("scheduled_posts")
        .select("*, user_channels(*, channel_types(*))")
        .eq("id", postId)
        .single();

      if (error || !data) {
        throw new Error(`Failed to fetch post ${postId}: ${error?.message}`);
      }
      return data;
    });

    const userChannel = postWithChannel.user_channels;
    const channelType = userChannel?.channel_types;

    if (!userChannel || !channelType) {
      throw new Error(`Channel details missing for post ${postId}`);
    }

    // Write to Neo4j
    await step.run("sync-post-node", async () => {
      await syncPostNode({
        id: postWithChannel.id,
        content: postWithChannel.content,
        scheduledAt: postWithChannel.scheduled_at,
        status: postWithChannel.status,
        userId: postWithChannel.user_id,
        ideaId: ideaId, // Link to inspiring idea
        channelId: userChannel.id,
        channelName: userChannel.handle || channelType.name || "Channel",
        channelType: channelType.type,
        channelColor: channelType.color,
      });
    });

    return { success: true, postId };
  }
);

/**
 * Inngest function to delete a Post node when deleted
 */
export const deletePostInngest = inngest.createFunction(
  {
    id: "delete-post-neo4j",
    name: "Delete Post from Neo4j",
    triggers: {
      event: "post/delete.requested",
    },
  },
  async ({ event, step }) => {
    const { postId } = event.data;

    await step.run("delete-post-node", async () => {
      await deletePostNode(postId);
    });

    return { success: true, postId };
  }
);
