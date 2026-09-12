import { DurableObject } from "cloudflare:workers";

const PREFIX = ",";
const GATEWAY_INTENTS = 1 | 512 | 32768;

// Common timezone abbreviations.
// Ambiguous abbreviations are assigned one specific timezone.
const TIMEZONE_ALIASES = {
  UTC: "UTC",
  GMT: "Etc/GMT",

  PKT: "Asia/Karachi",
  IST: "Asia/Kolkata",
  JST: "Asia/Tokyo",
  KST: "Asia/Seoul",
  CST: "America/Chicago",
  EST: "America/New_York",
  MST: "America/Denver",
  PST: "America/Los_Angeles",

  AKST: "America/Anchorage",
  HST: "Pacific/Honolulu",

  AST: "America/Halifax",
  NST: "America/St_Johns",

  BRT: "America/Sao_Paulo",
  ART: "America/Argentina/Buenos_Aires",

  CET: "Europe/Paris",
  CEST: "Europe/Paris",
  EET: "Europe/Athens",
  EEST: "Europe/Athens",

  WET: "Europe/London",
  WEST: "Europe/London",

  SAST: "Africa/Johannesburg",
  EAT: "Africa/Nairobi",
  CAT: "Africa/Maputo",

  GST: "Asia/Dubai",
  AST_GULF: "Asia/Riyadh",

  AFT: "Asia/Kabul",
  NPT: "Asia/Kathmandu",
  BDT: "Asia/Dhaka",
  ICT: "Asia/Bangkok",
  WIT: "Asia/Jakarta",
  MYT: "Asia/Kuala_Lumpur",
  SGT: "Asia/Singapore",
  HKT: "Asia/Hong_Kong",
  PHT: "Asia/Manila",
  WITA: "Asia/Makassar",
  WIT: "Asia/Jayapura",

  ACST: "Australia/Adelaide",
  AEST: "Australia/Sydney",
  AWST: "Australia/Perth",
  NZST: "Pacific/Auckland"
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      return new Response("Timezone bot is running!");
    }

    if (url.pathname === "/start") {
      const id = env.TIMEZONE_BOT.idFromName("discord-gateway");
      const bot = env.TIMEZONE_BOT.get(id);

      await bot.fetch("https://internal/start");

      return new Response("Discord Gateway connection started.");
    }

    return new Response("Not Found", { status: 404 });
  }
};

