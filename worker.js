import { DurableObject } from "cloudflare:workers";

const PREFIX = ",";

// Discord Gateway intents:
// GUILDS + GUILD_MESSAGES + MESSAGE_CONTENT
const GATEWAY_INTENTS = 1 | 512 | 32768;

/* =========================================================
   TIMEZONE ALIASES
   ========================================================= */

const TIMEZONE_ALIASES = {
  // General
  "UTC": "UTC",
  "GMT": "Etc/GMT",

  // Pakistan / South Asia
  "PAKISTAN": "Asia/Karachi",
  "PK": "Asia/Karachi",
  "PKT": "Asia/Karachi",

  "INDIA": "Asia/Kolkata",
  "IN": "Asia/Kolkata",
  "IST": "Asia/Kolkata",

  "AFGHANISTAN": "Asia/Kabul",
  "BANGLADESH": "Asia/Dhaka",
  "BHUTAN": "Asia/Thimphu",
  "NEPAL": "Asia/Kathmandu",
  "SRI LANKA": "Asia/Colombo",
  "MYANMAR": "Asia/Yangon",

  // East / Southeast Asia
  "CHINA": "Asia/Shanghai",
  "JAPAN": "Asia/Tokyo",
  "JST": "Asia/Tokyo",

  "SOUTH KOREA": "Asia/Seoul",
  "KOREA": "Asia/Seoul",
  "KST": "Asia/Seoul",

  "NORTH KOREA": "Asia/Pyongyang",
  "TAIWAN": "Asia/Taipei",
  "HONG KONG": "Asia/Hong_Kong",
  "MACAU": "Asia/Macau",

  "THAILAND": "Asia/Bangkok",
  "VIETNAM": "Asia/Ho_Chi_Minh",
  "CAMBODIA": "Asia/Phnom_Penh",
  "LAOS": "Asia/Vientiane",

  "MALAYSIA": "Asia/Kuala_Lumpur",
  "SINGAPORE": "Asia/Singapore",
  "PHILIPPINES": "Asia/Manila",
  "INDONESIA": "Asia/Jakarta",
  "BRUNEI": "Asia/Brunei",

  "MONGOLIA": "Asia/Ulaanbaatar",
  "KAZAKHSTAN": "Asia/Almaty",
  "KYRGYZSTAN": "Asia/Bishkek",
  "TAJIKISTAN": "Asia/Dushanbe",
  "TURKMENISTAN": "Asia/Ashgabat",
  "UZBEKISTAN": "Asia/Tashkent",

  // Middle East
  "IRAN": "Asia/Tehran",
  "IRAQ": "Asia/Baghdad",
  "ISRAEL": "Asia/Jerusalem",
  "JORDAN": "Asia/Amman",
  "LEBANON": "Asia/Beirut",
  "SYRIA": "Asia/Damascus",

  "SAUDI ARABIA": "Asia/Riyadh",
  "UAE": "Asia/Dubai",
  "UNITED ARAB EMIRATES": "Asia/Dubai",
  "DUBAI": "Asia/Dubai",

  "QATAR": "Asia/Qatar",
  "KUWAIT": "Asia/Kuwait",
  "BAHRAIN": "Asia/Bahrain",
  "OMAN": "Asia/Muscat",
  "YEMEN": "Asia/Aden",

  "TURKEY": "Europe/Istanbul",
  "GEORGIA": "Asia/Tbilisi",
  "ARMENIA": "Asia/Yerevan",
  "AZERBAIJAN": "Asia/Baku",

  // Russia
  "RUSSIA": "Europe/Moscow",
  "RUSSIAN FEDERATION": "Europe/Moscow",
  "MOSCOW": "Europe/Moscow",
  "VLADIVOSTOK": "Asia/Vladivostok",
  "YAKUTSK": "Asia/Yakutsk",
  "YEKATERINBURG": "Asia/Yekaterinburg",
  "NOVOSIBIRSK": "Asia/Novosibirsk",
  "KAMCHATKA": "Asia/Kamchatka",

  // Europe
  "UNITED KINGDOM": "Europe/London",
  "UK": "Europe/London",
  "ENGLAND": "Europe/London",
  "LONDON": "Europe/London",

  "IRELAND": "Europe/Dublin",

  "FRANCE": "Europe/Paris",
  "GERMANY": "Europe/Berlin",
  "SPAIN": "Europe/Madrid",
  "PORTUGAL": "Europe/Lisbon",
  "ITALY": "Europe/Rome",

  "SWITZERLAND": "Europe/Zurich",
  "AUSTRIA": "Europe/Vienna",
  "BELGIUM": "Europe/Brussels",
  "NETHERLANDS": "Europe/Amsterdam",
  "LUXEMBOURG": "Europe/Luxembourg",

  "POLAND": "Europe/Warsaw",
  "CZECHIA": "Europe/Prague",
  "CZECH REPUBLIC": "Europe/Prague",
  "SLOVAKIA": "Europe/Bratislava",
  "HUNGARY": "Europe/Budapest",

  "ROMANIA": "Europe/Bucharest",
  "BULGARIA": "Europe/Sofia",
  "GREECE": "Europe/Athens",

  "FINLAND": "Europe/Helsinki",
  "SWEDEN": "Europe/Stockholm",
  "NORWAY": "Europe/Oslo",
  "DENMARK": "Europe/Copenhagen",
  "ICELAND": "Atlantic/Reykjavik",

  "ESTONIA": "Europe/Tallinn",
  "LATVIA": "Europe/Riga",
  "LITHUANIA": "Europe/Vilnius",

  "UKRAINE": "Europe/Kyiv",
  "BELARUS": "Europe/Minsk",
  "MOLDOVA": "Europe/Chisinau",

  "CROATIA": "Europe/Zagreb",
  "SERBIA": "Europe/Belgrade",
  "SLOVENIA": "Europe/Ljubljana",
  "BOSNIA": "Europe/Sarajevo",
  "MONTENEGRO": "Europe/Podgorica",
  "NORTH MACEDONIA": "Europe/Skopje",
  "ALBANIA": "Europe/Tirane",

  "MALTA": "Europe/Malta",
  "CYPRUS": "Asia/Nicosia",
  "MONACO": "Europe/Monaco",
  "VATICAN CITY": "Europe/Vatican",
  "ANDORRA": "Europe/Andorra",

  // North America
  "UNITED STATES": "America/New_York",
  "USA": "America/New_York",
  "US": "America/New_York",
  "NEW YORK": "America/New_York",

  "LOS ANGELES": "America/Los_Angeles",
  "CHICAGO": "America/Chicago",
  "DENVER": "America/Denver",
  "ANCHORAGE": "America/Anchorage",
  "HONOLULU": "Pacific/Honolulu",

  "CANADA": "America/Toronto",
  "TORONTO": "America/Toronto",
  "VANCOUVER": "America/Vancouver",
  "MONTREAL": "America/Toronto",

  "MEXICO": "America/Mexico_City",
  "MEXICO CITY": "America/Mexico_City",

  "GUATEMALA": "America/Guatemala",
  "BELIZE": "America/Belize",
  "COSTA RICA": "America/Costa_Rica",
  "PANAMA": "America/Panama",
  "CUBA": "America/Havana",
  "JAMAICA": "America/Jamaica",
  "HAITI": "America/Port-au-Prince",
  "DOMINICAN REPUBLIC": "America/Santo_Domingo",

  // South America
  "BRAZIL": "America/Sao_Paulo",
  "SAO PAULO": "America/Sao_Paulo",

  "ARGENTINA": "America/Argentina/Buenos_Aires",
  "BUENOS AIRES": "America/Argentina/Buenos_Aires",

  "CHILE": "America/Santiago",
  "PERU": "America/Lima",
  "COLOMBIA": "America/Bogota",
  "VENEZUELA": "America/Caracas",
  "ECUADOR": "America/Guayaquil",
  "BOLIVIA": "America/La_Paz",
  "PARAGUAY": "America/Asuncion",
  "URUGUAY": "America/Montevideo",
  "GUYANA": "America/Guyana",
  "SURINAME": "America/Paramaribo",

  // Africa
  "SOUTH AFRICA": "Africa/Johannesburg",
  "EGYPT": "Africa/Cairo",
  "NIGERIA": "Africa/Lagos",
  "GHANA": "Africa/Accra",
  "KENYA": "Africa/Nairobi",
  "ETHIOPIA": "Africa/Addis_Ababa",
  "TANZANIA": "Africa/Dar_es_Salaam",
  "UGANDA": "Africa/Kampala",
  "RWANDA": "Africa/Kigali",

  "MOROCCO": "Africa/Casablanca",
  "ALGERIA": "Africa/Algiers",
  "TUNISIA": "Africa/Tunis",
  "LIBYA": "Africa/Tripoli",
  "SUDAN": "Africa/Khartoum",

  "ZAMBIA": "Africa/Lusaka",
  "ZIMBABWE": "Africa/Harare",
  "BOTSWANA": "Africa/Gaborone",
  "NAMIBIA": "Africa/Windhoek",
  "MOZAMBIQUE": "Africa/Maputo",
  "ANGOLA": "Africa/Luanda",

  // Oceania
  "AUSTRALIA": "Australia/Sydney",
  "SYDNEY": "Australia/Sydney",
  "MELBOURNE": "Australia/Melbourne",
  "BRISBANE": "Australia/Brisbane",
  "PERTH": "Australia/Perth",
  "ADELAIDE": "Australia/Adelaide",

  "NEW ZEALAND": "Pacific/Auckland",
  "AUCKLAND": "Pacific/Auckland",
  "FIJI": "Pacific/Fiji",
  "PAPUA NEW GUINEA": "Pacific/Port_Moresby",
  "SAMOA": "Pacific/Apia",
  "TONGA": "Pacific/Tongatapu",

  // Common abbreviations
  "PST": "America/Los_Angeles",
  "PDT": "America/Los_Angeles",

  "MST": "America/Denver",
  "MDT": "America/Denver",

  "CST": "America/Chicago",
  "CDT": "America/Chicago",

  "EST": "America/New_York",
  "EDT": "America/New_York",

  "CET": "Europe/Paris",
  "CEST": "Europe/Paris",

  "EET": "Europe/Athens",
  "EEST": "Europe/Athens",

  "GST": "Asia/Dubai",
  "NPT": "Asia/Kathmandu",
  "BDT": "Asia/Dhaka",
  "ICT": "Asia/Bangkok",
  "MYT": "Asia/Kuala_Lumpur",
  "SGT": "Asia/Singapore",
  "HKT": "Asia/Hong_Kong",
  "PHT": "Asia/Manila",

  "AEST": "Australia/Sydney",
  "AEDT": "Australia/Sydney",
  "ACST": "Australia/Adelaide",
  "AWST": "Australia/Perth",

  "NZST": "Pacific/Auckland",
  "NZDT": "Pacific/Auckland"
};


