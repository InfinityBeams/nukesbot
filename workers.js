// ===== YOUR COMMAND =====
const COMMAND_NAME = "send";

// ===== YOUR ACTION =====
async function executeCommand(interaction, env) {
  // PUT YOUR ACTION HERE
  // Example:
  // Send a Discord message
  // Do something with the authorized user
  // Call another API
}

// ===== DISCORD INTERACTION HANDLER =====
export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Discord bot is running!");
    }

    const interaction = await request.json();

    // Handle slash command
    if (interaction.type === 2) {
      const commandName = interaction.data?.name;

      if (commandName === COMMAND_NAME) {
        await executeCommand(interaction, env);

        return new Response(
          JSON.stringify({
            type: 4,
            data: {
              content: "Command executed!"
            }
          }),
          {
            headers: {
              "Content-Type": "application/json"
            }
          }
        );
      }
    }

    return new Response("OK");
  }
};