export class TimezoneBot extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);

    this.env = env;
    this.ws = null;
    this.heartbeatTimer = null;
    this.reconnectTimer = null;
    this.gatewayUrl = null;
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/start") {
      await this.connectToDiscord();
      return new Response("Started");
    }

    return new Response("Not Found", { status: 404 });
  }

  async connectToDiscord() {
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }

    const response = await fetch(
      "https://discord.com/api/v10/gateway/bot",
      {
        headers: {
          Authorization: `Bot ${this.env.BOT_TOKEN}`
        }
      }
    );

    if (!response.ok) {
      console.log(
        "Gateway request failed:",
        response.status,
        await response.text()
      );
      this.scheduleReconnect();
      return;
    }

    const data = await response.json();
    this.gatewayUrl = data.url;

    const ws = new WebSocket(
      `${this.gatewayUrl}/?v=10&encoding=json`
    );

    this.ws = ws;

    ws.addEventListener("open", () => {
      console.log("Discord Gateway connected");
    });

    ws.addEventListener("message", event => {
      this.handleGatewayMessage(event.data);
    });

    ws.addEventListener("close", () => {
      console.log("Discord Gateway disconnected");

      this.clearHeartbeat();
      this.ws = null;

      this.scheduleReconnect();
    });

    ws.addEventListener("error", error => {
      console.log("Gateway WebSocket error:", error);
    });
  }

  scheduleReconnect() {
    if (this.reconnectTimer) return;

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      await this.connectToDiscord();
    }, 5000);
  }

  handleGatewayMessage(raw) {
    let payload;

    try {
      payload = JSON.parse(raw);
    } catch {
      return;
    }

    const { op, d, t } = payload;

    // Hello
    if (op === 10) {
      this.startHeartbeat(d.heartbeat_interval);
      this.identify();
      return;
    }

    // Heartbeat requested
    if (op === 1) {
      this.sendGateway({
        op: 1,
        d: null
      });
      return;
    }

    // Reconnect
    if (op === 7) {
      try {
        this.ws?.close();
      } catch {}
      return;
    }

    // Invalid session
    if (op === 9) {
      try {
        this.ws?.close();
      } catch {}
      return;
    }

    // Discord event
    if (op === 0 && t === "MESSAGE_CREATE") {
      this.handleMessage(d);
    }
  }

  identify() {
    this.sendGateway({
      op: 2,
      d: {
        token: this.env.BOT_TOKEN,

        intents: GATEWAY_INTENTS,

        properties: {
          os: "cloudflare",
          browser: "timezone-bot",
          device: "timezone-bot"
        }
      }
    });
  }

  sendGateway(payload) {
    if (!this.ws) return;

    try {
      this.ws.send(JSON.stringify(payload));
    } catch (error) {
      console.log("Gateway send error:", error);
    }
  }

  startHeartbeat(interval) {
    this.clearHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      this.sendGateway({
        op: 1,
        d: null
      });
    }, interval);
  }

  clearHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  async handleMessage(message) {
    // Ignore bots
    if (message.author?.bot) return;

    const content = message.content?.trim();

    if (!content || !content.startsWith(PREFIX)) {
      return;
    }

    const withoutPrefix = content.slice(PREFIX.length).trim();

    const parts = withoutPrefix.split(/\s+/);

    const command = parts.shift()?.toLowerCase();

    if (command !== "tz") {
      return;
    }

    const args = parts;

    // ,tz
    if (args.length === 0) {
      const timezone = await this.getUserTimezone(
        message.author.id
      );

      if (!timezone) {
        await this.sendMessage(
          message.channel_id,
          `🌍 You haven't set a timezone yet.\nUse \`,tz set Asia/Karachi\` or \`,tz set PKT\``
        );
        return;
      }

      await this.sendTimezone(
        message.channel_id,
        message.author.username,
        timezone
      );

      return;
    }

    // ,tz set TIMEZONE
    if (args[0].toLowerCase() === "set") {
      if (!args[1]) {
        await this.sendMessage(
          message.channel_id,
          "❌ Usage: `,tz set Asia/Karachi` or `,tz set PKT`"
        );
        return;
      }

      const input = args[1];

      const timezone = resolveTimezone(input);

      if (!timezone) {
        await this.sendMessage(
          message.channel_id,
          `❌ Invalid timezone: \`${input}\`\n\nExamples:\n\`PKT\` • \`PST\` • \`EST\` • \`GMT\` • \`IST\` • \`JST\`\n\nOr use a full timezone such as \`Asia/Karachi\`.`
        );
        return;
      }

      await this.ctx.storage.put(
        `tz:${message.author.id}`,
        timezone
      );

      const time = getCurrentTime(timezone);

      await this.sendMessage(
        message.channel_id,
        `✅ Your timezone has been set to **${timezone}**.\n🕐 Current time: **${time}**`
      );

      return;
    }

    // ,tz @user
    const mentionedUser = getMentionedUser(message);

    if (mentionedUser) {
      const timezone = await this.getUserTimezone(
        mentionedUser.id
      );

      if (!timezone) {
        await this.sendMessage(
          message.channel_id,
          `❌ <@${mentionedUser.id}> hasn't set a timezone yet.`
        );
        return;
      }

      await this.sendTimezone(
        message.channel_id,
        mentionedUser.username,
        timezone
      );

      return;
    }

    await this.sendMessage(
      message.channel_id,
      "❌ Usage: `,tz` • `,tz set PKT` • `,tz @user`"
    );
  }

  async getUserTimezone(userId) {
    return await this.ctx.storage.get(`tz:${userId}`);
  }

  async sendTimezone(channelId, username, timezone) {
    const time = getCurrentTime(timezone);

    await this.sendMessage(
      channelId,
      `🌍 **${username}'s timezone**\n🕐 ${time}\n📍 \`${timezone}\``
    );
  }

  async sendMessage(channelId, content) {
    const response = await fetch(
      `https://discord.com/api/v10/channels/${channelId}/messages`,
      {
        method: "POST",

        headers: {
          Authorization: `Bot ${this.env.BOT_TOKEN}`,
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          content
        })
      }
    );

    if (!response.ok) {
      console.log(
        "Discord message error:",
        response.status,
        await response.text()
      );
    }
  }
};

function resolveTimezone(input) {
  if (!input) return null;

  const cleaned = input.trim();

  // Alias
  const alias = TIMEZONE_ALIASES[cleaned.toUpperCase()];

  if (alias) {
    return alias;
  }

  // Full IANA timezone
  if (isValidTimezone(cleaned)) {
    return cleaned;
  }

  return null;
}

function isValidTimezone(timezone) {
  try {
    new Intl.DateTimeFormat("en-US", {
      timeZone: timezone
    }).format();

    return true;
  } catch {
    return false;
  }
}

function getCurrentTime(timezone) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date());
}

function getMentionedUser(message) {
  if (
    message.mentions &&
    message.mentions.length > 0
  ) {
    return message.mentions[0];
  }

  return null;
}