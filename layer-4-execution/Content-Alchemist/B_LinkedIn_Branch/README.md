# Workflow B: LinkedIn Branch

## 📋 Role
Generates a specialized visual LinkedIn post from the CEO ghostwriter's output.

## 🔄 Flow
**Receive Post Data** -> **Build DALL-E Prompt** -> **Generate Image** -> **Upload to Drive** -> **Log to Google Sheets**

## 💡 Why this way?
- **AI Visuals**: Includes an automated prompt engineering step to ensure DALL-E produces relevant, professional graphics without manual input.
- **Fail-Safe**: Image generation is separate from text generation, allowing the workflow to survive API timeouts.
