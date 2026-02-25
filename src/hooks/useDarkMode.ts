"use client";

import { useMantineColorScheme } from "@mantine/core";

export function useDarkMode() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  const isDark = colorScheme === "dark";

  function toggle() {
    setColorScheme(isDark ? "light" : "dark");
  }

  return { isDark, toggle };
}
