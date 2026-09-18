import { GoogleAuth } from "npm:google-auth-library";

let cachedToken: string | null = null;
let tokenExpiry = 0;

/**
 * Obtém um token de acesso de curta duração (Bearer) usando uma Conta de Serviço do GCP.
 * Faz cache do token em memória por 50 minutos.
 * 
 * @param serviceAccountJson String JSON da Service Account
 * @returns Token JWT Bearer e o Project ID
 */
export async function getVertexAuth(serviceAccountJson: string): Promise<{ token: string; projectId: string }> {
  try {
    const creds = JSON.parse(serviceAccountJson);
    const projectId = creds.project_id;
    
    if (!projectId) {
      throw new Error("O JSON da Service Account não contém 'project_id'.");
    }

    if (cachedToken && Date.now() < tokenExpiry) {
      return { token: cachedToken, projectId };
    }

    const auth = new GoogleAuth({
      credentials: {
        client_email: creds.client_email,
        private_key: creds.private_key,
      },
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    const token = await auth.getAccessToken();
    if (!token) throw new Error("Falha ao obter token de acesso (retornou null)");
    
    cachedToken = token;
    // O token do Google geralmente expira em 60 min. Usamos 50 min de cache de segurança.
    tokenExpiry = Date.now() + 50 * 60 * 1000;

    return { token, projectId };
  } catch (error: any) {
    console.error("Erro na autenticação GCP (Vertex AI):", error.message);
    throw error;
  }
}
