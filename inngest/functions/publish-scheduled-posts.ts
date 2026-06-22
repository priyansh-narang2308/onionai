import { getInsforgeAdminClient } from "@/lib/insforge-server";
import { inngest } from "../client";
import { ImageObject, PostType } from "@/types/post.type";
import { decrypt, encrypt } from "@/lib/encryption";
import { refreshOauthToken } from "@/lib/social-oauth";
import { ChannelTypeEnum } from "@/constants/channels";

type DuePost = {
  id: string;
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

export const publishScheduledPostsCron = inngest.createFunction(
  {
    id: "publish-scheduled-posts-cron",
    name: "Publish Scheduled Posts",
    triggers: [
      {
        cron: "*/10 * * * *",
      },
    ],
  },
  async ({ step, logger }) => {
    const duePosts = await step.run("load-due-scheduled-posts", async () => {
      const insforge = getInsforgeAdminClient();
      const now = new Date().toISOString();
      const { data, error } = await insforge.database
        .from("scheduled_posts")
        .select("id, status, scheduled_at")
        .eq("status", "queue")
        .lte("scheduled_at", now)
        .order("scheduled_at", { ascending: true });

      logger.info("Load due scheduled posts", { count: data?.length });

      if (error) {
        logger.error(error);
        throw error;
      }
      return (data ?? []) as DuePost[];
    });

    if (duePosts.length === 0) {
      return { queued: 0 };
    }
    logger.info("Send out the post for publish", { count: duePosts.length });

    await step.sendEvent(
      "send-out-post-for-publish",
      duePosts.map((post) => ({
        name: "post/publish.requested",
        data: {
          postId: post.id,
        },
      })),
    );

    return {
      message: "sent out posts for publishing",
      queued: duePosts.length,
    };
  },
);

export const publishScheduledPost = inngest.createFunction(
  {
    id: "publish-scheduled-post",
    name: "Publish Scheduled Post",
    triggers: {
      event: "post/publish.requested",
    },
  },
  async ({ event, step, logger }) => {
    const post = await step.run("load-post", async () => {
      const insforge = getInsforgeAdminClient();
      const { data, error } = await insforge.database
        .from("scheduled_posts")
        .select("*, user_channels(*, channel_types(id, type, name))")
        .eq("id", event.data.postId)
        .eq("status", "queue")
        .single();

      logger.info("Load post", { data });
      if (error) {
        logger.error(error);
        throw error;
      }

      return data as PostType;
    });

    if (!post) {
      logger.error("Post not found", { postId: event.data.postId });
      return { skipped: true, reason: "post_not_found" };
    }

    const userChannel = post.user_channels;
    if (!userChannel)
      return { skipped: true, reason: "user_channel_not_found" };

    const channelType = userChannel.channel_types;
    if (!channelType)
      return { skipped: true, reason: "channel_type_not_found" };

    const providerType = post.user_channels?.channel_types?.type;
    const accessToken = decrypt(post.user_channels?.access_token);
    const refreshToken = decrypt(post.user_channels?.refresh_token);
    const tokenExpiresAt = post.user_channels?.token_expires_at
      ? new Date(post.user_channels.token_expires_at).getTime()
      : null;
    const callbackUrl = `${APP_URL}/api/channel/callback`;
    const shouldRefreshBeforePublish =
      Boolean(refreshToken) &&
      tokenExpiresAt !== null &&
      tokenExpiresAt <= Date.now();

    if (!providerType || !accessToken) {
      logger.error("Missing provider type or access token", {
        providerType,
        accessToken,
      });
      return { skipped: true, reason: "missing_provider_or_token" };
    }

    let currentAccessToken = accessToken;

    if (shouldRefreshBeforePublish && refreshToken) {
      const result = await step.run("refresh-token", async () => {
        const data = await refreshOauthToken(
          providerType as ChannelTypeEnum,
          refreshToken,
          callbackUrl,
        );
        await saveRefreshedToken(
          post.user_channels?.id,
          data.accessToken,
          data.refreshToken ?? refreshToken,
          data.expiresAt,
        );
        return data;
      });
      currentAccessToken = result.accessToken;
    }

    let publishedUrl: string | null = null;

    try {
      publishedUrl = await step.run("publish-to-ptrovider", async () => {
        if (providerType === ChannelTypeEnum.TWITTER) {
          return publishToTwitter({
            accessToken: currentAccessToken,
            content: post.content,
            handle: post.user_channels?.handle,
            images: post.images,
            logger,
          });
        }
        if (providerType === ChannelTypeEnum.LINKEDIN) {
          return publishToLinkedIn({
            accessToken: currentAccessToken,
            text: post.content,
            authorId: post.user_channels?.provider_account_id,
            images: post.images,
            logger,
          });
        }
        if (providerType === ChannelTypeEnum.INSTAGRAM) {
          return publishToInstagram({
            accessToken: currentAccessToken,
            content: post.content,
            handle: post.user_channels?.handle,
            images: post.images,
            userId: post.user_channels?.provider_account_id,
            logger,
          });
        }
        if (providerType === ChannelTypeEnum.FACEBOOK) {
          return publishToFacebook({
            accessToken: currentAccessToken,
            content: post.content,
            images: post.images,
            pageId: post.user_channels?.provider_account_id,
            logger,
          });
        }
        if (providerType === ChannelTypeEnum.THREADS) {
          return publishToThreads({
            accessToken: currentAccessToken,
            content: post.content,
            images: post.images,
            userId: post.user_channels?.provider_account_id,
            logger,
          });
        }
        if (providerType === ChannelTypeEnum.BLUESKY) {
          return publishToBluesky({
            accessToken: currentAccessToken,
            content: post.content,
            images: post.images,
            handle: post.user_channels?.handle,
            logger,
          });
        }
        if (providerType === ChannelTypeEnum.YOUTUBE) {
          return publishToYouTube({
            accessToken: currentAccessToken,
            content: post.content,
            images: post.images,
            channelId: post.user_channels?.provider_account_id,
            logger,
          });
        }
        if (providerType === ChannelTypeEnum.TIKTOK) {
          return publishToTikTok({
            accessToken: currentAccessToken,
            content: post.content,
            images: post.images,
            handle: post.user_channels?.handle,
            logger,
          });
        }

        throw new Error(`Unsupported provider type: ${providerType}`);
      });

      await step.run("mark-post-published", async () => {
        await markPostPublished(post.id, publishedUrl);
      });

      return { published: true, provider: providerType };
    } catch (error) {
      logger.error("Failed to publish post", { error });
      const message = error instanceof Error ? error.message : "Unknown error";
      await markPostFailed(post.id, message);
      throw error;
    }
  },
);

async function publishToTwitter({
  accessToken,
  content,
  handle,
  images,
  logger,
}: {
  accessToken: string;
  content: string;
  handle?: string | null;
  images?: ImageObject[];
  logger: any;
}) {
  const mediaIds = images?.length
    ? await uploadImagesToTwitter({
        accessToken,
        images,
        logger,
      })
    : [];

  const response = await fetch("https://api.x.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: content,
      ...(mediaIds.length > 0
        ? {
            media: {
              media_ids: mediaIds,
            },
          }
        : {}),
    }),
  });

  if (!response.ok) throw new Error("Failed to publish to Twitter");

  const responseText = await response.text();
  let data: any = null;
  try {
    data = JSON.parse(responseText);
  } catch (error) {
    logger.error("Failed to parse Twitter response", { error, responseText });
    data = null;
  }

  const postId = data?.data?.id;

  if (!postId) throw new Error("Failed to get post ID from Twitter response");

  return handle ? `https://x.com/${handle}/status/${postId}` : null;
}

