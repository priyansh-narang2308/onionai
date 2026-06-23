/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import React, { useEffect, useMemo, useState } from "react";
import { parse, set } from "date-fns";
import { getChannelIcon } from "@/constants/channels";
import { ChannelType } from "@/types/channel.type";
import { ImageObject } from "@/types/post.type";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Lightbulb,
  ScanEye,
  Wand2,
  ArrowRight,
} from "lucide-react";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { toast } from "sonner";
import ChannelAvatar from "../channel-avatar";
import ContentTextarea from "../content-textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { HugeiconsIcon } from "@hugeicons/react";
import IdeasList from "./ideas-list";
import PreviewPanel from "./preview";
import { TranslationWidget } from "./translation-widget";
import { ButtonGroup } from "../ui/button-group";
import { POST_STATUS, PostStatus } from "@/constants/post";
import { ScheduleDatePicker } from "./schedule-date-picker";
import Link from "next/link";
import { Spinner } from "../ui/spinner";
import { AIAssistant } from "./ai-assitant";

type PropsType = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: Date | null;
};

type ChannelContent = {
  text: string;
  images: ImageObject[];
};

type ActionTabType = "ideas" | "ai" | "preview";

const rightTabs = [
  { id: "ideas" as ActionTabType, label: "Ideas", icon: Lightbulb },
  { id: "ai" as ActionTabType, label: "AI Assistant", icon: Wand2 },
  { id: "preview" as ActionTabType, label: "Preview", icon: ScanEye },
];

