import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { FontPicker } from "../components/font-picker.tsx";
import {
  DEFAULT_FONT_ID,
  readFontPreference,
  saveFontPreference,
  type FontId,
} from "../lib/font-preference.ts";
import { Section } from "../ui/index.ts";

export const Route = createFileRoute("/admin/font")({
  component: FontPage,
});

function FontPage() {
  const [font, setFont] = useState<FontId>(DEFAULT_FONT_ID);

  useEffect(() => {
    setFont(readFontPreference());
  }, []);

  return (
    <Section mt="6" gap="4">
      <FontPicker
        value={font}
        onChange={(id) => {
          setFont(id);
          saveFontPreference(id);
        }}
      />
    </Section>
  );
}
