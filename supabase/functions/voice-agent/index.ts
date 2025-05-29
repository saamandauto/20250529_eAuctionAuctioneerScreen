// IMPORTANT: Don't import serve from deno.land, use the built-in Deno.serve instead

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Use the environment variable for the API key with a fallback to the value from .env
const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY") || 'sk_24f01843dd4beb09fbb4603fd8de764b19f1d718e87a1375';
const ELEVENLABS_DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Default voice, can be configured

// Improved helper function to convert array buffer to base64 without recursion
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 1024; // Process in chunks to avoid stack issues
  let binary = '';
  
  // Process in chunks to prevent stack overflow
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, Math.min(i + chunkSize, bytes.length));
    for (let j = 0; j < chunk.length; j++) {
      binary += String.fromCharCode(chunk[j]);
    }
  }
  
  return btoa(binary);
}

// Using the built-in Deno.serve instead of the imported serve
Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }
  
  try {
    // Check if API key is available
    if (!ELEVENLABS_API_KEY) {
      console.error("ELEVENLABS_API_KEY environment variable is not set");
      return new Response(
        JSON.stringify({ 
          error: "ElevenLabs API key is not configured. Please set the ELEVENLABS_API_KEY environment variable in your Supabase project." 
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Parse the request body - handle potential parsing errors
    let requestData;
    try {
      requestData = await req.json();
    } catch (e) {
      console.error("Failed to parse request body:", e);
      return new Response(
        JSON.stringify({ error: "Invalid request body format" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { text, voiceId } = requestData;
    const selectedVoiceId = voiceId || ELEVENLABS_DEFAULT_VOICE_ID;

    if (!text) {
      return new Response(
        JSON.stringify({ error: "Text parameter is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Limit text length to avoid large responses
    const truncatedText = text.length > 300 ? text.substring(0, 300) + "..." : text;
    console.log(`Calling ElevenLabs API with text: "${truncatedText}" and voice: ${selectedVoiceId}`);

    // Call the ElevenLabs API for text-to-speech conversion
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`ElevenLabs API error: ${response.status} - ${errorText}`);
      
      let errorMessage = `ElevenLabs API error: ${response.status}`;
      
      // Add more detailed error message for auth issues
      if (response.status === 401) {
        errorMessage = "ElevenLabs API authentication failed. Please check that your API key is valid and has not expired.";
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage }),
        {
          status: response.status,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Get audio data from ElevenLabs
    const audioArrayBuffer = await response.arrayBuffer();
    
    // Convert to base64 using the improved function
    const base64Audio = arrayBufferToBase64(audioArrayBuffer);
    
    return new Response(
      JSON.stringify({ data: base64Audio }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in voice-agent function:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});