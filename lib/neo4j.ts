/* eslint-disable @typescript-eslint/no-explicit-any */
import neo4j, { Driver } from "neo4j-driver";

let driver: Driver | null = null;

export function getNeo4jDriver(): Driver | null {
  const uri = process.env.NEO4J_URI;
  const username = process.env.NEO4J_USERNAME || "neo4j";
  const password = process.env.NEO4J_PASSWORD;

  if (!uri || !password) {
    // Graceful warning, driver is not configured
    return null;
  }

  if (!driver) {
    try {
      driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
    } catch (err) {
      console.error("Failed to initialize Neo4j driver:", err);
      return null;
    }
  }

  return driver;
}

export async function runCypher(
  query: string,
  params: Record<string, any> = {},
) {
  const drv = getNeo4jDriver();
  if (!drv) {
    return null;
  }

  const session = drv.session();
  try {
    const result = await session.run(query, params);
    return result;
  } catch (err) {
    console.error("Error executing Cypher query:", err);
    throw err;
  } finally {
    await session.close();
  }
}

/**
 * Syncs an Idea node into Neo4j
 */
export async function syncIdeaNode(idea: {
  id: string;
  title: string;
  description?: string | null;
  userId: string;
}) {
  const query = `
    MERGE (i:Idea {id: $id})
    SET i.title = $title,
        i.description = $description,
        i.userId = $userId,
        i.updatedAt = datetime()
    RETURN i
  `;
  try {
    await runCypher(query, {
      id: idea.id,
      title: idea.title,
      description: idea.description || "",
      userId: idea.userId,
    });
  } catch (err) {
    console.warn("Neo4j syncIdeaNode failed, proceeding silently:", err);
  }
}

/**
 * Syncs a Post node into Neo4j, establishes relationships to Channel/Platform, and links to Idea if inspired
 */
export async function syncPostNode(post: {
  id: string;
  content: string;
  scheduledAt: string;
  status: string;
  userId: string;
  ideaId?: string | null;
  channelId: string;
  channelName: string;
  channelType: string;
  channelColor: string;
}) {
  const query = `
    // 1. Merge the Post node
    MERGE (p:Post {id: $id})
    SET p.content = $content,
        p.scheduledAt = $scheduledAt,
        p.status = $status,
        p.userId = $userId,
        p.updatedAt = datetime()

    // 2. Merge the Channel node
    MERGE (c:Channel {id: $channelId})
    SET c.name = $channelName,
        c.type = $channelType,
        c.color = $channelColor,
        c.userId = $userId

    // 3. Merge the PlatformType node
    MERGE (pt:PlatformType {type: $channelType})

    // 4. Create relationships
    MERGE (p)-[:PUBLISHED_TO]->(c)
    MERGE (c)-[:BELONGS_TO]->(pt)
  `;

  try {
    await runCypher(query, {
      id: post.id,
      content: post.content,
      scheduledAt: post.scheduledAt,
      status: post.status,
      userId: post.userId,
      channelId: post.channelId,
      channelName: post.channelName,
      channelType: post.channelType,
      channelColor: post.channelColor,
    });

    // 5. Link Idea relationship if ideaId is provided
    if (post.ideaId) {
      const linkQuery = `
        MATCH (i:Idea {id: $ideaId})
        MATCH (p:Post {id: $postId})
        MERGE (i)-[:INSPIRED]->(p)
      `;
      await runCypher(linkQuery, {
        ideaId: post.ideaId,
        postId: post.id,
      });
    }
  } catch (err) {
    console.warn("Neo4j syncPostNode failed, proceeding silently:", err);
  }
}

/**
 * Deletes a Post node and its relations from Neo4j
 */
export async function deletePostNode(postId: string) {
  const query = `
    MATCH (p:Post {id: $id})
    DETACH DELETE p
  `;
  try {
    await runCypher(query, { id: postId });
  } catch (err) {
    console.warn("Neo4j deletePostNode failed, proceeding silently:", err);
  }
}

export type GraphNode = {
  id: string;
  label: string;
  type: "Idea" | "Post" | "Channel" | "PlatformType";
  color?: string;
  status?: string;
  content?: string;
};

export type GraphLink = {
  source: string;
  target: string;
  label: string;
};

/**
 * Returns complete graph structure for visual rendering, falling back to database query if Neo4j is offline
 */
