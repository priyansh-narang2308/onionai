"use client"

import * as React from "react"
import { EmojiPicker } from "@ferrucc-io/emoji-picker"
import { X, Wand2Icon, ImagePlus, SmileIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Separator } from "./ui/separator"
import { Spinner } from "./ui/spinner"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { Textarea } from "./ui/textarea"
import { ImageObject } from "@/types/post.type"


interface ContentTextareaProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  contentClass?: string
  minHeight?: number
  showAIAssistant?: boolean
  onAIAssistantClick?: () => void
  showHashtag?: boolean
  className?: string
  images?: ImageObject[]
  onImagesChange?: (images: ImageObject[]) => void
  renderToolbarRight?: React.ReactNode
  renderContent?: React.ReactNode
  disabled?: boolean
}

const ContentTextarea = ({
  value,
  onChange,
  placeholder = "What's on your mind?",
  contentClass,
  minHeight = 280,
  showAIAssistant = false,
  onAIAssistantClick,
  className,
  images = [],
  onImagesChange,
  renderToolbarRight,
  renderContent,
  disabled = false
}: ContentTextareaProps) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const [isUploading, setIsUploading] = React.useState(false)
  const [emojiOpen, setEmojiOpen] = React.useState(false)

  const insertEmoji = (emoji: string) => {
    if (disabled) return
    const textarea = textareaRef.current
    if (!textarea) {
      onChange(`${value}${emoji}`)
      setEmojiOpen(false)
      return
    }
    const start = textarea.selectionStart ?? value.length
    const end = textarea.selectionEnd ?? value.length
    const nextValue = `${value.slice(0, start)}${emoji}${value.slice(end)}`

    onChange(nextValue)
    setEmojiOpen(false)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    const newImages = [...images]

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append("file", file)
        const response = await fetch("/api/upload-image", {
          method: "POST",
          body: formData,
        })
        if (!response.ok) throw new Error("Upload failed")
        const result = await response.json()
        if (result.image) {
          newImages.push({
            url: result.image.url,
            key: result.image.key
          })
        }
      }
      onImagesChange?.(newImages)
    } catch (error) {
      console.error("Upload error:", error)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemoveImage = (index: number) => {
    onImagesChange?.(images.filter((_, i) => i !== index))
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>

      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        //minHeight={minHeight}
        className={cn(
          "flex-[0.2] bg-transparent ring-0! border-none! resize-none! pt-0! pl-0! pr-0!",
          "disabled:bg-transparent! dark:disabled:bg-transparent! dark:bg-transparent!",
          "placeholder:text-muted-foreground/80 overflow-y-auto",
          disabled && "opacity-50 cursor-not-allowed",
          contentClass
          // `w-full bg-transparent 
          // text-base
          // placeholder:text-muted-foreground/80 focus:outline-none`,
          // //contentClass && contentClass,
          // disabled && "opacity-50 cursor-not-allowed"
        )}
        style={{ minHeight: `${minHeight}px`, maxHeight: `${minHeight}px` }}
      />

      <div className="shrink-0 space-y-3 mt-4">
        <div className="flex items-center gap-3">
          <div
            onClick={() => !isUploading && !disabled && fileInputRef.current?.click()}
            className={cn(
              "group/upload shrink-0 size-24 border border-dashed border-border/80 hover:border-primary/50",
              "rounded-xl flex flex-col items-center justify-center cursor-pointer bg-muted/40 hover:bg-primary/5",
              "transition-all duration-300 shadow-sm",
              (isUploading || disabled) && "opacity-50 cursor-not-allowed pointer-events-none",
              disabled && "grayscale"
            )}
          >
            {isUploading ? (
              <Spinner className="text-primary animate-spin" />
            ) : (
              <ImagePlus className="h-5.5 w-5.5 text-muted-foreground/75 group-hover/upload:text-primary group-hover/upload:scale-110 transition-all duration-300 mb-1" />
            )}
            <span className="text-xs font-semibold text-muted-foreground/80 group-hover/upload:text-primary transition-colors duration-300">
              {isUploading ? "Uploading..." : "Add Media"}
            </span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />

          {images.length > 0 && (
            <div className="flex gap-3 w-full max-w-[460px] overflow-x-auto pb-2">
              {images.map((image, index) => (
                <div
                  key={image.key || index}
                  className="group/image shrink-0 relative size-24 rounded-xl overflow-hidden border border-border/80 shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <img
                    src={image.url}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover group-hover/image:scale-105 transition-transform duration-300"
                  />
                  <button
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-1 right-1 bg-black/50 hover:bg-destructive hover:scale-110 text-white rounded-full p-1 transition-all duration-200 cursor-pointer shadow"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border/40">
          <div className="flex items-center gap-1.5">
            <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
              <PopoverTrigger asChild>
                <Button 
                  size="icon-sm" 
                  className="cursor-pointer rounded-lg hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors duration-200" 
                  variant="ghost" 
                  disabled={disabled}
                >
                  <SmileIcon className="h-4.5 w-4.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-[300px] p-0!">
                <EmojiPicker
                  onEmojiSelect={insertEmoji}
                  className="w-full! rounded-lg bg-popover ring-0!"
                  emojisPerRow={6}
                  emojiSize={36}
                >
                  <EmojiPicker.Header className="border-b border-border pb-2">
                    <EmojiPicker.Input
                      placeholder="Search emoji"
                      autoFocus
                      className="h-8 border border-border! bg-background ring-0!"
                    />
                  </EmojiPicker.Header>
                  <EmojiPicker.Group>
                    <EmojiPicker.List hideStickyHeader containerHeight={320} />
                  </EmojiPicker.Group>
                </EmojiPicker>
              </PopoverContent>
            </Popover>
            <Separator orientation="vertical" className="mx-0 my-1.5 h-4" />
            {showAIAssistant && (
              <Button
                variant="ghost"
                size="sm"
                className="ml-1 h-8 gap-1.5 text-xs font-semibold rounded-lg bg-primary/5 text-lime-500 hover:bg-lime-500/10 hover:text-lime-500  transition-all duration-200 cursor-pointer"
                onClick={onAIAssistantClick}
                disabled={disabled}
              >
                <Wand2Icon className="h-3.5 w-3.5 text-lime-500" />
                AI Assistant
              </Button>
            )}
          </div>
          {renderToolbarRight && (
            <div className="flex items-center gap-2">{renderToolbarRight}</div>
          )}
        </div>

        {renderContent && <>{renderContent}</>}
      </div>
    </div>
  )
}
export default ContentTextarea