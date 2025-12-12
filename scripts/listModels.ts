import "dotenv/config";

const { GEMINI_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY } = process.env;
const apiKey = GOOGLE_GENERATIVE_AI_API_KEY || GEMINI_API_KEY;

if (!apiKey) {
  console.error("❌ Missing GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY in .env file");
  process.exit(1);
}

async function listAvailableModels() {
  try {
    console.log("🔍 Fetching available models from Google AI Studio...\n");

    // Use the REST API directly
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const models = data.models || [];

    console.log("✅ Available Models:\n");
    console.log("=".repeat(80));

    if (models && models.length > 0) {
      // Filter models that support generateContent (for chat)
      const chatModels = models.filter((model: any) =>
        model.supportedGenerationMethods?.includes('generateContent') ||
        model.supportedGenerationMethods?.includes('streamGenerateContent')
      );

      console.log(`\n📊 Total models found: ${models.length}`);
      console.log(`💬 Models supporting generateContent: ${chatModels.length}\n`);

      if (chatModels.length > 0) {
        console.log("🎯 Recommended models for chat (support generateContent):\n");
        chatModels.forEach((model: any, index: number) => {
          console.log(`${index + 1}. ${model.name}`);
          console.log(`   Display Name: ${model.displayName || 'N/A'}`);
          console.log(`   Description: ${model.description || 'N/A'}`);
          console.log(`   Supported Methods: ${model.supportedGenerationMethods?.join(', ') || 'N/A'}`);
          console.log(`   Input Token Limit: ${model.inputTokenLimit || 'N/A'}`);
          console.log(`   Output Token Limit: ${model.outputTokenLimit || 'N/A'}`);
          console.log("");
        });

        // Extract model identifiers (without "models/" prefix)
        console.log("\n📝 Model identifiers to use in code:\n");
        chatModels.forEach((model: any) => {
          const modelId = model.name?.replace('models/', '') || model.name;
          console.log(`   - ${modelId}`);
        });
      } else {
        console.log("⚠️  No models found that support generateContent");
      }

      console.log("\n" + "=".repeat(80));
      console.log("\n📋 All available models:\n");
      models.forEach((model: any, index: number) => {
        console.log(`${index + 1}. ${model.name}`);
      });
    } else {
      console.log("⚠️  No models returned from API");
      console.log("   This might indicate:");
      console.log("   - API key doesn't have access to models");
      console.log("   - Billing not enabled");
      console.log("   - Account restrictions");
    }

  } catch (error: any) {
    console.error("\n❌ Error fetching models:", error.message);
    if (error.message?.includes('401')) {
      console.error("\n⚠️  Authentication failed. Check your API key.");
    } else if (error.message?.includes('403')) {
      console.error("\n⚠️  Access forbidden. Check your API permissions and billing status.");
    }
    console.error("\nFull error:", error);
    process.exit(1);
  }
}

listAvailableModels();

