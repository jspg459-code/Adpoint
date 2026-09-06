import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://ftfvtdioloaymxfaznst.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXAiLCJyZWYiOiJmdGZ2dGRpb2xvYXlt eGZhem5zdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzQ0NzM2ODgzLCJleHAiOjIwNjAzMTI4ODB9.tWNqiDrFrMLYzR8kNWAhsuUlcO28NEustf2pjip3P1U".replace(" ","")
);