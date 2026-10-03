import { createClient } from "npm:@supabase/supabase-js";

const supabase = createClient(
  Deno.env.get("VITE_SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

async function run() {
  // Check if these phones have ANY asaas subscription (by name or phone)
  const phones = [
    { phone: "559180774280", name: "MARCIO DIAS" },
    { phone: "556196319205", name: "Nercino Filho" },
    { phone: "554584029540", name: "Theta Reis" },
  ];

  for (const p of phones) {
    console.log(`\n--- ${p.name} (${p.phone}) ---`);
    
    // Search asaas by phone variants
    const digits = p.phone.replace(/\D/g, "");
    const shortPhone = digits.slice(-9);
    const { data: asaas } = await supabase
      .from("asaas_subscriptions")
      .select("id, user_id, status, customer_phone, customer_email, customer_name, plano")
      .or(`customer_phone.ilike.%${shortPhone}%,customer_name.ilike.%${p.name.split(" ")[0]}%`)
      .limit(5);
    
    if (asaas && asaas.length > 0) {
      console.log("  Asaas matches:", asaas);
    } else {
      console.log("  Nenhuma assinatura Asaas encontrada");
    }

    // Search play subscriptions by checking profiles table for phone
    const { data: playProfiles } = await supabase
      .from("profiles")
      .select("id, display_name, email, telefone, whatsapp_number, is_premium")
      .or(`display_name.ilike.%${p.name.split(" ")[0]}%`)
      .limit(5);
    
    if (playProfiles && playProfiles.length > 0) {
      console.log("  Profile matches by name:", playProfiles.map(pp => ({
        id: pp.id,
        name: pp.display_name,
        email: pp.email,
        tel: pp.telefone,
        wa: pp.whatsapp_number,
        premium: pp.is_premium,
      })));
    } else {
      console.log("  Nenhum profile encontrado pelo nome");
    }
  }

  // Also check Case 3 (Wesley) - why Evolution 404
  console.log("\n--- Caso 3: Wesley (5511991897603) - Erros recentes ---");
  const { data: errors } = await supabase
    .from("horus_outbound_log")
    .select("status, error, kind, tipo, created_at")
    .eq("phone_e164", "5511991897603")
    .eq("status", "failed")
    .order("created_at", { ascending: false })
    .limit(10);
  console.log("Últimos erros:", errors);

  // Case 4 (Ketyy) - check if premium
  console.log("\n--- Caso 4: Ketyy (5527997757900) - Status premium ---");
  const { data: ketyProfile } = await supabase
    .from("profiles")
    .select("id, display_name, is_premium")
    .eq("id", "5ddd147c-b4f6-4ced-be35-6cb7896b06d3")
    .maybeSingle();
  console.log("Profile Ketyy:", ketyProfile);

  const { data: ketySub } = await supabase
    .from("asaas_subscriptions")
    .select("status, plano, expires_at")
    .eq("user_id", "5ddd147c-b4f6-4ced-be35-6cb7896b06d3")
    .limit(3);
  console.log("Assinaturas Ketyy:", ketySub);
}

run();