/* =========================================================
   MAIN WORKER
   ========================================================= */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Homepage
    if (url.pathname === "/") {
      return new Response("Timezone bot is running!");
    }

    // Start Discord Gateway
    if (url.pathname === "/start") {
      const id = env.TIMEZONE_BOT.idFromName("discord-gateway");
      const bot = env.TIMEZONE_BOT.get(id);

      await bot.fetch("https://internal/start");

      return new Response(
        "Discord Gateway connection started."
      );
    }

    return new Response("Not Found", {
      status: 404
    });
  }
};


/* =========================================================
   DURABLE OBJECT
   ========================================================= */

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

    return new Response("Not Found", {
      status: 404
    });
  }


  /* =======================================================
     CONNECT TO DISCORD
     ======================================================= */

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
      console.log(
        "Gateway WebSocket error:",
        error
      );
    });
  }


  /* =======================================================
     RECONNECT
     ======================================================= */

  scheduleReconnect() {

    if (this.reconnectTimer) {
      return;
    }

    this.reconnectTimer = setTimeout(
      async () => {

        this.reconnectTimer = null;

        await this.connectToDiscord();

      },
      5000
    );
  }


  /* =======================================================
     GATEWAY EVENTS
     ======================================================= */

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


    // Discord Hello
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


    // Discord says reconnect
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


    // Message received
    if (
      op === 0 &&
      t === "MESSAGE_CREATE"
    ) {

      this.handleMessage(d);
    }
  }


  /* =======================================================
     IDENTIFY
     ======================================================= */

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


  /* =======================================================
     SEND GATEWAY DATA
     ======================================================= */

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


  /* =======================================================
     HEARTBEAT
     ======================================================= */

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


  /* =======================================================
     MESSAGE COMMANDS
     ======================================================= */

  async handleMessage(message) {

    // Ignore other bots
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

    const withoutPrefix =
      content
        .slice(PREFIX.length)
        .trim();

    const parts =
      withoutPrefix.split(/\s+/);

    const command =
      parts.shift()?.toLowerCase();

    if (command !== "tz") {
      return;
    }

    const args = parts;


    /* =====================================================
       ,tz
       ===================================================== */

    if (args.length === 0) {

      const timezone =
        await this.getUserTimezone(
          message.author.id
        );

      if (!timezone) {

        await this.sendMessage(
          message.channel_id,

          "🌍 You haven't set a timezone yet.\n" +
          "Use `,tz set Pakistan` or `,tz set Asia/Karachi`"
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


    /* =====================================================
       ,tz set TIMEZONE
       ===================================================== */

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

      /*
       * Allows multi-word names such as:
       * United States
       * United Kingdom
       * Saudi Arabia
       * South Africa
       */

      const input =
        args
          .slice(1)
          .join(" ");

      const timezone =
        resolveTimezone(input);

      if (!timezone) {

        await this.sendMessage(
          message.channel_id,

          `❌ I couldn't find the timezone **${input}**.\n\n` +
          "Examples:\n" +
          "`Pakistan`\n" +
          "`Russia`\n" +
          "`Japan`\n" +
          "`United States`\n" +
          "`Saudi Arabia`\n" +
          "`PKT`\n" +
          "`PST`\n" +
          "`Asia/Karachi`"
        );

        return;
      }


      await this.ctx.storage.put(
        `tz:${message.author.id}`,
        timezone
      );


      const time =
        getCurrentTime(timezone);


      await this.sendMessage(
        message.channel_id,

        `✅ Your timezone is now **${timezone}**.\n` +
        `🕐 Current time: **${time}**`
      );

      return;
    }


    /* =====================================================
       ,tz @USER
       ===================================================== */

    const mentionedUser =
      getMentionedUser(message);

    if (mentionedUser) {

      const timezone =
        await this.getUserTimezone(
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


    /* =====================================================
       INVALID COMMAND
       ===================================================== */

    await this.sendMessage(
      message.channel_id,

      "❌ Usage:\n" +
      "`,tz`\n" +
      "`,tz set Pakistan`\n" +
      "`,tz set Russia`\n" +
      "`,tz @user`"
    );
  }


  /* =======================================================
     GET SAVED TIMEZONE
     ======================================================= */

  async getUserTimezone(userId) {

    return await this.ctx.storage.get(
      `tz:${userId}`
    );
  }


  /* =======================================================
     SHOW TIMEZONE
     ======================================================= */

  async sendTimezone(
    channelId,
    username,
    timezone
  ) {

    const time =
      getCurrentTime(timezone);

    await this.sendMessage(
      channelId,

      `🌍 **${username}'s timezone**\n` +
      `🕐 ${time}\n` +
      `📍 \`${timezone}\``
    );
  }


  /* =======================================================
     SEND DISCORD MESSAGE
     ======================================================= */

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


/* =========================================================
   RESOLVE TIMEZONE
   ========================================================= */

function resolveTimezone(input) {

  if (!input) {
    return null;
  }

  const cleaned =
    input.trim();

  /*
   * Check our country/city/abbreviation list first.
   */

  const alias =
    TIMEZONE_ALIASES[
      cleaned.toUpperCase()
    ];

  if (alias) {
    return alias;
  }

  /*
   * Otherwise try a full IANA timezone.
   *
   * Examples:
   * Asia/Karachi
   * Europe/London
   * America/New_York
   * Asia/Vladivostok
   */

  if (
    isValidTimezone(cleaned)
  ) {
    return cleaned;
  }

  return null;
}


/* =========================================================
   VALIDATE IANA TIMEZONE
   ========================================================= */

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


/* =========================================================
   CURRENT TIME
   ========================================================= */

function getCurrentTime(timezone) {

  return new Intl.DateTimeFormat(
    "en-US",
    {
      timeZone: timezone,
      dateStyle: "medium",
      timeStyle: "short"
    }
  ).format(
    new Date()
  );
}


/* =========================================================
   GET MENTIONED USER
   ========================================================= */

function getMentionedUser(message) {

  if (
    message.mentions &&
    message.mentions.length > 0
  ) {

    return message.mentions[0];
  }

  return null;
}