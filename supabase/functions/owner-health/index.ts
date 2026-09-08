import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { json } from "../_shared/http.ts";

export default {
  fetch: withSupabase({ auth: "user" }, async (_request, context) => {
    const appMetadata = context.jwtClaims?.app_metadata;
    const role =
      typeof appMetadata === "object" && appMetadata !== null
        ? Reflect.get(appMetadata, "role")
        : undefined;

    if (role !== "owner") {
      return json({ error: "Forbidden" }, 403);
    }

    return json({
      ok: true,
      role: "owner",
      userId: context.userClaims?.id,
    });
  }),
};
