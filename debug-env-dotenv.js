require("dotenv").config(); console.log("ENV CHECK WITH DOTENV:", { SUPABASE_URL: process.env.SUPABASE_URL, SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? "FOUND" : "NOT_FOUND" });