export async function getGraphData(
  userId: string,
  insforgeClient?: any,
): Promise<{ nodes: GraphNode[]; links: GraphLink[] }> {
  const drv = getNeo4jDriver();
  if (drv) {
    try {
      const cypher = `
        MATCH (n)
        WHERE (n:Idea AND n.userId = $userId) 
           OR (n:Post AND n.userId = $userId) 
           OR (n:Channel AND n.userId = $userId)
           OR (n:PlatformType)
        OPTIONAL MATCH (n)-[r]->(m)
        WHERE (m:Idea AND m.userId = $userId) 
           OR (m:Post AND m.userId = $userId) 
           OR (m:Channel AND m.userId = $userId)
           OR (m:PlatformType)
        RETURN n, r, m
      `;
      const result = await runCypher(cypher, { userId });
      if (result && result.records.length > 0) {
        const nodesMap = new Map<string, GraphNode>();
        const links: GraphLink[] = [];

        result.records.forEach((record) => {
          const nNode = record.get("n");
          const rRel = record.get("r");
          const mNode = record.get("m");

          if (nNode) {
            const properties = nNode.properties;
            const labels = nNode.labels as string[];
            const type = labels[0] as GraphNode["type"];
            const id = properties.id || properties.type; // PlatformType uses type as ID
            if (id) {
              nodesMap.set(id, {
                id,
                label:
                  properties.title ||
                  properties.name ||
                  properties.type ||
                  (properties.content
                    ? properties.content.substring(0, 20) + "..."
                    : "Post"),
                type,
                color: properties.color,
                status: properties.status,
                content: properties.content || properties.description,
              });
            }
          }

          if (mNode) {
            const properties = mNode.properties;
            const labels = mNode.labels as string[];
            const type = labels[0] as GraphNode["type"];
            const id = properties.id || properties.type;
            if (id) {
              nodesMap.set(id, {
                id,
                label:
                  properties.title ||
                  properties.name ||
                  properties.type ||
                  (properties.content
                    ? properties.content.substring(0, 20) + "..."
                    : "Post"),
                type,
                color: properties.color,
                status: properties.status,
                content: properties.content || properties.description,
              });
            }
          }

          if (rRel && nNode && mNode) {
            const nId = nNode.properties.id || nNode.properties.type;
            const mId = mNode.properties.id || mNode.properties.type;
            links.push({
              source: nId,
              target: mId,
              label: rRel.type,
            });
          }
        });

        return {
          nodes: Array.from(nodesMap.values()),
          links,
        };
      }
    } catch (err) {
      console.warn(
        "Neo4j getGraphData failed, falling back to simulated relational graph:",
        err,
      );
    }
  }

  // FALLBACK: Query InsForge relational tables directly and reconstruct nodes and links
  if (!insforgeClient) {
    return { nodes: [], links: [] };
  }

  try {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    // 1. Fetch ideas
    const { data: ideas } = await insforgeClient.database
      .from("ideas")
      .select("id, title, description")
      .eq("user_id", userId);

    (ideas || []).forEach((idea: any) => {
      nodes.push({
        id: idea.id,
        label: idea.title,
        type: "Idea",
        content: idea.description,
      });
    });

    // 2. Fetch user channels & channel types
    const { data: userChannels } = await insforgeClient.database
      .from("user_channels")
      .select("id, handle, channel_types(id, type, name, color)")
      .eq("user_id", userId)
      .eq("is_connected", true);

    const platformTypes = new Set<string>();

    (userChannels || []).forEach((uc: any) => {
      const channelType = uc.channel_types;
      nodes.push({
        id: uc.id,
        label: uc.handle || channelType?.name || "Social Channel",
        type: "Channel",
        color: channelType?.color || "#71717a",
      });

      if (channelType?.type) {
        platformTypes.add(channelType.type);
        links.push({
          source: uc.id,
          target: channelType.type,
          label: "BELONGS_TO",
        });
      }
    });

    platformTypes.forEach((pt) => {
      nodes.push({
        id: pt,
        label: pt,
        type: "PlatformType",
      });
    });

    // 3. Fetch scheduled posts
    const { data: posts } = await insforgeClient.database
      .from("scheduled_posts")
      .select("id, content, scheduled_at, status, user_channel_id")
      .eq("user_id", userId);

    (posts || []).forEach((post: any) => {
      const truncatedLabel =
        post.content.length > 25
          ? post.content.substring(0, 22) + "..."
          : post.content;
      nodes.push({
        id: post.id,
        label: truncatedLabel || "Scheduled Post",
        type: "Post",
        status: post.status,
        content: post.content,
      });

      // Link to channel
      if (post.user_channel_id) {
        links.push({
          source: post.id,
          target: post.user_channel_id,
          label: "PUBLISHED_TO",
        });
      }
    });

    return { nodes, links };
  } catch (error) {
    console.error("Fallback graph retrieval failed:", error);
    return { nodes: [], links: [] };
  }
}
