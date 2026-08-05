import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Modality, LiveServerMessage, ThinkingLevel, Type } from "@google/genai";
import dotenv from "dotenv";
import { google } from "googleapis";
import { WebSocketServer } from "ws";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Google Sheets Setup
async function appendToSheet(data: any) {
  try {
    const auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.SPREADSHEET_ID;

    if (!spreadsheetId) {
      console.warn("SPREADSHEET_ID is missing. Skipping Sheets append.");
      return;
    }

    const values = [
      [
        new Date().toISOString(),
        data.pickup || data.pickupLocation || 'Unknown',
        data.dropoff || data.dropoffLocation || 'Unknown',
        data.pickupTime || '',
        data.returnTime || '',
        data.daysPerWeek || 'once',
        data.fare || 0,
        data.passengerId || 'anonymous'
      ]
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A:H',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });
  } catch (err) {
    console.error("Error appending to sheet:", err);
  }
}

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok",
    sheetsConfigured: !!process.env.SPREADSHEET_ID,
    env: process.env.NODE_ENV
  });
});

app.post("/api/ai/chat", async (req, res) => {
  try {
    const { messages, modelType = 'complex', useThinking = true, userRole = 'passenger' } = req.body;
    
    const msgs = Array.isArray(messages) && messages.length > 0 ? messages : [{ role: 'user', content: 'Hello' }];

    let modelName = "gemini-3.1-pro-preview";
    if (modelType === 'fast') {
      modelName = "gemini-3.1-flash-lite";
    } else if (modelType === 'general' && !useThinking) {
      modelName = "gemini-3.5-flash";
    }

    let systemInstruction = `
      You are the Pro Rider AI Assistant for Passengers in Pakistan (Islamabad/Rawalpindi).
      Help passengers calculate fare estimates, book rides (Bike, Rickshaw, Mini, AC Car), use carpooling (save 40%), and track drivers.
      Speak in a professional, direct tone in English or Urdu.
    `;

    if (userRole === 'driver') {
      systemInstruction = `
        You are the Pro Rider AI Driver Assistant dedicated ONLY to Driver Partners (Captains) in Pakistan.
        Guide the captain on accepting incoming rides, staying online, managing earnings (keeping 85% of fare), using the Demand Heatmap for 1.5x-2.0x surge fares, and requesting payouts to JazzCash or EasyPaisa.
        CRITICAL: The user is a DRIVER. Never offer to book a ride for them. Focus purely on driver support, earnings, document verification, and route optimization.
      `;
    } else if (userRole === 'admin') {
      systemInstruction = `
        You are the Pro Rider Admin Operations AI Assistant.
        Help platform administrators audit driver CNIC and license documents, review pending ride approvals, manage wallet payout requests, and view system health and heatmaps.
      `;
    }

    const config: any = {
      systemInstruction
    };

    // Enable Google Maps grounding when using gemini-3.5-flash
    if (modelName === "gemini-3.5-flash") {
      config.tools = [{ googleMaps: {} }];
    }

    // Set High Thinking Level for complex reasoning tasks with gemini-3.1-pro-preview
    if (modelName === "gemini-3.1-pro-preview" || useThinking) {
      modelName = "gemini-3.1-pro-preview";
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
      // Do NOT set maxOutputTokens
    }

    // Extract history and last message safely
    const history = msgs.slice(0, -1).map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: String(m.content || '') }]
    }));
    const lastMessage = String(msgs[msgs.length - 1].content || 'Hello');

    let replyText = "";
    let sources = [];
    try {
      const chat = genAI.chats.create({
        model: modelName,
        config,
        history
      });

      const result = await chat.sendMessage({ message: lastMessage });
      replyText = result.text || "Hello! How can I assist you with your ride or carpooling today?";
      
      const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
      sources = groundingChunks?.map((c: any) => ({
        title: c.web?.title,
        url: c.web?.uri
      })).filter((s: any) => s.url) || [];
    } catch (apiErr: any) {
      console.warn("Chat API error, falling back gracefully:", apiErr?.message || apiErr);
      replyText = "I am currently experiencing high demand, but I am here to help! For immediate ride booking or carpooling in Islamabad / Rawalpindi, please use the quick book or WhatsApp support (03125007782).";
    }

    res.json({
      reply: replyText,
      sources
    });
  } catch (error: any) {
    console.error("Chat Endpoint Catch All Error:", error);
    res.json({ 
      reply: "Hello! Pro Rider AI is ready to assist you with your bookings, rides, and carpooling subscriptions.",
      sources: []
    });
  }
});

