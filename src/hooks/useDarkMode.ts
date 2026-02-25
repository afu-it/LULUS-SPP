"use client";

import { useMantineColorScheme } from "@mantine/core";

export type ThemeScheme = "light" | "dark" | "auto";

export function useDarkMode() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  const isDark = colorScheme === "dark";

  function toggle() {
    setColorScheme(isDark ? "light" : "dark");
  }

  function setTheme(theme: ThemeScheme) {
    setColorScheme(theme);
  }

  return { isDark, colorScheme, toggle, setTheme };
}
