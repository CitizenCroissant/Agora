/**
 * Tag scrutins with thematic tags based on keyword matching
 */

import { supabase } from "./supabase";
import { getTagKeywords } from "./tag-keywords";

/**
 * Tag a scrutin based on its title and object description
 */
export async function tagScrutin(
  scrutinId: string,
  titre: string,
  objetLibelle?: string | null,
): Promise<void> {
  // Combine text sources for analysis
  const textToAnalyze = [titre, objetLibelle]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // Remove accents for better matching

  // Get all tags from database
  const { data: tags, error: tagsError } = await supabase
    .from("thematic_tags")
    .select("id, slug");

  if (tagsError) {
    console.error("Error fetching thematic tags:", tagsError);
    return;
  }

  if (!tags || tags.length === 0) {
    console.warn("No thematic tags found in database. Run migration first.");
    return;
  }

  // Match keywords for each tag
  const tagsToInsert: Array<{
    scrutin_id: string;
    tag_id: string;
    source: string;
    confidence: number;
  }> = [];

  for (const tag of tags) {
    const keywords = getTagKeywords(tag.slug);
    const matches = keywords.filter((keyword) => {
      const normalizedKeyword = keyword
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      return textToAnalyze.includes(normalizedKeyword);
    });

    if (matches.length > 0) {
      // Calculate confidence based on number of matches and keyword length
      // Longer/more specific keywords get higher weight
      const weightedMatches = matches.reduce((sum, keyword) => {
        // Longer keywords are more specific and get higher weight
        const weight = keyword.length > 10 ? 1.5 : keyword.length > 5 ? 1.2 : 1.0;
        return sum + weight;
      }, 0);

      // Confidence ranges from 0.5 (single short match) to 1.0 (multiple long matches)
      const confidence = Math.min(0.5 + weightedMatches * 0.1, 1.0);

      tagsToInsert.push({
        scrutin_id: scrutinId,
        tag_id: tag.id,
        source: "auto",
        confidence: Math.round(confidence * 100) / 100, // Round to 2 decimals
      });
    }
  }

  // Insert tags (delete old ones first, then insert new)
  if (tagsToInsert.length > 0) {
    // Delete existing tags for this scrutin
    await supabase
      .from("scrutin_thematic_tags")
      .delete()
      .eq("scrutin_id", scrutinId);

    // Insert new tags
    const { error: insertError } = await supabase
      .from("scrutin_thematic_tags")
      .insert(tagsToInsert);

    if (insertError) {
      console.error(
        `Error inserting tags for scrutin ${scrutinId}:`,
        insertError,
      );
    } else {
      console.log(
        `Tagged scrutin ${scrutinId} with ${tagsToInsert.length} tag(s)`,
      );
    }
  }
}

/**
 * Remove all tags for a scrutin (useful for re-tagging)
 */
export async function removeScrutinTags(scrutinId: string): Promise<void> {
  await supabase
    .from("scrutin_thematic_tags")
    .delete()
    .eq("scrutin_id", scrutinId);
}
