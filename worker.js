import { DurableObject } from "cloudflare:workers";
const PREFIX = ",";
// Discord Gateway intents:
// GUILDS + GUILD_MESSAGES + MESSAGE_CONTENT
const INTENTS = 1 | 512 | 32768;
/* =========================
   TIMEZONE ALIASES
========================= */
const TIMEZONES = {
  // Common
  UTC: "UTC",
  GMT: "Etc/GMT",
  // Pakistan / South Asia
  PAKISTAN: "Asia/Karachi",
  PK: "Asia/Karachi",
  PKT: "Asia/Karachi",
  INDIA: "Asia/Kolkata",
  IN: "Asia/Kolkata",
  IST: "Asia/Kolkata",
  AFGHANISTAN: "Asia/Kabul",
  BANGLADESH: "Asia/Dhaka",
  BHUTAN: "Asia/Thimphu",
  NEPAL: "Asia/Kathmandu",
  "SRI LANKA": "Asia/Colombo",
  MYANMAR: "Asia/Yangon",
  // Asia
  CHINA: "Asia/Shanghai",
  JAPAN: "Asia/Tokyo",
  JST: "Asia/Tokyo",
  KOREA: "Asia/Seoul",
  "SOUTH KOREA": "Asia/Seoul",
  KST: "Asia/Seoul",
  TAIWAN: "Asia/Taipei",
  "HONG KONG": "Asia/Hong_Kong",
  THAILAND: "Asia/Bangkok",
  VIETNAM: "Asia/Ho_Chi_Minh",
  MALAYSIA: "Asia/Kuala_Lumpur",
  SINGAPORE: "Asia/Singapore",
  PHILIPPINES: "Asia/Manila",
  INDONESIA: "Asia/Jakarta",
  // Middle East
  IRAN: "Asia/Tehran",
  IRAQ: "Asia/Baghdad",
  ISRAEL: "Asia/Jerusalem",
  JORDAN: "Asia/Amman",
  "SAUDI ARABIA": "Asia/Riyadh",
  UAE: "Asia/Dubai",
  "UNITED ARAB EMIRATES": "Asia/Dubai",
  DUBAI: "Asia/Dubai",
  QATAR: "Asia/Qatar",
  KUWAIT: "Asia/Kuwait",
  BAHRAIN: "Asia/Bahrain",
  OMAN: "Asia/Muscat",
  TURKEY: "Europe/Istanbul",
  // Russia
  RUSSIA: "Europe/Moscow",
  "RUSSIAN FEDERATION": "Europe/Moscow",
  MOSCOW: "Europe/Moscow",
  VLADIVOSTOK: "Asia/Vladivostok",
  YAKUTSK: "Asia/Yakutsk",
  YEKATERINBURG: "Asia/Yekaterinburg",
  NOVOSIBIRSK: "Asia/Novosibirsk",
  // Europe
  UK: "Europe/London",
  "UNITED KINGDOM": "Europe/London",
  ENGLAND: "Europe/London",
  LONDON: "Europe/London",
  IRELAND: "Europe/Dublin",
  FRANCE: "Europe/Paris",
  GERMANY: "Europe/Berlin",
  SPAIN: "Europe/Madrid",
  PORTUGAL: "Europe/Lisbon",
  ITALY: "Europe/Rome",
  SWITZERLAND: "Europe/Zurich",
  AUSTRIA: "Europe/Vienna",
  BELGIUM: "Europe/Brussels",
  NETHERLANDS: "Europe/Amsterdam",
  POLAND: "Europe/Warsaw",
  CZECHIA: "Europe/Prague",
  HUNGARY: "Europe/Budapest",
  ROMANIA: "Europe/Bucharest",
  BULGARIA: "Europe/Sofia",
  GREECE: "Europe/Athens",
  FINLAND: "Europe/Helsinki",
  SWEDEN: "Europe/Stockholm",
  NORWAY: "Europe/Oslo",
  DENMARK: "Europe/Copenhagen",
  ICELAND: "Atlantic/Reykjavik",
  UKRAINE: "Europe/Kyiv",
  BELARUS: "Europe/Minsk",
  // North America
  USA: "America/New_York",
  US: "America/New_York",
  "UNITED STATES": "America/New_York",
  "NEW YORK": "America/New_York",
  CHICAGO: "America/Chicago",
  DENVER: "America/Denver",
  "LOS ANGELES": "America/Los_Angeles",
  ANCHORAGE: "America/Anchorage",
  HONOLULU: "Pacific/Honolulu",
  CANADA: "America/Toronto",
  TORONTO: "America/Toronto",
  VANCOUVER: "America/Vancouver",
  MEXICO: "America/Mexico_City",
  "MEXICO CITY": "America/Mexico_City",
  // South America
  BRAZIL: "America/Sao_Paulo",
  "SAO PAULO": "America/Sao_Paulo",
  ARGENTINA: "America/Argentina/Buenos_Aires",
  "BUENOS AIRES": "America/Argentina/Buenos_Aires",
  CHILE: "America/Santiago",
  PERU: "America/Lima",
  COLOMBIA: "America/Bogota",
  VENEZUELA: "America/Caracas",
  // Africa
  "SOUTH AFRICA": "Africa/Johannesburg",
  EGYPT: "Africa/Cairo",
  NIGERIA: "Africa/Lagos",
  GHANA: "Africa/Accra",
  KENYA: "Africa/Nairobi",
  ETHIOPIA: "Africa/Addis_Ababa",
  TANZANIA: "Africa/Dar_es_Salaam",
  UGANDA: "Africa/Kampala",
  MOROCCO: "Africa/Casablanca",
  ALGERIA: "Africa/Algiers",
  TUNISIA: "Africa/Tunis",
  // Oceania
  AUSTRALIA: "Australia/Sydney",
  SYDNEY: "Australia/Sydney",
  MELBOURNE: "Australia/Melbourne",
  BRISBANE: "Australia/Brisbane",
  PERTH: "Australia/Perth",
  ADELAIDE: "Australia/Adelaide",
  "NEW ZEALAND": "Pacific/Auckland",
  AUCKLAND: "Pacific/Auckland",
  FIJI: "Pacific/Fiji",
  // Common abbreviations
  PST: "America/Los_Angeles",
  PDT: "America/Los_Angeles",
  MST: "America/Denver",
  MDT: "America/Denver",
  CST: "America/Chicago",
  CDT: "America/Chicago",
  EST: "America/New_York",
  EDT: "America/New_York",
  CET: "Europe/Paris",
  CEST: "Europe/Paris",
  EET: "Europe/Athens",
  EEST: "Europe/Athens",
  GST: "Asia/Dubai",
  NPT: "Asia/Kathmandu",
  BDT: "Asia/Dhaka",
  ICT: "Asia/Bangkok",
  MYT: "Asia/Kuala_Lumpur",
  SGT: "Asia/Singapore",
  HKT: "Asia/Hong_Kong",
  AEST: "Australia/Sydney",
  AEDT: "Australia/Sydney",
  ACST: "Australia/Adelaide",
  AWST: "Australia/Perth",
  NZST: "Pacific/Auckland",
  NZDT: "Pacific/Auckland"
};
/* =========================
   MAIN WORKER
========================= */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/") {
      return new Response("Timezone bot is running!");
    }
    if (url.pathname === "/start") {
      const id = env.TIMEZONE_BOT.idFromName(
        "discord-gateway"
      );
      const bot = env.TIMEZONE_BOT.get(id);
      await bot.fetch(
        "https://internal/start"
      );
      return new Response(
        "Discord Gateway connection started."
      );
    }
    return new Response("Not Found", {
      status: 404
    });
  }
};
/* =========================
   DURABLE OBJECT
========================= */
export class TimezoneBot extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.env = env;
    this.ws = null;
    this.heartbeatTimer = null;
    this.reconnectTimer = null;
  }
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/start") {
      await this.connect();
      return new Response("Started");
    }
    return new Response("Not Found", {
      status: 404
    });
  }
  /* =========================
     CONNECT TO DISCORD
  ========================= */
  async connect() {
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
          Authorization:
            `Bot ${this.env.BOT_TOKEN}`
        }
      }
    );
    if (!response.ok) {
      console.log(
        "Gateway error:",
        response.status
      );
      this.scheduleReconnect();
      return;
    }
    const data = await response.json();
    const ws = new WebSocket(
      `${data.url}/?v=10&encoding=json`
    );
    this.ws = ws;
    ws.addEventListener(
      "open",
      () => {
        console.log(
          "Connected to Discord Gateway"
        );
      }
    );
    ws.addEventListener(
      "message",
      event => {
        this.handleGatewayMessage(
          event.data
        );
      }
    );
    ws.addEventListener(
      "close",
      () => {
        console.log(
          "Discord Gateway disconnected"
        );
        this.clearHeartbeat();
        this.ws = null;
        this.scheduleReconnect();
      }
    );
    ws.addEventListener(
      "error",
      error => {
        console.log(
          "Gateway WebSocket error:",
          error
        );
      }
    );
  }
  scheduleReconnect() {
    if (this.reconnectTimer) {
      return;
    }
    this.reconnectTimer = setTimeout(
      async () => {
        this.reconnectTimer = null;
        await this.connect();
      },
      5000
    );
  }
  /* =========================
     GATEWAY EVENTS
  ========================= */
  handleGatewayMessage(raw) {
    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      return;
    }
    const {
      op,
      d,
      t
    } = payload;
    // Hello
    if (op === 10) {
      this.startHeartbeat(
        d.heartbeat_interval
      );
      this.identify();
      return;
    }
    // Heartbeat request
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
    // Message
    if (
      op === 0 &&
      t === "MESSAGE_CREATE"
    ) {
      this.handleMessage(d);
    }
  }
  identify() {
    this.sendGateway({
      op: 2,
      d: {
        token: this.env.BOT_TOKEN,
        intents: INTENTS,
        properties: {
          os: "cloudflare",
          browser: "timezone-bot",
          device: "timezone-bot"
        }
      }
    });
  }
  sendGateway(payload) {
    if (!this.ws) {
      return;
    }
    try {
      this.ws.send(
        JSON.stringify(payload)
      );
    } catch (error) {
      console.log(
        "Gateway send error:",
        error
      );
    }
  }
  startHeartbeat(interval) {
    this.clearHeartbeat();
    this.heartbeatTimer = setInterval(
      () => {
        this.sendGateway({
          op: 1,
          d: null
        });
      },
      interval
    );
  }
  clearHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(
        this.heartbeatTimer
      );
      this.heartbeatTimer = null;
    }
  }
  /* =========================
     MESSAGE COMMANDS
  ========================= */
  async handleMessage(message) {
    // Ignore bots
    if (message.author?.bot) {
      return;
    }
    const content =
      message.content?.trim();
    if (
      !content ||
      !content.startsWith(PREFIX)
    ) {
      return;
    }
    const commandText =
      content
        .slice(PREFIX.length)
        .trim();
    const parts =
      commandText.split(/\s+/);
    const command =
      parts.shift()?.toLowerCase();
    if (command !== "tz") {
      return;
    }
    const args = parts;
    /* ,tz */
    if (args.length === 0) {
      const timezone =
        await this.getTimezone(
          message.author.id
        );
      if (!timezone) {
        await this.sendMessage(
          message.channel_id,
          "🌍 You haven't set a timezone yet.\n" +
          "Use `,tz set Pakistan`"
        );
        return;
      }
      await this.showTimezone(
        message.channel_id,
        message.author.username,
        timezone
      );
      return;
    }
    /* ,tz set TIMEZONE */
    if (
      args[0].toLowerCase() === "set"
    ) {
      if (!args[1]) {
        await this.sendMessage(
          message.channel_id,
          "❌ Usage: `,tz set Pakistan`"
        );
        return;
      }
      const input =
        args
          .slice(1)
          .join(" ");
      const timezone =
        resolveTimezone(input);
      if (!timezone) {
        await this.sendMessage(
          message.channel_id,
          `❌ Invalid timezone: **${input}**\n\n` +
          "Examples:\n" +
          "`,tz set Pakistan`\n" +
          "`,tz set Russia`\n" +
          "`,tz set Japan`\n" +
          "`,tz set PST`\n" +
          "`,tz set Asia/Karachi`"
        );
        return;
      }
      await this.ctx.storage.put(
        `timezone:${message.author.id}`,
        timezone
      );
      await this.sendMessage(
        message.channel_id,
        `✅ Timezone saved as **${timezone}**.\n` +
        `🕐 Current time: **${getCurrentTime(timezone)}**`
      );
      return;
    }
    /* ,tz @user */
    const user =
      message.mentions?.[0];
    if (user) {
      const timezone =
        await this.getTimezone(
          user.id
        );
      if (!timezone) {
        await this.sendMessage(
          message.channel_id,
          `❌ <@${user.id}> hasn't set a timezone yet.`
        );
        return;
      }
      await this.showTimezone(
        message.channel_id,
        user.username,
        timezone
      );
      return;
    }
    await this.sendMessage(
      message.channel_id,
      "❌ Usage:\n" +
      "`,tz`\n" +
      "`,tz set Pakistan`\n" +
      "`,tz @user`"
    );
  }
  /* =========================
     DATABASE
  ========================= */
  async getTimezone(userId) {
    return await this.ctx.storage.get(
      `timezone:${userId}`
    );
  }
  /* =========================
     DISPLAY TIMEZONE
  ========================= */
  async showTimezone(
    channelId,
    username,
    timezone
  ) {
    const time =
      getCurrentTime(timezone);
    await this.sendMessage(
      channelId,
      `🌍 **${username}'s timezone**\n` +
      `🕐 **${time}**\n` +
      `📍 \`${timezone}\``
    );
  }
  /* =========================
     SEND MESSAGE
  ========================= */
  async sendMessage(
    channelId,
    content
  ) {
    const response =
      await fetch(
        `https://discord.com/api/v10/channels/${channelId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization:
              `Bot ${this.env.BOT_TOKEN}`,
            "Content-Type":
              "application/json"
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
/* =========================
   TIMEZONE RESOLVER
========================= */
function resolveTimezone(input) {
  if (!input) {
    return null;
  }
  const cleaned =
    input
      .trim()
      .replace(/\s+/g, " ");
  // Country / abbreviation
  const alias =
    TIMEZONES[
      cleaned.toUpperCase()
    ];
  if (alias) {
    return alias;
  }
  // Direct IANA timezone
  if (
    isValidTimezone(cleaned)
  ) {
    return cleaned;
  }
  return null;
}
/* =========================
   VALIDATE TIMEZONE
========================= */
function isValidTimezone(timezone) {
  try {
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone: timezone
      }
    ).format();
    return true;
  } catch {
    return false;
  }
}
/* =========================
   CURRENT TIME
========================= */
function getCurrentTime(timezone) {
  return new Intl.DateTimeFormat(
    "en-US",
    {
      timeZone: timezone,
      dateStyle: "medium",
      timeStyle: "short"
    }
  ).format(new Date());
}