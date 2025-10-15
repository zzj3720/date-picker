# Chrome AI Setup Guide

Chrome AI uses Google's built-in Gemini Nano model to provide local, offline AI capabilities directly in the browser.

## Prerequisites

- **Chrome Version**: 127 or higher (Dev or Canary channel recommended)
- **Hardware Requirements**: 
  - GPU with at least 4GB VRAM
  - Sufficient disk space for the model (~1.7GB)

## Setup Steps

### 1. Download Chrome Dev or Canary

If you haven't already, download one of these Chrome versions:
- [Chrome Dev](https://www.google.com/chrome/dev/)
- [Chrome Canary](https://www.google.com/chrome/canary/)

### 2. Enable Feature Flag

Open Chrome and navigate to the following URL to enable the required flag:

#### Enable Prompt API (Latest)
1. Go to: `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input`
2. Set to: **Enabled**

**Note**: This is the latest API flag that replaces the older flags. If you don't see this flag, make sure you're using Chrome 127+ (Dev or Canary).

### 3. Restart Chrome

After enabling both flags, restart Chrome completely.

### 4. Check Model Status

1. Navigate to: `chrome://on-device-internals`
2. Check the **Model Status** tab for any errors
3. The model should download automatically if your device meets the requirements

**Note**: The Gemini Nano model (approximately 1.7GB - 22GB total space needed) should download automatically. If there are issues, you can check `chrome://components/` and look for "Optimization Guide On Device Model".

### 5. Verify Installation

Open Chrome DevTools (F12) and run:

```javascript
await LanguageModel.availability()
```

Expected response:
```javascript
{ available: "readily", defaultTopK: 3, maxTopK: 8, defaultTemperature: 0.8 }
```

If you see `available: "readily"`, Chrome AI is ready to use!

## Usage in the Date Picker

1. Open the date picker application
2. Click the **Settings** button (⚙️)
3. Select **Chrome AI** from the provider tabs
4. Check the status indicator:
   - ✅ **Green**: Ready to use
   - ⚠️ **Yellow**: Model needs to be downloaded
   - ❌ **Red**: Not available or unsupported

5. Configure optional parameters:
   - **Temperature**: Controls randomness (0-1, default: 0.8)
   - **Top K**: Number of tokens to consider (1-8, default: 3)

6. Save configuration and start using natural language date inputs!

## Example Queries

Once configured, you can use natural language to input dates:

- "tomorrow at 3pm"
- "next Monday"
- "in 2 weeks"
- "December 25th at noon"
- "first day of next month"

## Troubleshooting

### "Chrome AI is not available"
- Ensure you're using Chrome 127+ (preferably 140+)
- Verify the feature flag `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input` is enabled
- Restart Chrome after enabling the flag
- Check DevTools console: `typeof LanguageModel` should not be "undefined"

### "Model needs to be downloaded"
- Go to `chrome://on-device-internals` and check the Model Status tab
- Ensure you have at least 22 GB free disk space
- Check your device meets hardware requirements (GPU >4GB VRAM or 16GB+ RAM)
- The model should download automatically
- Wait a few minutes and restart Chrome if needed

### "Not available on this device"
- Check GPU specifications (needs 4GB+ VRAM)
- Verify sufficient disk space (~2GB free)
- Try on a different device

## Benefits of Chrome AI

✅ **Privacy**: All processing happens locally, no data sent to servers
✅ **Speed**: No network latency, instant responses
✅ **Offline**: Works without internet connection
✅ **Free**: No API keys or usage fees required
✅ **Reliable**: Not affected by API rate limits or outages

## Limitations

- Only available in Chrome 127+ with specific flags enabled
- Requires significant disk space and GPU resources
- Model capabilities may be more limited than cloud-based LLMs
- Currently in experimental/preview phase

## Learn More

- [Chrome Built-in AI Documentation](https://developer.chrome.com/docs/ai/built-in)
- [Gemini Nano Overview](https://deepmind.google/technologies/gemini/nano/)
- [Chrome AI Prompt API](https://github.com/explainers-by-googlers/prompt-api)