async function uploadImagesToTwitter({
  accessToken,
  images,
  logger,
}: {
  accessToken: string;
  images: ImageObject[];
  logger: any;
}) {
  const mediaIds: string[] = [];

  for (const image of images) {
    const fileResponse = await fetch(image.url);
    if (!fileResponse.ok) throw new Error("Failed to fetch image");

    const bytes = await fileResponse.arrayBuffer();
    const contentType = fileResponse.headers
      .get("content-type")
      ?.split(";")[0]
      .trim();

    const pathname = new URL(image.url).pathname.toLowerCase();

    const mediaType =
      contentType &&
      contentType != "binary/octet-stream" &&
      contentType != "application/octet-stream"
        ? contentType
        : pathname.endsWith(".png")
          ? "image/png"
          : pathname.endsWith(".webp")
            ? "image/webp"
            : "image/jpeg";

    const formData = new FormData();
    const blob = new Blob([bytes], { type: mediaType });
    formData.append("media", blob);
    formData.append("media_category", "tweet_image");
    formData.append("media_type", mediaType);

    const uploadRes = await fetch("https://api.x.com/2/media/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });

    const response = await uploadRes.text();
    logger.info("Twitter media upload response", { response });
    let data: any = null;
    try {
      data = JSON.parse(response);
    } catch (e) {
      logger.error("Failed to parse Twitter media upload response", {
        response,
      });
      data = null;
    }

    if (!uploadRes.ok) {
      throw new Error(`Failed to upload media to Twitter: ${response}`);
    }

    const mediaId = data?.data?.id || data?.data?.media_key;
    if (!mediaId)
      throw new Error("Failed to get media ID from Twitter response");
    mediaIds.push(mediaId);
  }
  return mediaIds;
}

async function publishToLinkedIn({
  accessToken,
  text,
  authorId,
  images,
  logger,
}: {
  accessToken: string;
  text: string;
  authorId?: string | null;
  images?: { url: string; key: string }[];
  logger: any;
}) {
  if (!authorId) throw new Error("Missing LinkedIn provider account id.");
  const imageUrn = images?.[0]?.url
    ? await uploadLinkedInImage({
        accessToken,
        authorId,
        imageUrl: images[0].url,
      })
    : null;
  const body: Record<string, unknown> = {
    author: `urn:li:person:${authorId}`,
    commentary: text,
    visibility: "PUBLIC",
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: false,
  };

  if (imageUrn) {
    body.content = {
      media: {
        id: imageUrn,
      },
    };
  }
  const response = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
      "Linkedin-Version": "202604",
    },
    body: JSON.stringify(body),
  });

  const responseText = await response.text();
  let data: any = null;
  try {
    data = responseText ? JSON.parse(responseText) : null;
  } catch {
    logger.error("Failed to parse LinkedIn response", { responseText });
  }

  if (!response.ok) {
    throw new Error(data?.message || "Failed to publish to LinkedIn.");
  }
  const restliId = response.headers.get("x-restli-id") || data?.id || null;
  return restliId
    ? `https://www.linkedin.com/feed/update/${encodeURIComponent(restliId)}`
    : null;
}

