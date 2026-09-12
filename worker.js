import { DurableObject } from "cloudflare:workers";

const PREFIX = ",";

const GATEWAY_INTENTS =
  1 |        // GUILDS
  512 |      // GUILD_MESSAGES
  32768;     // MESSAGE_CONTENT


// ========================================
// MAIN WORKER
// ========================================

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === "/") {
      return new Response("Timezone bot is running!");
    }

    // Start/restart Discord Gateway connection
    if (url.pathname === "/start") {
      const id = env.TIMEZONE_BOT.idFromName("discord-gateway");
      const bot = env.TIMEZONE_BOT.get(id);

      await bot.fetch("https://internal/start");

      return new Response("Discord Gateway connection started.");
    }

    return new Response("Not found", { status: 404 });
  }
};


// ========================================
// DURABLE OBJECT
// ========================================

export class TimezoneBot extends DurableObject {

  constructor(ctx, env) {
    super(ctx, env);

    this.env = env;
    this.ws = null;
    this.heartbeatTimer = null;
    this.gatewayUrl = null;
    this.reconnectTimer = null;
  }


  async fetch(request) {

    const url = new URL(request.url);

    if (url.pathname === "/start") {
      await this.connectToDiscord();

      return new Response("Started");
    }

    return new Response("Not found", {
      status: 404
    });
  }


  // ========================================
  // CONNECT TO DISCORD
  // ========================================

  async connectToDiscord() {

    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
    }

    try {

      const gatewayResponse = await fetch(
        "https://discord.com/api/v10/gateway/bot",
        {
          headers: {
            "Authorization": `Bot ${this.env.BOT_TOKEN}`
          }
        }
      );

      if (!gatewayResponse.ok) {
        console.log(
          "Gateway request failed:",
          await gatewayResponse.text()
        );

        this.scheduleReconnect();
        return;
      }

      const gatewayData =
        await gatewayResponse.json();

      this.gatewayUrl =
        gatewayData.url;

      const ws =
        new WebSocket(
          `${this.gatewayUrl}/?v=10&encoding=json`
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

          this.cleanupHeartbeat();

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

    } catch (error) {

      console.log(
        "Gateway connection error:",
        error
      );

      this.scheduleReconnect();
    }
  }


  // ========================================
  // GATEWAY MESSAGE
  // ========================================

  async handleGatewayMessage(rawData) {

    let data;

    try {
      data = JSON.parse(rawData);
    } catch {
      return;
    }


    const op = data.op;


    // Hello
    if (op === 10) {

      const heartbeatInterval =
        data.d.heartbeat_interval;

      this.startHeartbeat(
        heartbeatInterval
      );

      this.identify();

      return;
    }


    // Heartbeat request
    if (op === 1) {

      this.sendHeartbeat();

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


    // Dispatch event
    if (op === 0) {

      const eventName =
        data.t;

      if (eventName === "MESSAGE_CREATE") {
        await this.handleMessage(
          data.d
        );
      }
    }
  }


  // ========================================
  // IDENTIFY
  // ========================================

  identify() {

    if (!this.ws) {
      return;
    }

    this.ws.send(
      JSON.stringify({
        op: 2,

        d: {
          token: this.env.BOT_TOKEN,

          intents: GATEWAY_INTENTS,

          properties: {
            os: "linux",
            browser: "cloudflare-worker",
            device: "cloudflare-worker"
          }
        }
      })
    );
  }


  // ========================================
  // HEARTBEAT
  // ========================================

  startHeartbeat(interval) {

    this.cleanupHeartbeat();

    this.heartbeatTimer =
      setInterval(
        () => {
          this.sendHeartbeat();
        },
        interval
      );
  }


  sendHeartbeat() {

    if (
      this.ws &&
      this.ws.readyState === WebSocket.OPEN
    ) {

      this.ws.send(
        JSON.stringify({
          op: 1,
          d: null
        })
      );
    }
  }


  cleanupHeartbeat() {

    if (this.heartbeatTimer) {

      clearInterval(
        this.heartbeatTimer
      );

      this.heartbeatTimer = null;
    }
  }


  // ========================================
  // RECONNECT
  // ========================================

  scheduleReconnect() {

    if (this.reconnectTimer) {
      return;
    }

    this.reconnectTimer =
      setTimeout(
        async () => {

          this.reconnectTimer = null;

          await this.connectToDiscord();

        },
        5000
      );
  }


  // ========================================
  // MESSAGE HANDLER
  // ========================================

  async handleMessage(message) {

    // Ignore bots
    if (message.author?.bot) {
      return;
    }

    const content =
      message.content?.trim();

    if (!content) {
      return;
    }

    if (!content.startsWith(PREFIX)) {
      return;
    }


    const args =
      content
        .slice(PREFIX.length)
        .trim()
        .split(/\s+/);


    const command =
      args.shift()?.toLowerCase();


    if (command !== "tz") {
      return;
    }


    // ,tz
    if (args.length === 0) {

      await this.showTimezone(
        message,
        message.author.id,
        message.author.username
      );

      return;
    }


    // ,tz set Asia/Karachi
    if (
      args[0]?.toLowerCase() === "set"
    ) {

      const timezone =
        args[1];

      if (!timezone) {

        await this.sendMessage(
          message.channel_id,
          "❌ Usage: `,tz set Asia/Karachi`"
        );

        return;
      }


      if (!isValidTimezone(timezone)) {

        await this.sendMessage(
          message.channel_id,
          "❌ Invalid timezone. Example: `Asia/Karachi`"
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
        `✅ Your timezone is now **${timezone}**.\n🕐 Current time: **${time}**`
      );

      return;
    }


    // ,tz @user
    const mentionedUser =
      getMentionedUser(
        message,
        args
      );


    if (mentionedUser) {

      await this.showTimezone(
        message,
        mentionedUser.id,
        mentionedUser.username
      );

      return;
    }


    await this.sendMessage(
      message.channel_id,
      "❌ Usage:\n`,tz set Asia/Karachi`\n`,tz @username`"
    );
  }


  // ========================================
  // SHOW TIMEZONE
  // ========================================

  async showTimezone(
    message,
    userId,
    username
  ) {

    const timezone =
      await this.ctx.storage.get(
        `tz:${userId}`
      );


    if (!timezone) {

      await this.sendMessage(
        message.channel_id,
        `❌ **${username}** hasn't set a timezone yet.`
      );

      return;
    }


    const time =
      getCurrentTime(timezone);


    await this.sendMessage(
      message.channel_id,
      `🌍 **${username}**'s timezone: **${timezone}**\n🕐 Current time: **${time}**`
    );
  }


  // ========================================
  // SEND DISCORD MESSAGE
  // ========================================

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
            "Authorization":
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
        "Failed to send Discord message:",
        await response.text()
      );
    }
  }
}


// ========================================
// VALIDATE TIMEZONE
// ========================================

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


// ========================================
// CURRENT TIME
// ========================================

function getCurrentTime(timezone) {

  return new Intl.DateTimeFormat(
    "en-US",
    {
      timeZone: timezone,

      hour: "numeric",
      minute: "2-digit",

      hour12: true
    }
  ).format(
    new Date()
  );
}


// ========================================
// GET @MENTION
// ========================================

function getMentionedUser(
  message,
  args
) {

  const mentioned =
    message.mentions?.[0];

  if (mentioned) {
    return mentioned;
  }


  const firstArg =
    args[0];

  if (!firstArg) {
    return null;
  }


  const match =
    firstArg.match(
      /^<@!?(\d+)>$/
    );


  if (!match) {
    return null;
  }


  return {
    id: match[1],
    username: "User"
  };
}