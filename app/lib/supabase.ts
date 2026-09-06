import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://ftfvtdioloaymxfaznst.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0ZnZ0ZGlvbG9heW14ZmF6bnN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3MzY4ODMsImV4cCI6MjA2MDMxMjg4M30.tWNqiDrFrMLYzR8kNWAhsuUlcO28NEustf2pjip3P1U"
);