import { DurableObject } from "cloudflare:workers";
/* =========================================================
   CONFIG
========================================================= */
const API = "https://discord.com/api/v10";
/* =========================================================
   TIMEZONE ALIASES
========================================================= */
const TIMEZONES = {
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
  // East Asia
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
  BRUNEI: "Asia/Brunei",
  // Middle East
  IRAN: "Asia/Tehran",
  IRAQ: "Asia/Baghdad",
  ISRAEL: "Asia/Jerusalem",
  JORDAN: "Asia/Amman",
  LEBANON: "Asia/Beirut",
  "SAUDI ARABIA": "Asia/Riyadh",
  SAUDI: "Asia/Riyadh",
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
  KAMCHATKA: "Asia/Kamchatka",
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
  ECUADOR: "America/Guayaquil",
  BOLIVIA: "America/La_Paz",
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
/* =========================================================
   MAIN WORKER
========================================================= */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    /* Health check */
    if (
      request.method === "GET" &&
      url.pathname === "/"
    ) {
      return new Response(
        "Timezone bot is running!"
      );
    }
    /* Discord Interaction Endpoint */
    if (
      request.method === "POST" &&
      url.pathname === "/interactions"
    ) {
      return handleInteraction(request, env);
    }
    return new Response(
      "Not Found",
      {
        status: 404
      }
    );
  }
};
/* =========================================================
   DISCORD INTERACTION HANDLER
========================================================= */
async function handleInteraction(
  request,
  env
) {
  /* Verify Discord signature */
  const signature =
    request.headers.get(
      "X-Signature-Ed25519"
    );
  const timestamp =
    request.headers.get(
      "X-Signature-Timestamp"
    );
  if (
    !signature ||
    !timestamp
  ) {
    return new Response(
      "Missing Discord signature",
      {
        status: 401
      }
    );
  }
  const body =
    await request.text();
  const valid =
    await verifyDiscordSignature(
      body,
      signature,
      timestamp,
      env.PUBLIC_KEY
    );
  if (!valid) {
    return new Response(
      "Invalid request signature",
      {
        status: 401
      }
    );
  }
  let interaction;
  try {
    interaction =
      JSON.parse(body);
  } catch {
    return new Response(
      "Invalid JSON",
      {
        status: 400
      }
    );
  }
  /* Discord PING */
  if (interaction.type === 1) {
    return json({
      type: 1
    });
  }
  /* Slash command */
  if (
    interaction.type === 2
  ) {
    return handleCommand(
      interaction,
      env
    );
  }
  return json({
    type: 4,
    data: {
      content:
        "❌ Unsupported interaction."
    }
  });
}
/* =========================================================
   SIGNATURE VERIFICATION
========================================================= */
async function verifyDiscordSignature(
  body,
  signature,
  timestamp,
  publicKey
) {
  try {
    const hexToBytes = hex => {
      const bytes =
        new Uint8Array(
          hex.length / 2
        );
      for (
        let i = 0;
        i < bytes.length;
        i++
      ) {
        bytes[i] =
          parseInt(
            hex.substring(
              i * 2,
              i * 2 + 2
            ),
            16
          );
      }
      return bytes;
    };
    const key =
      await crypto.subtle.importKey(
        "raw",
        hexToBytes(publicKey),
        {
          name: "Ed25519"
        },
        false,
        ["verify"]
      );
    const message =
      new TextEncoder().encode(
        timestamp + body
      );
    return await crypto.subtle.verify(
      {
        name: "Ed25519"
      },
      key,
      hexToBytes(signature),
      message
    );
  } catch (error) {
    console.log(
      "Signature verification error:",
      error
    );
    return false;
  }
}
/* =========================================================
   COMMAND HANDLER
========================================================= */
async function handleCommand(
  interaction,
  env
) {
  const commandName =
    interaction.data?.name;
  if (
    commandName !== "tz"
  ) {
    return reply(
      "❌ Unknown command."
    );
  }
  const subcommand =
    interaction.data?.options?.[0];
  /* =========================
     /tz
  ========================= */
  if (
    !subcommand ||
    subcommand.type === 1 &&
    subcommand.name === "show"
  ) {
    const userId =
      interaction.member?.user?.id ||
      interaction.user?.id;
    const username =
      interaction.member?.user?.username ||
      interaction.user?.username ||
      "User";
    const timezone =
      await getTimezone(
        env,
        userId
      );
    if (!timezone) {
      return reply(
        "🌍 You haven't set a timezone yet.\n\n" +
        "Use `/tz set` and enter a timezone such as `Pakistan`."
      );
    }
    return reply(
      formatTimezoneMessage(
        username,
        timezone
      )
    );
  }
  /* =========================
     /tz set
  ========================= */
  if (
    subcommand?.type === 1 &&
    subcommand.name === "set"
  ) {
    const timezoneInput =
      getOption(
        subcommand.options,
        "timezone"
      );
    if (!timezoneInput) {
      return reply(
        "❌ Please provide a timezone."
      );
    }
    const timezone =
      resolveTimezone(
        timezoneInput
      );
    if (!timezone) {
      return reply(
        `❌ Invalid timezone: **${timezoneInput}**\n\n` +
        "Examples:\n" +
        "• `Pakistan`\n" +
        "• `Russia`\n" +
        "• `Moscow`\n" +
        "• `PST`\n" +
        "• `Asia/Karachi`"
      );
    }
    const userId =
      interaction.member?.user?.id ||
      interaction.user?.id;
    await saveTimezone(
      env,
      userId,
      timezone
    );
    return reply(
      `✅ Your timezone has been set to **${timezone}**.\n` +
      `🕐 Current time: **${getCurrentTime(timezone)}**`
    );
  }
  /* =========================
     /tz user
  ========================= */
  if (
    subcommand?.type === 1 &&
    subcommand.name === "user"
  ) {
    const user =
      getOption(
        subcommand.options,
        "user"
      );
    if (!user) {
      return reply(
        "❌ Please select a user."
      );
    }
    const timezone =
      await getTimezone(
        env,
        user.value
      );
    if (!timezone) {
      return reply(
        `❌ <@${user.value}> hasn't set a timezone yet.`
      );
    }
    const username =
      await getDiscordUsername(
        user.value,
        env
      );
    return reply(
      formatTimezoneMessage(
        username,
        timezone
      )
    );
  }
  return reply(
    "❌ Invalid timezone command."
  );
}
/* =========================================================
   GET OPTION
========================================================= */
function getOption(
  options,
  name
) {
  if (!options) {
    return null;
  }
  return options.find(
    option =>
      option.name === name
  ) || null;
}
/* =========================================================
   TIMEZONE DATABASE
========================================================= */
async function getTimezone(
  env,
  userId
) {
  const id =
    env.TIMEZONE_DB.idFromName(
      "timezone-storage"
    );
  const db =
    env.TIMEZONE_DB.get(id);
  const response =
    await db.fetch(
      "https://internal/get/" +
      encodeURIComponent(userId)
    );
  if (!response.ok) {
    return null;
  }
  const data =
    await response.json();
  return data.timezone || null;
}
async function saveTimezone(
  env,
  userId,
  timezone
) {
  const id =
    env.TIMEZONE_DB.idFromName(
      "timezone-storage"
    );
  const db =
    env.TIMEZONE_DB.get(id);
  await db.fetch(
    "https://internal/set",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json"
      },
      body: JSON.stringify({
        userId,
        timezone
      })
    }
  );
}
/* =========================================================
   DURABLE OBJECT
========================================================= */
export class TimezoneDB extends DurableObject {
  async fetch(request) {
    const url =
      new URL(request.url);
    if (
      request.method === "GET" &&
      url.pathname.startsWith(
        "/get/"
      )
    ) {
      const userId =
        decodeURIComponent(
          url.pathname.slice(
            5
          )
        );
      const timezone =
        await this.ctx.storage.get(
          `timezone:${userId}`
        );
      return Response.json({
        timezone:
          timezone || null
      });
    }
    if (
      request.method === "POST" &&
      url.pathname === "/set"
    ) {
      const data =
        await request.json();
      await this.ctx.storage.put(
        `timezone:${data.userId}`,
        data.timezone
      );
      return new Response(
        "Saved"
      );
    }
    return new Response(
      "Not Found",
      {
        status: 404
      }
    );
  }
}
/* =========================================================
   TIMEZONE RESOLVER
========================================================= */
function resolveTimezone(
  input
) {
  if (!input) {
    return null;
  }
  const cleaned =
    input
      .trim()
      .replace(/\s+/g, " ");
  const alias =
    TIMEZONES[
      cleaned.toUpperCase()
    ];
  if (alias) {
    return alias;
  }
  if (
    isValidTimezone(
      cleaned
    )
  ) {
    return cleaned;
  }
  return null;
}
/* =========================================================
   VALIDATE TIMEZONE
========================================================= */
function isValidTimezone(
  timezone
) {
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
   24-HOUR CURRENT TIME
========================================================= */
function getCurrentTime(
  timezone
) {
  return new Intl.DateTimeFormat(
    "en-GB",
    {
      timeZone: timezone,
      dateStyle: "medium",
      timeStyle: "short",
      hourCycle: "h23"
    }
  ).format(
    new Date()
  );
}
/* =========================================================
   FORMAT RESPONSE
========================================================= */
function formatTimezoneMessage(
  username,
  timezone
) {
  return (
    `🌍 **${username}'s timezone**\n` +
    `🕐 **${getCurrentTime(timezone)}**\n` +
    `📍 \`${timezone}\``
  );
}
/* =========================================================
   DISCORD USERNAME
========================================================= */
async function getDiscordUsername(
  userId,
  env
) {
  try {
    const response =
      await fetch(
        `${API}/users/${userId}`,
        {
          headers: {
            Authorization:
              `Bot ${env.BOT_TOKEN}`
          }
        }
      );
    if (!response.ok) {
      return "User";
    }
    const user =
      await response.json();
    return (
      user.global_name ||
      user.username ||
      "User"
    );
  } catch {
    return "User";
  }
}
/* =========================================================
   DISCORD REPLY
========================================================= */
function reply(content) {
  return json({
    type: 4,
    data: {
      content
    }
  });
}
/* =========================================================
   JSON RESPONSE
========================================================= */
function json(data) {
  return new Response(
    JSON.stringify(data),
    {
      status: 200,
      headers: {
        "Content-Type":
          "application/json"
      }
    }
  );
}