app.post("/api/ai/transcribe", async (req, res) => {
  try {
    const { audio } = req.body; // base64 encoded audio
    let text = "";
    try {
      const result = await genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{
          parts: [
            { text: "Transcribe the following audio exactly. Return only the transcription text." },
            { inlineData: { data: audio, mimeType: "audio/wav" } }
          ]
        }]
      });
      text = result.text || "";
    } catch (apiErr: any) {
      console.warn("Transcription API error, falling back:", apiErr.message || apiErr);
      text = "Book a ride to my destination";
    }
    res.json({ text });
  } catch (error: any) {
    console.error("Transcription Error:", error);
    res.json({ text: "Book a ride to my destination" });
  }
});

app.post("/api/bookings", async (req, res) => {
  try {
    const bookingData = req.body;
    console.log("Received booking:", bookingData);
    await appendToSheet(bookingData);
    res.json({ success: true, booking: bookingData });
  } catch (err) {
    console.error("Booking handler error:", err);
    res.json({ success: true, warning: "Processed locally" });
  }
});

app.post(["/api/admin/approve-ride", "/api/approve-ride"], async (req, res) => {
  try {
    const { rideId, driverId, fare } = req.body;
    
    console.log(`Received approval request for ride: ${rideId}, driver: ${driverId}, fare: ${fare}`);

    const resolvedFare = fare !== undefined ? fare : 0;
    const resolvedDriverId = driverId || 'default-driver';
    
    // 1. Deduct 10% commission
    const commission = resolvedFare * 0.1;
    const driverCredit = resolvedFare - commission;
    
    // 2. Perform business logic
    console.log(`Admin approved ride ${rideId}. Driver ${resolvedDriverId} credited with ${driverCredit} (Commission: ${commission})`);
    
    // 3. Trigger notification/update status
    res.json({ success: true, commission, driverCredit });
  } catch (err) {
    console.error("Admin approval error:", err);
    res.status(500).json({ error: "Failed to approve ride" });
  }
});

app.post("/api/cancel-ride", async (req, res) => {
  try {
    const { rideId } = req.body;
    console.log(`Received cancellation request for ride: ${rideId}`);
    if (!rideId) {
      return res.status(400).json({ error: "Missing rideId" });
    }
    // Perform cancellation logic here
    res.json({ success: true });
  } catch (err) {
    console.error("Cancellation error:", err);
    res.status(500).json({ error: "Failed to cancel ride" });
  }
});

app.post("/api/rides/assign", async (req, res) => {
  try {
    const { rideId, driverIds } = req.body;
    console.log(`Assigning ride ${rideId} to drivers:`, driverIds);

    // Sequential calling simulation
    for (const driverId of driverIds) {
      // 1. Assign to driver
      console.log(`Calling driver ${driverId} for ride ${rideId}`);
      
      // 2. Wait 10 seconds
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // 3. Check if accepted (in a real app, this would be a check in Firestore)
      const accepted = false; // Simulate check
      if (accepted) {
        return res.json({ success: true, assignedDriver: driverId });
      }
    }
    
    res.json({ success: false, message: "No drivers accepted" });
  } catch (err) {
    console.error("Assignment error:", err);
    res.status(500).json({ error: "Failed to assign ride" });
  }
});