async function uploadLinkedInImage({
  accessToken,
  authorId,
  imageUrl,
}: {
  accessToken: string;
  authorId: string;
  imageUrl: string;
}) {
  const initResponse = await fetch(
    "https://api.linkedin.com/rest/images?action=initializeUpload",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
        "Linkedin-Version": "202604",
      },
      body: JSON.stringify({
        initializeUploadRequest: {
          owner: `urn:li:person:${authorId}`,
        },
      }),
    },
  );
  const initResponseText = await initResponse.text();
  let initData: {
    message?: string;
    value?: { uploadUrl?: string; image?: string };
  } | null = null;
  try {
    initData = initResponseText ? JSON.parse(initResponseText) : null;
  } catch {
    throw new Error("Failed to parse LinkedIn image initialization response.");
  }

  if (!initResponse.ok) {
    throw new Error(
      initData?.message || "Failed to initialize LinkedIn image upload.",
    );
  }
  const uploadUrl = initData?.value?.uploadUrl;
  const imageUrn = initData?.value?.image;
  if (!uploadUrl || !imageUrn) {
    throw new Error(
      "LinkedIn image upload initialization did not return an upload URL.",
    );
  }
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error("Failed to fetch image for LinkedIn upload.");
  }
  const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
  const imageBuffer = await imageResponse.arrayBuffer();
  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
    },
    body: imageBuffer,
  });
  if (!uploadResponse.ok) {
    throw new Error("Failed to upload image to LinkedIn.");
  }

  return imageUrn as string;
}

// ============ INSTAGRAM PUBLISHING ============
async function publishToInstagram({
  accessToken,
  content,
  handle,
  images,
  userId,
  logger,
}: {
  accessToken: string;
  content: string;
  handle?: string | null;
  images?: ImageObject[];
  userId?: string | null;
  logger: any;
}) {
  try {
    // Instagram Graph API endpoint
    const caption = content.substring(0, 2200); // Instagram caption limit

    let mediaId: string | null = null;

    // Upload image if available
    if (images && images.length > 0) {
      const imageUrl = images[0].url;
      const uploadResponse = await fetch(
        `https://graph.instagram.com/v18.0/${userId}/media`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image_url: imageUrl,
            caption,
            access_token: accessToken,
          }),
        },
      );

      const uploadData = await uploadResponse.json();
      if (!uploadData.id) {
        throw new Error(
          uploadData.error?.message || "Failed to upload media to Instagram",
        );
      }
      mediaId = uploadData.id;

      // Publish the media
      const publishResponse = await fetch(
        `https://graph.instagram.com/v18.0/${userId}/media_publish`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            creation_id: mediaId,
            access_token: accessToken,
          }),
        },
      );

      const publishData = await publishResponse.json();
      if (!publishData.id) {
        throw new Error(
          publishData.error?.message || "Failed to publish to Instagram",
        );
      }

      return handle
        ? `https://instagram.com/${handle}/`
        : `https://instagram.com/`;
    } else {
      // Text-only post (carousel)
      return handle
        ? `https://instagram.com/${handle}/`
        : `https://instagram.com/`;
    }
  } catch (error) {
    logger.error("Instagram publishing error", { error });
    throw error;
  }
}

