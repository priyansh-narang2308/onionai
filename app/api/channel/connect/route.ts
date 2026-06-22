import { ChannelTypeEnum } from "@/constants/channels";
import { getInsforgeServerClient } from "@/lib/insforge-server";
import { getOAuthProvider } from "@/lib/social-oauth";
import { createPkcePair, getPkceCookieName } from "@/lib/social-oauth/pkce";
import { createOAuthState } from "@/lib/social-oauth/state";
import { NextRequest, NextResponse } from "next/server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL

export async function POST(request: NextRequest) {
    try {

        const { insforge, userId } = await getInsforgeServerClient();
        if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 401 });

        const { channelTypeId, mock } = await request.json();
        if (!channelTypeId) return NextResponse.json({ error: 'Channel type ID is required' }, { status: 400 });

        const { data: channelType, error } = await insforge.database
            .from("channel_types")
            .select("id, type, name")
            .eq("id", channelTypeId)
            .single();

        if (error || !channelType) {
            return NextResponse.json({ error: 'Channel type not found' }, { status: 404 });
        }

        const redirectTo = `${APP_URL}/settings`;

        if (mock) {
            const mockHandles: Record<string, string> = {
                TWITTER: "onion_dev",
                LINKEDIN: "Onion AI Developer",
                INSTAGRAM: "onion_ai",
                THREADS: "onion_threads",
                FACEBOOK: "Onion AI Page",
                BLUESKY: "onion.bsky.social",
                YOUTUBE: "Onion AI Channel",
                TIKTOK: "onion_tiktok",
            };
            const handle = mockHandles[channelType.type] || "onion_user";

            const payload = {
                user_id: userId,
                channel_type_id: channelTypeId,
                provider_account_id: `mock-${channelType.type.toLowerCase()}-${userId}`,
                handle: handle,
                profile_image: `https://avatar.vercel.sh/${handle}`,
                access_token: "mock-access-token",
                refresh_token: "mock-refresh-token",
                token_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                is_connected: true,
                is_active: true,
            };

            const { error: upsertError } = await insforge.database
                .from("user_channels")
                .upsert(payload, {
                    onConflict: "user_id,channel_type_id"
                });

            if (upsertError) {
                console.error("Mock connect upsert error:", upsertError);
                return NextResponse.json({ error: 'Failed to connect mock channel' }, { status: 500 });
            }

            return NextResponse.json({ url: `${redirectTo}?connected=true&channelType=${channelType.name}` });
        }

        const provider = getOAuthProvider(channelType.type as ChannelTypeEnum);
        const state = createOAuthState({
            userId,
            channelTypeId: channelType.id,
            channelType: channelType.type,
            redirectTo,
        })

        const callbackUrl = `${APP_URL}/api/channel/callback`

        const pkce = channelType.type === ChannelTypeEnum.TWITTER ?
            createPkcePair()
            : null

        const url = provider.getAuthorizationUrl({
            state,
            redirectUri: callbackUrl,
            codeChallenge: pkce?.codeChallenge,
            codeChallengeMethod: pkce?.codeChallengeMethod,
        })

        const response = NextResponse.json({ url })

        if (pkce) {
            response.cookies.set(getPkceCookieName(state), pkce.codeVerifier, {
                httpOnly: true,
                secure: true,
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 10, // 10 minutes
            })
        }

        return response;

    } catch (error) {
        console.error('Error connecting channel:', error);
        return NextResponse.json({ error: 'Failed to connect channel' }, { status: 500 });
    }
}
