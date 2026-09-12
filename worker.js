const COMMANDS = [
  {
    name: "send",
    description: "Send a message in this channel",
    type: 1,
    options: [
      {
        name: "message",
        description: "Message to send",
        type: 3,
        required: true
      }
    ]
  },
  {
    name: "create-channel",
    description: "Create a text channel",
    type: 1,
    options: [
      {
        name: "name",
        description: "Name of the new channel",
        type: 3,
        required: true
      }
    ]
  }
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/") {
      return new Response("Discord bot is running!");
    }

    if (request.method === "POST" && url.pathname === "/interactions") {
      return handleInteraction(request, env);
    }

    if (request.method === "GET" && url.pathname === "/register") {
      return registerCommands(env);
    }

    return new Response("Not found", { status: 404 });
  }
};


// ================================
// DISCORD INTERACTIONS
// ================================

async function handleInteraction(request, env) {
  const signature = request.headers.get("X-Signature-Ed25519");
  const timestamp = request.headers.get("X-Signature-Timestamp");

  if (!signature || !timestamp) {
    return new Response("Missing signature", { status: 401 });
  }

  const body = await request.text();

  const valid = await verifyDiscordRequest(
    body,
    signature,
    timestamp,
    env.PUBLIC_KEY
  );

  if (!valid) {
    return new Response("Invalid signature", { status: 401 });
  }

  const interaction = JSON.parse(body);

  // Discord verification ping
  if (interaction.type === 1) {
    return json({ type: 1 });
  }

  if (interaction.type !== 2) {
    return new Response("OK");
  }

  const command = interaction.data?.name;

  if (command === "send") {
    return handleSend(interaction, env);
  }

  if (command === "create-channel") {
    return handleCreateChannel(interaction, env);
  }

  return reply("Unknown command.");
}


// ================================
// /send
// ================================

async function handleSend(interaction, env) {
  const messageOption = interaction.data?.options?.find(
    option => option.name === "message"
  );

  const message = messageOption?.value;

  if (!message) {
    return reply("❌ Please provide a message.");
  }

  const response = await discordRequest(
    `/channels/${interaction.channel_id}/messages`,
    "POST",
    env.BOT_TOKEN,
    {
      content: message
    }
  );

  if (!response.ok) {
    return reply("❌ I couldn't send the message.");
  }

  return reply("✅ Message sent.");
}


// ================================
// /create-channel
// ================================

async function handleCreateChannel(interaction, env) {
  const guildId = interaction.guild_id;

  if (!guildId) {
    return reply("❌ This command can only be used inside a server.");
  }

  // Check that the user has Manage Channels permission
  const permissions = BigInt(
    interaction.member?.permissions || "0"
  );

  const MANAGE_CHANNELS = BigInt(0x10);

  if ((permissions & MANAGE_CHANNELS) === BigInt(0)) {
    return reply(
      "❌ You need the **Manage Channels** permission to use this command."
    );
  }

  const nameOption = interaction.data?.options?.find(
    option => option.name === "name"
  );

  let name = nameOption?.value;

  if (!name) {
    return reply("❌ Please provide a channel name.");
  }

  // Discord channel names have restrictions
  name = name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "")
    .slice(0, 100);

  if (!name) {
    return reply("❌ Invalid channel name.");
  }

  const response = await discordRequest(
    `/guilds/${guildId}/channels`,
    "POST",
    env.BOT_TOKEN,
    {
      name: name,
      type: 0
    }
  );

  if (!response.ok) {
    const error = await response.text();

    return reply(
      `❌ Couldn't create the channel.\n\`\`\`${error.slice(0, 500)}\`\`\``
    );
  }

  return reply(`✅ Created **#${name}**.`);
}


// ================================
// REGISTER SLASH COMMANDS
// ================================

async function registerCommands(env) {
  const response = await fetch(
    `https://discord.com/api/v10/applications/${env.CLIENT_ID}/commands`,
    {
      method: "PUT",
      headers: {
        "Authorization": `Bot ${env.BOT_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(COMMANDS)
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


// ================================
// DISCORD API REQUEST
// ================================

async function discordRequest(path, method, token, body) {
  return fetch(
    `https://discord.com/api/v10${path}`,
    {
      method: method,
      headers: {
        "Authorization": `Bot ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    }
  );
}


// ================================
// DISCORD SIGNATURE VERIFICATION
// ================================

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

    const signatureBytes = hexToBytes(signature);
    const publicKeyBytes = hexToBytes(publicKey);

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


// ================================
// HELPERS
// ================================

function hexToBytes(hex) {
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
      status: status,
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
}

function reply(content) {
  return json({
    type: 4,
    data: {
      content: content
    }
  });
}