// ============ FACEBOOK PUBLISHING ============
async function publishToFacebook({
  accessToken,
  content,
  images,
  pageId,
  logger,
}: {
  accessToken: string;
  content: string;
  images?: ImageObject[];
  pageId?: string | null;
  logger: any;
}) {
  try {
    if (!pageId) throw new Error("Missing Facebook page ID");

    const payload: Record<string, any> = {
      message: content,
      access_token: accessToken,
    };

    // Add image if available
    if (images && images.length > 0) {
      payload.source = images[0].url;
    }

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/feed`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    const data = await response.json();

    if (!data.id) {
      throw new Error(data.error?.message || "Failed to publish to Facebook");
    }

    return `https://www.facebook.com/${data.id}`;
  } catch (error) {
    logger.error("Facebook publishing error", { error });
    throw error;
  }
}

// ============ THREADS PUBLISHING ============
async function publishToThreads({
  accessToken,
  content,
  images,
  userId,
  logger,
}: {
  accessToken: string;
  content: string;
  images?: ImageObject[];
  userId?: string | null;
  logger: any;
}) {
  try {
    if (!userId) throw new Error("Missing Threads user ID");

    // Create media container
    const containerPayload: Record<string, any> = {
      media_type: images && images.length > 0 ? "CAROUSEL" : "TEXT",
      text: content,
      access_token: accessToken,
    };

    if (images && images.length > 0) {
      containerPayload.image_url = images[0].url;
    }

    const containerResponse = await fetch(
      `https://graph.threads.com/v18.0/${userId}/threads`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(containerPayload),
      },
    );

    const containerData = await containerResponse.json();

    if (!containerData.id) {
      throw new Error(
        containerData.error?.message || "Failed to create Threads media",
      );
    }

    // Publish the thread
    const publishResponse = await fetch(
      `https://graph.threads.com/v18.0/${userId}/threads_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: containerData.id,
          access_token: accessToken,
        }),
      },
    );

    const publishData = await publishResponse.json();

    if (!publishData.id) {
      throw new Error(
        publishData.error?.message || "Failed to publish to Threads",
      );
    }

    return `https://threads.net/@username/${publishData.id}`;
  } catch (error) {
    logger.error("Threads publishing error", { error });
    throw error;
  }
}

// ============ BLUESKY PUBLISHING ============
async function publishToBluesky({
  accessToken,
  content,
  images,
  handle,
  logger,
}: {
  accessToken: string;
  content: string;
  images?: ImageObject[];
  handle?: string | null;
  logger: any;
}) {
  try {
    // Bluesky AT Protocol
    const embedData: Record<string, any> = {};

    // Upload images if available
    if (images && images.length > 0) {
      const imageEmbeds = [];
      for (const image of images.slice(0, 4)) {
        // Max 4 images per post
        const imgResponse = await fetch(image.url);
        const buffer = await imgResponse.arrayBuffer();

        // Create blob for upload
        const uploadResponse = await fetch(
          "https://bsky.social/xrpc/com.atproto.repo.uploadBlob",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/octet-stream",
            },
            body: buffer,
          },
        );

        const blobData = await uploadResponse.json();
        if (blobData.blob) {
          imageEmbeds.push({
            image: blobData.blob,
            alt: "Posted image",
          });
        }
      }

      if (imageEmbeds.length > 0) {
        embedData.embed = {
          $type: "app.bsky.embed.images",
          images: imageEmbeds,
        };
      }
    }

    // Create post record
    const now = new Date().toISOString();
    const record = {
      text: content,
      createdAt: now,
      facets: [],
      ...embedData,
    };

    const postResponse = await fetch(
      "https://bsky.social/xrpc/com.atproto.repo.createRecord",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repo: handle || "unknown",
          collection: "app.bsky.feed.post",
          record,
        }),
      },
    );

    const postData = await postResponse.json();

    if (!postData.uri) {
      throw new Error(postData.error || "Failed to publish to Bluesky");
    }

    return postData.uri; // Returns AT URI format
  } catch (error) {
    logger.error("Bluesky publishing error", { error });
    throw error;
  }
}