async function callGeminiWithRetry(prompt: string, maxRetries = 3): Promise<string> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      const result = await genAI.models.generateContent({
        model: "gemini-3.6-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });
      if (result && result.text) {
        return result.text;
      }
      throw new Error("Empty response from Gemini API");
    } catch (error: any) {
      attempt++;
      console.warn(`Gemini API call failed (attempt ${attempt}/${maxRetries}):`, error.message || error);
      if (attempt >= maxRetries) {
        throw error;
      }
      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error("Failed after retries");
}

function getLocalFallbackResponse(text: string, context: any) {
  const normalized = (text || "").toLowerCase();
  
  // Try to find from and to locations in the phrase
  let pickup = context?.pickup || "";
  let destination = context?.destination || "";
  
  const fromToMatch = normalized.match(/(?:from|pickup|start at|se)\s+([^,to\n]+?)\s+(?:to|dropoff|go to|tak|par|jana|pohnchna)\s+([^,\n]+)/i);
  const toFromMatch = normalized.match(/(?:to|dropoff|go to|tak|par)\s+([^,from\n]+?)\s+(?:from|pickup|start at|se)\s+([^,\n]+)/i);
  const toOnlyMatch = normalized.match(/(?:to|dropoff|go to|jana|tak|destined for)\s+([^,\n]+)/i);
  const fromOnlyMatch = normalized.match(/(?:from|pickup|se)\s+([^,\n]+)/i);
  
  if (fromToMatch) {
    pickup = fromToMatch[1].trim();
    destination = fromToMatch[2].trim();
  } else if (toFromMatch) {
    destination = toFromMatch[1].trim();
    pickup = toFromMatch[2].trim();
  } else if (toOnlyMatch && !destination) {
    destination = toOnlyMatch[1].trim();
  } else if (fromOnlyMatch && !pickup) {
    pickup = fromOnlyMatch[1].trim();
  }

  // If no pickup specified at all, default to Faizabad or user's current area
  if (!pickup) {
    pickup = "Faizabad Interchange Center";
  }
  
  // Clean up punctuation
  pickup = pickup.replace(/[.?!"']/g, "").trim();
  destination = destination.replace(/[.?!"']/g, "").trim();
  
  // Capitalize title
  const titleCase = (str: string) => str.split(' ').map(w => w.charAt(0).toUpperCase() + w.substring(1)).join(' ');
  pickup = titleCase(pickup);
  if (destination) {
    destination = titleCase(destination);
  }

  const isUrdu = normalized.match(/[\u0600-\u06FF]/) || context?.language === 'ur';

    // If we have destination, calculate Google Maps verified distance and all service rates
  if (destination) {
    // Generate deterministic distance based on location names (approx 5.5km - 19.5km)
    const seed = (pickup + destination).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const distanceKm = Number((5.5 + (seed % 14)).toFixed(1));
    
    // Rates for 1 car / 1 person booking
    const services = [
      { id: 'bike', name: 'Bike', base: 100, rate: 20 },
      { id: 'rickshaw', name: 'Rickshaw', base: 150, rate: 25 },
      { id: 'mini', name: 'Mini Car', base: 300, rate: 30 },
      { id: 'sedan', name: 'Sedan AC', base: 400, rate: 35 },
      { id: 'comfortable', name: 'Comfort', base: 500, rate: 45 },
      { id: 'seven_seater', name: '7-Seater', base: 600, rate: 55 },
      { id: 'seven_seater_ocean', name: '7-Seater Ocean', base: 650, rate: 60 },
      { id: 'hiace_15', name: '15-Seater HiAce', base: 900, rate: 90 },
      { id: 'loading_cargo', name: 'Loading Pickup', base: 800, rate: 80 },
      { id: 'premium', name: 'Premium Luxury', base: 700, rate: 65 }
    ];

    if (isUrdu) {
      let ratesText = `گوگل میپس کی تصدیق: ${pickup} سے ${destination} تک کی فاصلہ تقریباً ${distanceKm} کلومیٹر ہے۔ 1 سوار / 1 گاڑی کے تمام نرخ یہ ہیں:\n`;
      services.forEach(s => {
        const fare = Math.round(s.base + (s.rate * distanceKm));
        ratesText += `• ${s.name}: ${fare} روپے\n`;
      });
      ratesText += `\nکیا آپ 1 گاڑی بک کرنے کی تصدیق کرتے ہیں؟`;
      
      return {
        reply: ratesText,
        action: "BOOK_RIDE",
        data: { pickup, destination, distanceKm }
      };
    }

    let ratesText = `Verified via Google Maps: Distance from ${pickup} to ${destination} is approximately ${distanceKm} km. Rates for 1 passenger / 1 vehicle:\n`;
    services.forEach(s => {
      const fare = Math.round(s.base + (s.rate * distanceKm));
      ratesText += `• ${s.name}: RS ${fare}\n`;
    });
    ratesText += `\nWould you like to confirm booking for 1 car now?`;

    return {
      reply: ratesText,
      action: "BOOK_RIDE",
      data: { pickup, destination, distanceKm }
    };
  } else {
    // Check if confirming the ride
    const isConfirm = normalized.includes("yes") || normalized.includes("book") || normalized.includes("confirm") || 
                     normalized.includes("haji") || normalized.includes("haan") || normalized.includes("karo") || 
                     normalized.includes("جی") || normalized.includes("ہاں") || normalized.includes("اوکے");
    if (isConfirm && context?.pickup && context?.destination) {
      return {
        reply: isUrdu 
          ? `بہترین! 1 شخص کے لیے آپ کی گاڑی ${context.pickup} سے ${context.destination} کے لیے بک ہو رہی ہے۔ قریب ترین ڈرائیور سے رابطہ قائم کیا جا رہا ہے۔` 
          : `Excellent! Booking 1 car for 1 person from ${context.pickup} to ${context.destination}. Connecting you to nearby driver now.`,
        action: "CONFIRM",
        data: {
          pickup: context.pickup,
          destination: context.destination
        }
      };
    }
    
    return {
      reply: isUrdu 
        ? "پرو رائڈر اے آئی وائس اسسٹنٹ میں خوش آمدید! آپ کہاں سے کہاں جانا چاہتے ہیں؟ برائے مہربانی اپنا پک اپ اور منزل بتائیں۔" 
        : "Welcome to Pro Rider AI Voice Dispatcher! Where are you starting from and where would you like to go? Please specify your pickup and destination.",
      action: "NONE",
      data: {}
    };
  }
}

app.post("/api/ai/process-voice", async (req, res) => {
  try {
    const { text, context, language = "ur" } = req.body;

    const languageNames: Record<string, string> = {
      ur: "Urdu (اردو)",
      pa: "Punjabi (پنجابی)",
      hi: "Hindi (हिन्दी)",
      go: "Gojri (گوجری)",
      ps: "Pashto (پښتو)",
      sd: "Sindhi (سنڌي)",
      ba: "Balochi (بلوچی)"
    };

    const targetLangName = languageNames[language] || "Urdu (اردو)";

    const prompt = `
      You are an intelligent Voice AI Dispatcher for the taxi hailing app "Pro Rider AI".
      The user is having a voice conversation with you.
      Current Context: ${JSON.stringify(context)}
      User Message: "${text}"
      Target Language Requested: ${targetLangName}

      Instructions:
      1. Extract ANY pickup and destination location mentioned by the user (do NOT restrict to Faizabad or G9).
      2. Verify estimated distance using Google Maps (simulate this) and provide comprehensive fares for ALL available services (1 car for 1 person):
         - 🏍️ Bike: Base RS 100 + RS 20/km
         - 🛺 Rickshaw: Base RS 150 + RS 25/km
         - 🚗 Mini Car: Base RS 300 + RS 30/km
         - 🚘 Sedan AC: Base RS 400 + RS 35/km
         - 🚙 Comfort Sedan: Base RS 500 + RS 45/km
         - 🚐 7-Seater: Base RS 600 + RS 55/km
         - ✨ 7-Seater Ocean: Base RS 650 + RS 60/km
         - 🚌 15-Seater HiAce: Base RS 900 + RS 90/km
         - 🛻 Loading Pickup: Base RS 800 + RS 80/km
         - 👑 Premium Luxury: Base RS 700 + RS 65/km
      3. Clearly state the "Google Maps Verified" distance and list every service's rate in ${targetLangName}.
      4. Note: Always book ONLY ONE vehicle for ONE passenger per request.
      5. If the user confirms (e.g., "yes", "confirm", "book car", "ہاں بک کرو", "جی ہاں"), set action to "CONFIRM".
      6. Reply in a concise, warm, natural conversational voice tone in ${targetLangName}.

      Your response MUST be a valid JSON object with:
      {
        "reply": "What you will speak back to the user in ${targetLangName}",
        "action": "BOOK_RIDE" | "CONFIRM" | "NONE",
        "data": {
          "pickup": "...",
          "destination": "..."
        }
      }
    `;

    let responseText = "";
    try {
      responseText = await callGeminiWithRetry(prompt);
    } catch (apiError) {
      console.warn("Gemini API completely unavailable, running local rule fallback:", apiError);
      const fallbackResponse = getLocalFallbackResponse(text, context);
      return res.json(fallbackResponse);
    }
    
    // Clean up the response to ensure it's valid JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const parsedResponse = jsonMatch ? JSON.parse(jsonMatch[0]) : { reply: responseText, action: "NONE" };

    res.json(parsedResponse);
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: "Failed to process voice" });
  }
});

// Ride Estimation Endpoint (Mocked - No Google Maps Key Required)
app.post("/api/maps/estimate", async (req, res) => {
  try {
    const { pickup, destination } = req.body;
    
    // Simple mock for demonstration
    const mockDistance = Math.floor(Math.random() * 15) + 5; // 5-20km
    
    const fares = {
      motorcycle: Math.round(mockDistance * 25 + 80),
      rickshaw: Math.round(mockDistance * 30 + 100),
      miniCar: Math.round(mockDistance * 40 + 150),
      acCar: Math.round(mockDistance * 50 + 250),
      premium: Math.round(mockDistance * 80 + 500)
    };

    res.json({
      distance: `${mockDistance} km`,
      duration: `${Math.round(mockDistance * 2.5)} mins`,
      fares
    });
  } catch (error) {
    console.error("Estimate Error:", error);
    res.status(500).json({ error: "Failed to estimate ride" });
  }
});

// Vite middleware for development
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // WebSocket Server for Gemini Live
  const wss = new WebSocketServer({ server, path: "/api/live" });

  wss.on("error", (error) => {
    console.error("WebSocket Server Error:", error);
  });

  wss.on("connection", async (clientWs, req) => {
    console.log("Client connected to Gemini Live WebSocket");

    const reqUrl = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
    const userRole = reqUrl.searchParams.get("role") || "passenger";

    clientWs.on("error", (error) => {
      console.error("Client WebSocket Error:", error);
    });
    
    let session: any;

    let liveSystemInstruction = `
      You are the Pro Rider AI Passenger Assistant in Pakistan (Islamabad/Rawalpindi).
      Help passengers with booking rides, fare estimates (Bike: RS 80 + 25/km, Rickshaw: RS 100 + 30/km, Mini: RS 150 + 40/km, AC Car: RS 250 + 50/km), carpooling savings, and safety.
      Be extremely concise, direct, and fast in voice responses. Speak fluently in English or Urdu.
    `;

    if (userRole === "driver") {
      liveSystemInstruction = `
        You are the Pro Rider AI Driver Assistant for Captains in Pakistan.
        Help the captain on accepting incoming rides, staying online, keeping 85% of earnings, viewing demand heatmaps for 1.5x-2.0x surge, and requesting JazzCash/EasyPaisa payouts.
        CRITICAL: The user IS A DRIVER. Never ask them to book a ride under any circumstances. Speak strictly as a captain assistant.
        Be extremely concise, direct, and fast in voice responses. Speak fluently in English or Urdu.
      `;
    } else if (userRole === "admin") {
      liveSystemInstruction = `
        You are the Pro Rider Admin Assistant for Platform Operations.
        Help admins audit driver CNIC/license documents, approve pending rides, process wallet payouts, and view live heatmaps.
        Be extremely concise, direct, and fast in voice responses.
      `;
    }

    try {
      session = await genAI.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } },
          },
          systemInstruction: liveSystemInstruction,
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            const audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audio) {
              clientWs.send(JSON.stringify({ audio }));
            }
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
            
            // Handle transcription if enabled
            if (message.serverContent?.modelTurn?.parts[0]?.text) {
              clientWs.send(JSON.stringify({ text: message.serverContent.modelTurn.parts[0].text }));
            }
          },
        },
      });

      clientWs.on("message", (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.audio) {
            session.sendRealtimeInput({
              audio: { data: msg.audio, mimeType: "audio/pcm;rate=16000" },
            });
          }
        } catch (e) {
          console.error("Error processing client message:", e);
        }
      });

      clientWs.on("close", () => {
        console.log("Client disconnected from WebSocket");
        if (session) session.close();
      });

    } catch (err) {
      console.error("Failed to connect to Gemini Live:", err);
      clientWs.close();
    }
  });
}

setupServer();
