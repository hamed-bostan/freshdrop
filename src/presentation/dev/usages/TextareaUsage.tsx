"use client";

import * as React from "react";
import { TextField, Textarea } from "@/src/presentation/design-system";

/**
 * <Textarea /> — multi-line control. Supports static label and placeholder, but
 * NOT a floating label (a label floating over multi-line content doesn't apply).
 */
export function TextareaUsage() {
  const [labelled, setLabelled] = React.useState("");
  const [placeholderOnly, setPlaceholderOnly] = React.useState("");
  const max = 200;

  return (
    <div className="flex flex-col gap-10">
      <div>
        <p className="mb-5 text-body-b11 text-primary">Static label:</p>
        <TextField label="Bio">
          {(control) => (
            <Textarea
              {...control}
              placeholder="Tell us about yourself"
              rows={3}
              value={labelled}
              onChange={(e) => setLabelled(e.target.value)}
            />
          )}
        </TextField>
      </div>

      <div>
        <p className="mb-3 text-body-b11 text-primary">Placeholder (label-less — needs aria-label):</p>
        <Textarea
          placeholder="Tell us about yourself"
          aria-label="Bio"
          rows={3}
          maxLength={max}
          value={placeholderOnly}
          onChange={(e) => setPlaceholderOnly(e.target.value)}
        />
      </div>

      <div>
        <p className="mb-3 text-body-b11 text-primary">Floating label — not supported</p>
        <p className="text-body-b10 text-muted-foreground">
          Textarea is static-label only. A floating label over multi-line content doesn&apos;t apply, so{" "}
          <code>FloatingField</code> doesn&apos;t accept it.
        </p>
      </div>
    </div>
  );
}
