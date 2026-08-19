import { Thread } from "@assistant-ui/react-ui";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useAssistenteRuntime } from "@/hooks/useAssistenteRuntime";
import { PageHeader } from "@/components/vademecum/PageHeader";
import { motion, AnimatePresence } from "framer-motion";
import { MarkdownTextPrimitive as MarkdownText } from "@assistant-ui/react-markdown";

import "@assistant-ui/react-ui/styles/index.css";

export default function AssistenteOverlayV2({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  const runtime = useAssistenteRuntime();

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[100] flex flex-col bg-background/95 backdrop-blur-md"
    >
      <PageHeader title="Horus (Nova Versão)" onBack={onClose} />
      
      <div className="flex-1 overflow-hidden h-full pb-4">
        <AssistantRuntimeProvider runtime={runtime}>
          <Thread 
            assistantMessage={{ components: { Text: MarkdownText } }}
          />
        </AssistantRuntimeProvider>
      </div>
    </motion.div>
  );
}