const CreatePostDialog = ({ open, onOpenChange, selectedDate }: PropsType) => {
  const queryClient = useQueryClient();
  const [globalContent, setGlobalContent] = useState<ChannelContent>({
    text: "",
    images: [],
  });
  const [channelContent, setChannelContent] = useState<
    Record<string, ChannelContent>
  >({});
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [selectedRightTab, setSelectedRightTab] =
    useState<ActionTabType | null>(null);
  const [activePreview, setActivePreview] = useState<string>("");
  const [activeAccordion, setActiveAccordion] = useState<string>("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [timeSlot, setTimeSlot] = useState<string>("");

  const { data, isPending } = useQuery({
    queryKey: ["channels"],
    queryFn: async () => {
      const res = await fetch("/api/channel");
      const data = await res.json();
      return data;
    },
  });

  const channelsData = data?.channels;
  const hasConnectedChannel = data?.connectedCount > 0;

  const channels = useMemo(() => {
    if (isPending) {
      return [];
    }
    return (channelsData || []).map((channel: any) => ({
      ...channel,
      icon: getChannelIcon(channel.type),
    })) as ChannelType[];
  }, [isPending, channelsData]);

  useEffect(() => {
    if (selectedDate) {
      setDate(selectedDate);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (channels.length > 0 && Object.keys(channelContent).length === 0) {
      const initialContent: Record<string, ChannelContent> = {};
      channels.forEach((channel) => {
        initialContent[channel.id] = { text: "", images: [] };
      });
      setChannelContent(initialContent);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channels]);

  const connectedChannels = channels.filter((channel) => channel.connected);
  const selectedChannelsList = channels.filter((channel) =>
    selectedChannels.includes(channel.id),
  );
  const previewChannel = channels.find((c) => c.id === activePreview) ?? null;
  const previewContent = channelContent?.[activePreview] ?? {
    text: "",
    images: [],
  };

  const [selectedIdeaId, setSelectedIdeaId] = React.useState<string | null>(
    null,
  );

  const createPostMutation = useMutation({
    mutationFn: async ({
      posts,
      scheduledAt,
      status,
      ideaId,
    }: {
      posts: any[];
      scheduledAt: string;
      status?: PostStatus;
      ideaId?: string | null;
    }) => {
      const response = await fetch("/api/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          posts,
          scheduledAt,
          status,
          ideaId,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to create posts");
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      toast.success(
        `${data.posts.length} post(s) ${variables.status === POST_STATUS.DRAFT ? "saved to draft" : "scheduled"} successfully`,
      );
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "posts",
      });
      handleOpenChange(false);
    },
    onError: (error: any) => {
      console.log("failed to create post", error);
      toast.error("Failed to save post");
    },
  });

  const handleSelectRightTab = (tab: ActionTabType) => {
    setSelectedRightTab((prev) => (prev === tab ? null : tab));
  };

  const handleSelectAll = () => {
    setSelectedChannels((prev) => {
      if (prev.length === connectedChannels.length) {
        setActivePreview("");
        return [];
      }

      setChannelContent((prev) => {
        const update = { ...prev };
        connectedChannels.forEach((channel) => {
          if (!update[channel.id]?.text && globalContent.text) {
            const limit = Number(channel.character_limit);

            update[channel.id] = {
              text: globalContent.text.slice(0, limit),
              images: [...globalContent.images],
            };
          } else if (!update[channel.id]) {
            update[channel.id] = { text: "", images: [] };
          }
        });
        return update;
      });
      return connectedChannels.map((channel) => channel.id);
    });
  };

  const handleGlobalContentChange = (text: string, images?: ImageObject[]) => {
    setGlobalContent((prev) => ({
      ...prev,
      text,
      images: images || prev.images,
    }));
  };

  const handleAccordionChange = (value: string) => {
    setActiveAccordion(value);
    setActivePreview(value);
  };

  const handleTextChange = (
    channelId: string,
    text: string,
    character_limit: number,
  ) => {
    const limit = Number(character_limit);
    if (text.length <= limit) {
      setChannelContent((prev) => ({
        ...prev,
        [channelId]: {
          ...prev[channelId],
          text,
        },
      }));
    }
  };

  const toggleChannel = (channelId: string, character_limit: number) => {
    setSelectedChannels((prev) => {
      if (prev.includes(channelId) && activePreview === channelId)
        setActivePreview("");
      const isSelected = prev.includes(channelId);

      const newChannels = isSelected
        ? prev.filter((id) => id != channelId)
        : [...prev, channelId];

      if (!isSelected) {
        if (globalContent.text && !channelContent[channelId]?.text) {
          const limit = Number(character_limit);
          setChannelContent((prev) => ({
            ...prev,
            [channelId]: {
              ...prev[channelId],
              text: globalContent.text.slice(0, limit),
              images: [...globalContent.images],
            },
          }));
        }
      } else {
        setChannelContent((prev) => ({
          ...prev,
          [channelId]: { text: "", images: [] },
        }));
      }
      return newChannels;
    });

    if (!selectedChannels.includes(channelId)) {
      setActiveAccordion(channelId);
      setActivePreview(channelId);
    }
  };

  const handleIdeaSelect = (idea: any) => {
    if (!hasConnectedChannel) {
      toast.error("Connect at least one channel to add idea");
      return;
    }
    setSelectedIdeaId(idea.id);
    if (selectedChannels.length === 0) {
      setGlobalContent({
        text: idea.title + "\n\n" + idea.description,
        images: idea.images || [],
      });
      return;
    }
    setChannelContent((prev) => {
      return {
        ...prev,
        [activeAccordion]: {
          text: idea.title + "\n\n" + idea.description,
          images: idea.images || [],
        },
      };
    });
  };

  const handleCreatePost = (status?: PostStatus) => {
    if (selectedChannels.length === 0) {
      toast.error("Select at least one channel");
      return;
    }
    const postToCreate = selectedChannelsList.map((channel) => {
      const content = channelContent[channel.id] ?? { text: "", images: [] };
      return {
        channelTypeId: channel.id,
        content: content.text,
        images: content.images,
      };
    });
    if (postToCreate.some((post) => !post.content)) {
      toast.error("Each selected channel must have content");
      return;
    }

    const parsedTime = parse(timeSlot, "h:mm a", new Date());
    const scheduleAt = set(date || new Date(), {
      hours: parsedTime.getHours(),
      minutes: parsedTime.getMinutes(),
      seconds: 0,
      milliseconds: 0,
    });

    createPostMutation.mutate({
      posts: postToCreate,
      scheduledAt: scheduleAt.toISOString(),
      status,
      ideaId: selectedIdeaId,
    });
  };

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    setGlobalContent({ text: "", images: [] });
    setChannelContent({});
    setActiveAccordion("");
    setActivePreview("");
    setSelectedRightTab(null);
    setDate(new Date());
    setTimeSlot("");
    setSelectedChannels([]);
    setSelectedIdeaId(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "sm:w-full sm:min-w-[700px] gap-0 px-0 pt-0 pb-0 overflow-hidden bg-background/95 backdrop-blur-md border border-border/60 shadow-2xl rounded-2xl transition-all duration-300",
          selectedRightTab && "sm:max-w-[950px]",
        )}
      >
        <div>
          <DialogHeader className="px-8 py-3.5 border-b border-border/50 bg-linear-to-r from-background to-muted/10">
            <div className="flex items-center justify-between">
              <DialogTitle className="font-semibold text-lg tracking-tight text-foreground/90">
                Create Post
              </DialogTitle>
              <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl border border-border/40 mr-8">
                {rightTabs.map((tab) => {
                  const isActive = selectedRightTab === tab.id;
                  return (
                    <Button
                      key={tab.id}
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-8 px-3 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer",
                        isActive
                          ? "bg-background text-foreground shadow-sm border border-border/20 font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-background/40",
                      )}
                      onClick={() => handleSelectRightTab(tab.id)}
                    >
                      <tab.icon
                        className={cn(
                          "size-3.5 mr-1.5",
                          isActive
                            ? "text-primary animate-pulse"
                            : "text-muted-foreground",
                        )}
                      />
                      <span>{tab.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          </DialogHeader>

          <div className="w-full flex flex-1 min-w-0 overflow-hidden h-[580px]">
            {/* Left — channel list */}
            <div className="flex flex-1 flex-col min-w-0 w-[300px] pb-5">
              <div className="channel--selector py-5 px-8 border-b border-border/40 bg-muted/5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                    Publish to
                  </span>
                  {connectedChannels.length > 0 && (
                    <button
                      className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer bg-primary/5 hover:bg-primary/10 px-2 py-1 rounded-md"
                      onClick={handleSelectAll}
                    >
                      {selectedChannels.length === connectedChannels.length
                        ? "Unselect all"
                        : "Select all"}
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  {isPending
                    ? Array.from({ length: 6 }).map((_, index) => (
                        <Skeleton
                          key={index}
                          className="size-[42px] rounded-xl"
                        />
                      ))
                    : channels?.map((channel) => {
                        const selected = selectedChannels.includes(channel.id);
                        const isConnected = channel.connected;
                        return (
                          <Tooltip key={channel.id}>
                            <TooltipTrigger asChild>
                              <button
                                style={
                                  {
                                    "--channel-color": channel.color,
                                  } as React.CSSProperties
                                }
                                className={cn(
                                  "relative shrink-0 rounded-xl p-0 transition-all duration-200",
                                  !isConnected
                                    ? "cursor-not-allowed opacity-40 grayscale hover:opacity-65"
                                    : "cursor-pointer hover:scale-105 active:scale-95",
                                  selected
                                    ? "ring-2 ring-(--channel-color) ring-offset-2 scale-105 shadow-[0_0_12px_var(--channel-color)]"
                                    : "",
                                )}
                                onClick={() => {
                                  if (!isConnected) {
                                    toast.error(
                                      "Please connect the channel first in Settings",
                                    );
                                    return;
                                  }

                                  toggleChannel(
                                    channel.id,
                                    channel.character_limit,
                                  );
                                }}
                              >
                                <ChannelAvatar
                                  className="size-[42px] transition-transform duration-200"
                                  type={channel.type}
                                  color={channel.color}
                                  profileImage={channel.profile_image}
                                />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs">
                              {isConnected
                                ? `Select ${channel.name}`
                                : `Connect ${channel.name} under Settings`}
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                </div>
              </div>

              <div className="channel--content relative flex flex-col px-8 min-h-[300px] h-full overflow-y-auto pt-5">
                {selectedChannels.length === 0 ? (
                  <div className="space-y-4">
                    {!hasConnectedChannel && (
                      <div className="flex items-start gap-3 rounded-2xl border border-amber-200/50 bg-amber-50/50 p-4 text-amber-800 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-300 shadow-sm animate-pulse-subtle">
                        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                        <div className="space-y-1">
                          <h4 className="text-sm font-semibold leading-none">
                            No channels connected
                          </h4>
                          <p className="text-xs text-amber-700/90 dark:text-amber-400/80 leading-normal">
                            You need to connect at least one social media
                            channel to begin writing and scheduling posts.
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="bg-card/45 backdrop-blur-xs border border-border/80 rounded-2xl p-5 shadow-inner transition-all duration-300 focus-within:border-primary/45 focus-within:ring-2 focus-within:ring-primary/10">
                      <ContentTextarea
                        value={globalContent?.text || ""}
                        images={globalContent?.images || []}
                        placeholder="Write your main content here... It will automatically copy to your channels when you select them."
                        minHeight={270}
                        showAIAssistant={true}
                        disabled={!hasConnectedChannel}
                        contentClass="text-base placeholder:text-muted-foreground/60 leading-relaxed pt-0!"
                        onChange={(text) => handleGlobalContentChange(text)}
                        onImagesChange={(images) =>
                          handleGlobalContentChange(globalContent.text, images)
                        }
                        renderToolbarRight={
                          <div className="flex items-center gap-3">
                            <TranslationWidget
                              text={globalContent?.text || ""}
                              onTranslate={(translated) =>
                                handleGlobalContentChange(translated)
                              }
                              disabled={!hasConnectedChannel}
                            />
                          </div>
                        }
                      />
                    </div>
                  </div>
                ) : (
                  <Accordion
                    type="single"
                    collapsible
                    value={activeAccordion}
                    className="w-full space-y-3"
                    onValueChange={(val) => {
                      handleAccordionChange(val);
                    }}
                  >
                    {selectedChannelsList?.map((channel) => {
                      const content = channelContent[channel.id] || {
                        text: "",
                        images: [],
                      };
                      const isExpanded = activeAccordion === channel.id;
                      const icon = getChannelIcon(channel.type);
                      return (
                        <AccordionItem
                          key={channel.id}
                          value={channel.id}
                          className="border rounded-xl"
                        >
                          {!isExpanded && (
                            <AccordionTrigger
                              className="w-full px-3 cursor-pointer [&>svg]:hidden! hover:bg-muted
hover:no-underline! justify-start gap-3 
"
                            >
                              <span>
                                <HugeiconsIcon
                                  icon={icon}
                                  className={cn(
                                    "shrink-0 text-white! size-5! p-[3px] rounded-sm",
                                  )}
                                  style={{ background: channel.color }}
                                />
                              </span>
                              {content.text ? (
                                <p
                                  className="text-sm text-muted-foreground/80 
truncate flex-1 text-left max-w-[400px]"
                                >
                                  {content.text}
                                </p>
                              ) : (
                                <p className="text-sm tex-muted">
                                  What would you like to share
                                </p>
                              )}
                            </AccordionTrigger>
                          )}

                          <AccordionContent className="overflow-visible">
                            <div className="flex pt-3 px-3 gap-3">
                              {isExpanded && (
                                <span>
                                  <HugeiconsIcon
                                    icon={icon}
                                    className={cn(
                                      "shrink-0 text-white! size-5! p-[3px] rounded-sm",
                                    )}
                                    style={{ background: channel.color }}
                                  />
                                </span>
                              )}

                              <div className="flex-1">
                                {!content?.text && (
                                  <div
                                    className="w-full flex items-center gap-2 rounded-md
bg-[#ffefd0] px-3 py-1 text-xs text-amber-700
dark:bg-amber-950/40
dark:text-amber-400"
                                  >
                                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                    <p>
                                      Please include at least some text or an
                                      attachment.
                                    </p>
                                  </div>
                                )}

                                <ContentTextarea
                                  value={content?.text || ""}
                                  images={content?.images || []}
                                  placeholder="Start writing or get inspired by AI"
                                  minHeight={260}
                                  contentClass="text-sm placeholder:opacity-50 pt-0"
                                  showAIAssistant={true}
                                  disabled={!channel.connected}
                                  onAIAssistantClick={() => {
                                    setSelectedRightTab("ai");
                                  }}
                                  onChange={(text) =>
                                    handleTextChange(
                                      channel.id,
                                      text,
                                      channel.character_limit,
                                    )
                                  }
                                  onImagesChange={(images) => {
                                    setChannelContent((prev) => ({
                                      ...prev,
                                      [channel.id]: {
                                        ...content,
                                        images,
                                      },
                                    }));
                                  }}
                                  renderToolbarRight={
                                    <div className="flex items-center gap-3">
                                      <TranslationWidget
                                        text={content?.text || ""}
                                        onTranslate={(translated) =>
                                          handleTextChange(
                                            channel.id,
                                            translated,
                                            channel.character_limit,
                                          )
                                        }
                                        disabled={!channel.connected}
                                      />
                                      <span
                                        className={cn(
                                          "text-[10px] font-medium px-2 py-0.5 rounded-full",
                                          (content?.text?.length || 0) >=
                                            Number(channel.character_limit) *
                                              0.9
                                            ? "bg-orange-100 text-orange-600"
                                            : "bg-muted text-muted-foreground",
                                        )}
                                      >
                                        {content?.text?.length || 0} /{" "}
                                        {channel.character_limit}
                                      </span>
                                    </div>
                                  }
                                />
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                )}
              </div>
            </div>

            {/* Right — channel preview */}
            {selectedRightTab && (
              <div
                className="w-[350px] flex flex-col shrink-0 border-l border-border
            bg-muted/30 h-full
            "
              >
                <div className="py-4 flex-1 flex flex-col h-full">
                  {selectedRightTab === "ai" && (
                    <div className="px-6">
                      <AIAssistant
                        content={
                          channelContent[activeAccordion]?.text ||
                          globalContent?.text ||
                          ""
                        }
                        channelId={activeAccordion}
                        onGenerate={(content: any) => {
                          if (globalContent?.text) {
                            setGlobalContent((prev) => ({
                              ...prev,
                              text: content,
                            }));
                          }
                          setChannelContent((prev) => ({
                            ...prev,
                            [activeAccordion]: {
                              ...prev[activeAccordion],
                              text: content,
                            },
                          }));
                        }}
                      />
                    </div>
                  )}

                  {selectedRightTab === "ideas" && (
                    <IdeasList onSelect={handleIdeaSelect} />
                  )}

                  {selectedRightTab === "preview" && (
                    <PreviewPanel
                      channel={previewChannel}
                      content={previewContent}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="px-8 pt-4 pb-5 m-0! border-t border-border/40 bg-muted/20">
          {hasConnectedChannel ? (
            <div className="w-full flex items-center justify-between gap-2">
              <Button
                size="lg"
                variant="ghost"
                disabled={createPostMutation.isPending}
                onClick={() => handleCreatePost(POST_STATUS.DRAFT)}
                className="cursor-pointer"
              >
                {createPostMutation.isPending &&
                  createPostMutation.variables.status === POST_STATUS.DRAFT && (
                    <Spinner />
                  )}
                Save Draft
              </Button>
              <ButtonGroup className="p-0!">
                <ScheduleDatePicker
                  date={date}
                  setDate={setDate}
                  time={timeSlot}
                  setTime={setTimeSlot}
                  renderButton={(isDatePassed, isTimeNotAvailable) => (
                    <Button
                      size="lg"
                      className="border py-4.5 px-4 cursor-pointer"
                      disabled={
                        createPostMutation.isPending ||
                        !date ||
                        !timeSlot ||
                        isDatePassed ||
                        isTimeNotAvailable
                      }
                      onClick={() => {
                        if (isDatePassed || isTimeNotAvailable) {
                          toast.error("Please select a valid date and time");
                          return;
                        }
                        handleCreatePost();
                      }}
                    >
                      {createPostMutation.isPending &&
                        createPostMutation.variables.status === undefined && (
                          <Spinner />
                        )}
                      Schedule Post
                    </Button>
                  )}
                />
              </ButtonGroup>
            </div>
          ) : (
            <Button
              size="lg"
              className="group/btn px-6 py-5.5 rounded-xl font-semibold shadow-lg hover:shadow-primary/10 hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] transition-all bg-primary text-primary-foreground flex items-center gap-2 cursor-pointer"
              asChild
            >
              <Link href="/settings">
                Connect Channel to Post
                <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
              </Link>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostDialog;