// ============ YOUTUBE PUBLISHING ============
async function publishToYouTube({
  accessToken,
  content,
  images,
  channelId,
  logger,
}: {
  accessToken: string;
  content: string;
  images?: ImageObject[];
  channelId?: string | null;
  logger: any;
}) {
  try {
    // YouTube Community Post API (if available) or fallback to Video Upload

    // For now, we'll create a community post
    const response = await fetch(
      "https://www.googleapis.com/youtube/v3/commentThreads",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          part: "snippet",
          snippet: {
            channelId,
            textOriginal: content,
            parentId: channelId, // Community post
          },
        }),
      },
    );

    const data = await response.json();

    if (!data.id) {
      throw new Error(data.error?.message || "Failed to publish to YouTube");
    }

    return `https://www.youtube.com/@${channelId || "channel"}`;
  } catch (error) {
    logger.error("YouTube publishing error", { error });
    throw error;
  }
}

// ============ TIKTOK PUBLISHING ============
async function publishToTikTok({
  accessToken,
  content,
  images,
  handle,
  logger,
}: {
  accessToken: string;
  content: string;
  images?: ImageObject[];
  handle?: string | null;
  logger: any;
}) {
  try {
    // TikTok API endpoint
    if (!images || images.length === 0) {
      throw new Error("TikTok requires at least one image/video");
    }

    const videoUrl = images[0].url;

    // Create upload session
    const initResponse = await fetch(
      "https://open.tiktok.com/api/v1/video/upload/init/",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          upload_type: "UPLOAD_BY_FILE",
          video_name: `OnionAI-${Date.now()}`,
        }),
      },
    );

    const initData = await initResponse.json();

    if (!initData.data?.upload_token) {
      throw new Error(
        initData.error?.message || "Failed to initialize TikTok upload",
      );
    }

    const uploadToken = initData.data.upload_token;

    // Upload video
    const videoResponse = await fetch(videoUrl);
    const videoBuffer = await videoResponse.arrayBuffer();

    const uploadResponse = await fetch(
      `https://open.tiktok.com/api/v1/video/upload/?upload_token=${uploadToken}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "video/mp4",
        },
        body: videoBuffer,
      },
    );

    if (!uploadResponse.ok) {
      throw new Error("Failed to upload video to TikTok");
    }

    // Publish video
    const publishResponse = await fetch(
      "https://open.tiktok.com/api/v1/video/publish/",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          upload_token: uploadToken,
          description: content.substring(0, 150),
          privacy_level: "PUBLIC_TO_EVERYONE",
          disable_comment: false,
          disable_duet: false,
          disable_stitch: false,
        }),
      },
    );

    const publishData = await publishResponse.json();

    if (!publishData.data?.video_id) {
      throw new Error(
        publishData.error?.message || "Failed to publish to TikTok",
      );
    }

    return handle
      ? `https://www.tiktok.com/@${handle}/video/${publishData.data.video_id}`
      : `https://www.tiktok.com/`;
  } catch (error) {
    logger.error("TikTok publishing error", { error });
    throw error;
  }
}

async function saveRefreshedToken(
  userChannelId: string | undefined,
  accessToken: string,
  refreshToken: string,
  expiresAt: number,
) {
  if (!userChannelId) {
    throw new Error("User channel ID is missing");
  }
  const insforge = getInsforgeAdminClient();
  const { error } = await insforge.database
    .from("user_channels")
    .update({
      access_token: encrypt(accessToken),
      refresh_token: encrypt(refreshToken),
      token_expires_at: expiresAt ?? null,
    })
    .eq("id", userChannelId);

  if (error) throw error;
}

async function markPostPublished(postId: string, published_url: string | null) {
  const insforge = getInsforgeAdminClient();
  const { error } = await insforge.database
    .from("scheduled_posts")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
      published_url: published_url,
    })
    .eq("id", postId);
  if (error) throw error;
}

async function markPostFailed(postId: string, errorMessage: string) {
  const insforge = getInsforgeAdminClient();
  const { error } = await insforge.database
    .from("scheduled_posts")
    .update({
      status: "failed",
      error_message: errorMessage,
    })
    .eq("id", postId);

  if (error) throw error;
}

function formatLinkedInText(text: string): string {
  return (
    text
      // normalize smart quotes to straight quotes
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/(\d+\.)\s{2}/g, "\n\n$1 ")
      // trim
      .trim()
      .slice(0, 3000)
  );
}
