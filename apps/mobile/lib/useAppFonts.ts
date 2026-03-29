import { useFonts } from "expo-font";
import {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold
} from "@expo-google-fonts/figtree";
import { Sora_600SemiBold, Sora_700Bold } from "@expo-google-fonts/sora";

/**
 * Loads Sora (headings) and Figtree (body) to match web Civic Warmth typography.
 */
export function useAppFonts(): [boolean, Error | null] {
  return useFonts({
    Sora_600SemiBold,
    Sora_700Bold,
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold
  });
}
