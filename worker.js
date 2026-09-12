export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      return new Response("Worker is online");
    }

    if (
      request.method === "POST" &&
      url.pathname === "/interactions"
    ) {
      const body = await request.text();

      const signature =
        request.headers.get("X-Signature-Ed25519");

      const timestamp =
        request.headers.get("X-Signature-Timestamp");

      if (!signature || !timestamp) {
        return new Response("Missing signature", {
          status: 401
        });
      }

      try {
        const publicKeyBytes =
          hexToBytes(env.PUBLIC_KEY);

        const signatureBytes =
          hexToBytes(signature);

        const key =
          await crypto.subtle.importKey(
            "raw",
            publicKeyBytes,
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

        const valid =
          await crypto.subtle.verify(
            "Ed25519",
            key,
            signatureBytes,
            message
          );

        if (!valid) {
          return new Response(
            "Invalid signature",
            {
              status: 401
            }
          );
        }

        const interaction =
          JSON.parse(body);

        // Discord endpoint verification PING
        if (interaction.type === 1) {
          return Response.json({
            type: 1
          });
        }

        return Response.json({
          type: 4,
          data: {
            content:
              "Discord connection is working!"
          }
        });

      } catch (error) {
        console.log(
          "Verification error:",
          error
        );

        return new Response(
          "Verification error",
          {
            status: 500
          }
        );
      }
    }

    return new Response("Not Found", {
      status: 404
    });
  }
};


function hexToBytes(hex) {
  if (
    !hex ||
    typeof hex !== "string" ||
    hex.length % 2 !== 0
  ) {
    throw new Error("Invalid hexadecimal value");
  }

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
        hex.slice(
          i * 2,
          i * 2 + 2
        ),
        16
      );
  }

  return bytes;
}