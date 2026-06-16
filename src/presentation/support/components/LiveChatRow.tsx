"use client";

import { MessagesSquare } from "lucide-react";
import { Icon } from "@/src/presentation/design-system";
import { SupportRow } from "./SupportRow";

/**
 * Live Chat is the one interactive row (an action, not a link), so it's the only
 * client island on an otherwise server-rendered screen.
 */
export function LiveChatRow() {
  const handleClick = () => {
    // TODO: open the live-chat widget once one is integrated.
  };

  return (
    <SupportRow icon={<Icon icon={MessagesSquare} size="sm" />} onClick={handleClick}>
      Live Chat
    </SupportRow>
  );
}
