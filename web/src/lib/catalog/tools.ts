import type { Component } from "svelte";
import type { LucideProps } from "@lucide/svelte";
import LayoutGrid from "@lucide/svelte/icons/layout-grid";
import FileText from "@lucide/svelte/icons/file-text";
import Image from "@lucide/svelte/icons/image";
import ListOrdered from "@lucide/svelte/icons/list-ordered";
import Combine from "@lucide/svelte/icons/combine";
import Scissors from "@lucide/svelte/icons/scissors";
import FileImage from "@lucide/svelte/icons/file-image";
import Eraser from "@lucide/svelte/icons/eraser";
import Lock from "@lucide/svelte/icons/lock";
import LockOpen from "@lucide/svelte/icons/lock-open";
import ImageDown from "@lucide/svelte/icons/image-down";
import SquareDashed from "@lucide/svelte/icons/square-dashed";
import Type from "@lucide/svelte/icons/type";
import CaseSensitive from "@lucide/svelte/icons/case-sensitive";
import Pilcrow from "@lucide/svelte/icons/pilcrow";
import WholeWord from "@lucide/svelte/icons/whole-word";
import ScanText from "@lucide/svelte/icons/scan-text";
import Crop from "@lucide/svelte/icons/crop";
import Scaling from "@lucide/svelte/icons/scaling";
import RotateCw from "@lucide/svelte/icons/rotate-cw";
import Clapperboard from "@lucide/svelte/icons/clapperboard";
import Video from "@lucide/svelte/icons/video";
import Music from "@lucide/svelte/icons/music";
import Code from "@lucide/svelte/icons/code";
import Braces from "@lucide/svelte/icons/braces";
import WandSparkles from "@lucide/svelte/icons/wand-sparkles";

/** A Lucide icon component. */
export type IconComponent = Component<LucideProps>;

export type Category = {
    id: string;
    name: string;
    icon: IconComponent;
};

export type Tool = {
    id: string;
    name: string;
    description: string;
    /** Route the tool lives at. */
    href: string;
    /** Id of the category this tool belongs to. */
    category: string;
    icon: IconComponent;
    /** Defaults to 'available'. */
    status?: "available" | "coming-soon";
};

/**
 * The categories shown in the sidebar. `all` is a virtual category that lists
 * every tool. Add new categories here as the toolbox grows.
 */
export const categories: Category[] = [
    { id: "all", name: "All tools", icon: LayoutGrid },
    { id: "pdf", name: "PDF", icon: FileText },
    { id: "image", name: "Image", icon: Image },
    { id: "media", name: "Media", icon: Clapperboard },
    { id: "typography", name: "Typography", icon: Type },
    { id: "developer", name: "Developer", icon: Code },
];

/**
 * The tools listed on the index page. The only implemented tool today is the
 * PDF page organizer; the rest are placeholders that show the layout and where
 * future tools will slot in.
 */
export const tools: Tool[] = [
    {
        id: "pdf-organizer",
        name: "Reorder Pages",
        description: "Rearrange the pages of a PDF by dragging them into a new order.",
        href: "/pdf/organizer",
        category: "pdf",
        icon: ListOrdered,
    },
    {
        id: "pdf-merge",
        name: "Merge PDFs",
        description: "Combine multiple PDF files into a single document.",
        href: "/pdf/merge",
        category: "pdf",
        icon: Combine,
    },
    {
        id: "pdf-split",
        name: "Split PDF",
        description: "Pick the pages to keep from a PDF and save them as a new file.",
        href: "/pdf/split",
        category: "pdf",
        icon: Scissors,
    },
    {
        id: "pdf-encrypt",
        name: "Encrypt PDF",
        description: "Password-protect a PDF with your choice of encryption.",
        href: "/pdf/encrypt",
        category: "pdf",
        icon: Lock,
    },
    {
        id: "pdf-password-remove",
        name: "Remove PDF Password",
        description: "Strip the password from a protected PDF.",
        href: "/pdf/password-remove",
        category: "pdf",
        icon: LockOpen,
    },
    {
        id: "pdf-image-extract",
        name: "Extract Images",
        description: "Pull all embedded images out of a PDF.",
        href: "/pdf/image-extract",
        category: "pdf",
        icon: ImageDown,
    },
    {
        id: "image-convert",
        name: "Convert & Compress",
        description: "Convert between image formats and adjust quality to shrink the file.",
        href: "/image/convert",
        category: "image",
        icon: FileImage,
    },
    {
        id: "image-background-remove",
        name: "Remove Image Background",
        description: "Erase an image's background with an AI model (U²-Net or ISNet).",
        href: "/image/background-remove",
        category: "image",
        icon: Eraser,
    },
    {
        id: "image-padding",
        name: "Pad Image",
        description: "Add solid-color or transparent padding around an image.",
        href: "/image/padding",
        category: "image",
        icon: SquareDashed,
    },
    {
        id: "image-crop",
        name: "Crop Image",
        description: "Trim an image down to a selected region or aspect ratio.",
        href: "/image/crop",
        category: "image",
        icon: Crop,
    },
    {
        id: "image-resize",
        name: "Resize Image",
        description: "Scale an image to new pixel dimensions, optionally keeping its aspect ratio.",
        href: "/image/resize",
        category: "image",
        icon: Scaling,
    },
    {
        id: "image-rotate",
        name: "Rotate & Flip Image",
        description: "Turn an image by 90°, 180° or any angle, or mirror it horizontally/vertically.",
        href: "/image/rotate",
        category: "image",
        icon: RotateCw,
    },
    {
        id: "image-ocr",
        name: "Image OCR",
        description: "Extract the text from an image with optical character recognition.",
        href: "/image/ocr",
        category: "image",
        icon: ScanText,
    },
    {
        id: "media-video-convert",
        name: "Convert Video",
        description: "Convert a video between formats like MP4, WebM, MOV and GIF.",
        href: "/media/video-convert",
        category: "media",
        icon: Video,
        status: "coming-soon",
    },
    {
        id: "media-audio-convert",
        name: "Convert Audio",
        description: "Convert an audio file between formats like MP3, WAV, FLAC and OGG.",
        href: "/media/audio-convert",
        category: "media",
        icon: Music,
        status: "coming-soon",
    },
    {
        id: "typography-case",
        name: "Convert Case",
        description: "Switch text between UPPERCASE, lowercase, Title Case and Sentence case.",
        href: "/typography/case",
        category: "typography",
        icon: CaseSensitive,
    },
    {
        id: "typography-lorem-ipsum",
        name: "Lorem Ipsum",
        description: "Generate placeholder text by words, sentences or paragraphs.",
        href: "/typography/lorem-ipsum",
        category: "typography",
        icon: Pilcrow,
    },
    {
        id: "typography-counter",
        name: "Word Counter",
        description: "Count characters, words, sentences and paragraphs, with reading and speaking time.",
        href: "/typography/counter",
        category: "typography",
        icon: WholeWord,
    },
    {
        id: "typography-enchanting",
        name: "Enchanting Table",
        description: "Translate text into the Minecraft Standard Galactic Alphabet, and back.",
        href: "/typography/enchanting",
        category: "typography",
        icon: WandSparkles,
    },
    {
        id: "developer-json-format",
        name: "JSON Formatter",
        description: "Pretty-print, minify and validate JSON.",
        href: "/developer/json-format",
        category: "developer",
        icon: Braces,
    },
];

/** Tools belonging to a category (`all` returns everything). */
export function toolsInCategory(categoryId: string): Tool[] {
    return categoryId === "all" ? tools : tools.filter((tool) => tool.category === categoryId);
}
