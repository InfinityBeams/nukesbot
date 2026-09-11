const COMMAND_NAME = "send";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Basic test
    if (request.method === "GET" && url.pathname === "/") {
      return new Response("Discord bot is running!");
    }

    // Discord interaction endpoint
    if (request.method === "POST" && url.pathname === "/interactions") {
      return handleDiscordInteraction(request, env);
    }

    // Register /send
    if (request.method === "GET" && url.pathname === "/register") {
      return registerCommand(request, env);
    }

    return new Response("Not found", { status: 404 });
  }
};


// ============================================
// DISCORD INTERACTION HANDLER
// ============================================

async function handleDiscordInteraction(request, env) {
  const signature = request.headers.get("X-Signature-Ed25519");
  const timestamp = request.headers.get("X-Signature-Timestamp");

  if (!signature || !timestamp) {
    return new Response("Missing Discord signature", {
      status: 401
    });
  }

  const body = await request.text();

  const valid = await verifyDiscordRequest(
    body,
    signature,
    timestamp,
    env.PUBLIC_KEY
  );

  if (!valid) {
    return new Response("Invalid Discord signature", {
      status: 401
    });
  }

  const interaction = JSON.parse(body);

  // Discord ping
  if (interaction.type === 1) {
    return json({
      type: 1
    });
  }

  // Slash command
  if (interaction.type === 2) {
    const commandName = interaction.data?.name;

    if (commandName === COMMAND_NAME) {
      return executeSendCommand(interaction, env);
    }
  }

  return json({
    type: 4,
    data: {
      content: "Unknown command."
    }
  });
}


// ============================================
// /send COMMAND
// ============================================

async function executeSendCommand(interaction, env) {
  const options = interaction.data?.options || [];

  const messageOption = options.find(
    option => option.name === "message"
  );

  const message = messageOption?.value;

  if (!message) {
    return json({
      type: 4,
      data: {
        content: "❌ You need to provide a message."
      }
    });
  }

  const channelId = interaction.channel_id;

  // Send the message using your BOT
  const response = await fetch(
    `https://discord.com/api/v10/channels/${channelId}/messages`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bot ${env.BOT_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        content: message
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();

    return json({
      type: 4,
      data: {
        content: `❌ Bot couldn't send the message.\n\`\`\`${error.slice(0, 500)}\`\`\``
      }
    });
  }

  // Tell Discord the command was handled
  return json({
    type: 4,
    data: {
      content: "✅ Message sent."
    }
  });
}


// ============================================
// REGISTER /send
// ============================================

async function registerCommand(request, env) {
  const url = new URL(request.url);

  // Optional protection for this endpoint
  if (env.REGISTER_KEY) {
    const key = url.searchParams.get("key");

    if (key !== env.REGISTER_KEY) {
      return new Response("Unauthorized", {
        status: 401
      });
    }
  }

  const response = await fetch(
    `https://discord.com/api/v10/applications/${env.CLIENT_ID}/commands`,
    {
      method: "PUT",
      headers: {
        "Authorization": `Bot ${env.BOT_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify([
        {
          name: COMMAND_NAME,
          description: "Send a message using the bot",
          type: 1,
          options: [
            {
              name: "message",
              description: "The message to send",
              type: 3,
              required: true
            }
          ]
        }
      ])
    }
  );

  const result = await response.text();

  return new Response(result, {
    status: response.status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}


// ============================================
// DISCORD SIGNATURE VERIFICATION
// ============================================

async function verifyDiscordRequest(
  body,
  signature,
  timestamp,
  publicKey
) {
  try {
    const message = new TextEncoder().encode(
      timestamp + body
    );

    const signatureBytes = hexToUint8Array(signature);
    const publicKeyBytes = hexToUint8Array(publicKey);

    const key = await crypto.subtle.importKey(
      "raw",
      publicKeyBytes,
      {
        name: "Ed25519"
      },
      false,
      ["verify"]
    );

    return await crypto.subtle.verify(
      {
        name: "Ed25519"
      },
      key,
      signatureBytes,
      message
    );

  } catch {
    return false;
  }
}


// ============================================
// HELPERS
// ============================================

function hexToUint8Array(hex) {
  const bytes = new Uint8Array(hex.length / 2);

  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(
      hex.substring(i, i + 2),
      16
    );
  }

  return bytes;
}

function json(data, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
}