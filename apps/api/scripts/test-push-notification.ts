/**
 * Test script to:
 * 1. Check registered push tokens in database
 * 2. Simulate a new vote and trigger notification
 *
 * Usage:
 *   cd apps/api
 *   npx tsx scripts/test-push-notification.ts
 *
 * Make sure .env.local exists with SUPABASE_URL and SUPABASE_SERVICE_KEY
 */

import * as dotenv from "dotenv";
import * as path from "path";

// Load .env.local
dotenv.config({ path: path.join(__dirname, "../.env.local") });

import { supabase } from "../lib/supabase";
import { Expo } from "expo-server-sdk";

async function checkPushTokens() {
  console.log("🔍 Checking registered push tokens...\n");

  const { data: tokens, error } = await supabase
    .from("push_tokens")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Error fetching tokens:", error);
    return;
  }

  if (!tokens || tokens.length === 0) {
    console.log("⚠️  No push tokens found in database.");
    return;
  }

  console.log(`✅ Found ${tokens.length} registered token(s):\n`);
  tokens.forEach((token, index) => {
    console.log(
      `${index + 1}. Token: ${token.expo_push_token.substring(0, 30)}...`
    );
    console.log(`   Topic: ${token.topic}`);
    if (token.deputy_acteur_ref) {
      console.log(`   Deputy: ${token.deputy_acteur_ref}`);
    }
    console.log(`   Created: ${token.created_at}`);
    console.log(`   Updated: ${token.updated_at}\n`);
  });

  return tokens;
}

async function simulateNewVote() {
  console.log("📊 Simulating a new vote notification...\n");

  // Get tokens with topic "all"
  const { data: tokens, error: tokensError } = await supabase
    .from("push_tokens")
    .select("expo_push_token")
    .eq("topic", "all");

  if (tokensError) {
    console.error("❌ Error fetching tokens:", tokensError);
    return;
  }

  const pushTokens = (tokens ?? [])
    .map((r: { expo_push_token: string }) => r.expo_push_token)
    .filter((t: string) => t && t.startsWith("ExponentPushToken["));

  if (pushTokens.length === 0) {
    console.log("⚠️  No tokens with topic 'all' found.");
    return;
  }

  console.log(
    `📤 Sending test notification to ${pushTokens.length} token(s)...\n`
  );

  const expo = new Expo();
  const title = "Test: Nouveau scrutin";
  const body =
    "Ceci est une notification de test pour vérifier que les notifications push fonctionnent.";

  const messages = pushTokens
    .filter((token: string) => Expo.isExpoPushToken(token))
    .map((token: string) => ({
      to: token,
      sound: "default" as const,
      title,
      body,
      data: { screen: "votes", test: true }
    }));

  if (messages.length === 0) {
    console.log("⚠️  No valid Expo push tokens found.");
    return;
  }

  try {
    let sent = 0;
    const chunks = expo.chunkPushNotifications(messages);

    for (const chunk of chunks) {
      const tickets = await expo.sendPushNotificationsAsync(chunk);

      tickets.forEach((ticket, index) => {
        if (ticket.status === "ok") {
          sent++;
          console.log(
            `✅ Notification sent successfully (chunk ${
              chunks.indexOf(chunk) + 1
            }, message ${index + 1})`
          );
        } else {
          console.error(`❌ Failed to send notification:`, ticket);
        }
      });
    }

    console.log(
      `\n✅ Successfully sent ${sent} notification(s) out of ${messages.length} attempt(s).`
    );
  } catch (error) {
    console.error("❌ Error sending notifications:", error);
  }
}

async function main() {
  console.log("🚀 Push Notification Test Script\n");
  console.log("=".repeat(50) + "\n");

  // Step 1: Check database
  await checkPushTokens();

  console.log("\n" + "=".repeat(50) + "\n");

  // Step 2: Simulate notification
  await simulateNewVote();

  console.log("\n" + "=".repeat(50));
  console.log("✨ Test complete!");
}

main().catch(console.error);
