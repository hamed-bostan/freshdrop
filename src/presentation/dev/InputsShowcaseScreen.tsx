import { FieldGuide } from "./FieldGuide";
import { ShowcaseSection } from "./ShowcaseSection";
import { FieldUsage } from "./usages/FieldUsage";
import { InputUsage } from "./usages/InputUsage";
import { OtpInputUsage } from "./usages/OtpInputUsage";
import { PasswordInputUsage } from "./usages/PasswordInputUsage";
import { TextareaUsage } from "./usages/TextareaUsage";

/** Kitchen-sink page: each control shown across the labelling modes. */
export function InputsShowcaseScreen() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-10 px-6 py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-heading-h2 text-foreground">Inputs</h1>
        <p className="text-body-b10 text-muted-foreground">
          Each control shown across the labelling modes — static label, placeholder, and floating label.
        </p>
      </header>

      <FieldGuide />

      <ShowcaseSection title="Input" description="The base control — static label, placeholder, and floating.">
        <InputUsage />
      </ShowcaseSection>

      <ShowcaseSection title="PasswordInput" description="Input + show/hide toggle — all three modes.">
        <PasswordInputUsage />
      </ShowcaseSection>

      <ShowcaseSection title="Textarea" description="Multi-line control — static label or placeholder (no floating).">
        <TextareaUsage />
      </ShowcaseSection>

      <ShowcaseSection title="OTPInput" description="Segmented one-time-code entry.">
        <OtpInputUsage />
      </ShowcaseSection>

      <ShowcaseSection title="Field" description="Headless a11y wrapper — description + error wiring for custom controls.">
        <FieldUsage />
      </ShowcaseSection>
    </div>
  );
}
