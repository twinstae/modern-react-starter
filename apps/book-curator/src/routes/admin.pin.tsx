import { createFileRoute } from "@tanstack/react-router";

import { generateOwnerPin } from "../admin-api.ts";
import { OwnerPinGenerator } from "../components/owner-pin-generator.tsx";
import { Section } from "../ui/index.ts";
import { messageOf } from "./-admin/view.tsx";

export const Route = createFileRoute("/admin/pin")({
  component: PinPage,
});

function PinPage() {
  return (
    <Section mt="6" gap="4">
      <OwnerPinGenerator
        onGenerate={async () => {
          try {
            return { pin: await generateOwnerPin() };
          } catch (error) {
            return { error: messageOf(error) };
          }
        }}
      />
    </Section>
  );
}
