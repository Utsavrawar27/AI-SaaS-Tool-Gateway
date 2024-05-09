"use client";

import axios from "axios";
import * as z from "zod";
import { MessageSquare } from "lucide-react";
import { Heading } from "@/components/heading";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { useRouter } from "next/navigation";
import { ChatCompletionRequestMessage } from "openai";

import { fromSchema } from "./constants";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { Empty } from "@/components/empty";
import { useProModal } from "@/hooks/use-pro-modal";
import { Loader } from "@/components/loader";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/user-avatar";
import { BotAvatar } from "@/components/bot-avatar";

const ConversationPage = () => {
    const router = useRouter();
    const proModal = useProModal();
    const [messages, setMessages] = useState<ChatCompletionRequestMessage[]>([]);

    const form = useForm<z.infer<typeof fromSchema>>({
        resolver: zodResolver(fromSchema),
        defaultValues: {
            prompt: "",
        }
    });

    const isLoading = form.formState.isSubmitting;

    const onSubmit = async (values: z.infer<typeof fromSchema>) => {
        try {
            const userMessage: ChatCompletionRequestMessage = { 
                role: "user", 
                content: values.prompt 
            };
            const newMessages = [...messages, userMessage];
            
            const response = await axios.post('/api/conversation', { 
                messages: newMessages });

            setMessages((current) => [...current, userMessage, response.data]);
            
            form.reset();
          } catch (error: any) {
            if (error?.response?.status === 403) {
                proModal.onOpen();
            } else {
                toast.error("Something went wrong.");
            }
          } finally {
            router.refresh();
          }
    };

    const formatText = (text: string) => {
        // Convert "**text**" to bold text
        text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    
        // Move lines starting with '-' to a new line
        text = text.replace(/- /g, "<br>- ");
    
        // Split the text into paragraphs
        return text.split("\n\n").map(paragraph => `<p>${paragraph}</p>`).join("");
    };

    return (
        <div>
            <Heading 
                title="Conversation"
                description="This is the conversation page"
                icon={MessageSquare}
                iconColor="text-violet-500"
                bgColor="bg-violet-500/10"
            />
            <div className="px-4 lg:px-8">
                <div>
                    <Form {...form}>
                        <form 
                            onSubmit={form.handleSubmit(onSubmit)} 
                            className="rounded-lg border w-full p-4 px-3 md:px-6 focus-within:shadow-sm grid grid-cols-12 gap-2">
                            <FormField 
                                name="prompt"
                                render={({ field }) => (
                                    <FormItem className="col-span-12 lg:col-span-10">
                                        <FormControl className="m-0 p-0">
                                            <Input 
                                                className="border-0 outline-none focus-visible:ring-0 focus-visible:ring-transparent"
                                                disabled={isLoading}
                                                placeholder="Type a prompt"
                                                {...field}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <Button className="col-span-12 lg:col-span-2 w-full" disabled={isLoading}>
                                Generate
                            </Button>
                        </form>
                    </Form>
                </div>
                <div className="space-y-4 mt-4">
                    {isLoading && (
                        <div className="p-8 rounded-lg w-full flex items-center justify-center bg-muted">
                            <Loader />
                        </div>
                    )}
                    {messages.length === 0 && !isLoading && (
                        <Empty label="No conversation started." />
                    )}
                    <div className="flex flex-col gap-y-4">
                        {messages.map((message, index) => (
                            index % 2 === 0 && (
                                <div key={message.content}>
                                    <div 
                                        className={cn(
                                            "p-8 w-full flex items-start gap-x-8 rounded-lg",
                                            "bg-white border border-black/10"
                                        )}
                                    >
                                        <UserAvatar />
                                        <p className="text-sm">
                                            {messages[index].content}
                                        </p>
                                    </div>
                                    {index + 1 < messages.length && (
                                        <div 
                                            className={cn(
                                                "p-8 w-full flex items-start gap-x-8 rounded-lg",
                                                "bg-muted"
                                            )}
                                        >
                                            <BotAvatar />
                                            <div className="text-sm space-y-2" dangerouslySetInnerHTML={{ __html: formatText(messages[index + 1].content || "") }} />
                                        </div>
                                    )}
                                </div>
                            )
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ConversationPage;
