import SwiftUI

struct AuthView: View {
    let initialMode: String
    var onSuccess: (String) -> Void
    var onClose: () -> Void

    @State private var mode: String = "login"
    @State private var email: String = ""
    @State private var password: String = ""
    @State private var name: String = ""
    @State private var showPassword: Bool = false
    @State private var isLoading: Bool = false
    @State private var errorMessage: String? = nil
    @State private var successMessage: String? = nil

    private let supabaseUrl = "https://dnjrgpldcwcpoywamorr.supabase.co"
    private let supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0"

    init(initialMode: String = "login", onSuccess: @escaping (String) -> Void, onClose: @escaping () -> Void) {
        self.initialMode = initialMode
        self.onSuccess = onSuccess
        self.onClose = onClose
        _mode = State(initialValue: initialMode == "signup" ? "signup" : (initialMode == "forgot" ? "forgot" : "login"))
    }

    var body: some View {
        ZStack {
            Color(hex: "#0D0D0D").ignoresSafeArea()

            ScrollView {
                VStack(spacing: 20) {
                    // Top Bar
                    HStack {
                        Button(action: {
                            UIImpactFeedbackGenerator(style: .light).impactOccurred()
                            onClose()
                        }) {
                            Image(systemName: "xmark")
                                .font(.system(size: 16, weight: .bold))
                                .foregroundColor(.white)
                                .frame(width: 44, height: 44)
                                .background(Color(hex: "#27272A"))
                                .clipShape(Circle())
                        }

                        Spacer()

                        Text("DIREITO PRIME")
                            .font(.system(size: 12, weight: .black))
                            .foregroundColor(Color(hex: "#F59E0B"))
                            .tracking(2)

                        Spacer()

                        Color.clear.frame(width: 44, height: 44)
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 10)

                    // Hero Icon
                    ZStack {
                        RoundedRectangle(cornerRadius: 18)
                            .fill(LinearGradient(
                                colors: [Color(hex: "#9333EA"), Color(hex: "#6B21A8")],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ))
                            .frame(width: 64, height: 64)

                        Image(systemName: mode == "signup" ? "person.badge.plus" : (mode == "forgot" ? "key.fill" : "lock.shield.fill"))
                            .font(.system(size: 28))
                            .foregroundColor(.white)
                    }
                    .padding(.top, 10)

                    // Title
                    VStack(spacing: 6) {
                        Text(mode == "signup" ? "Crie sua Conta" : (mode == "forgot" ? "Recuperar Senha" : "Bem-vindo de Volta"))
                            .font(.system(size: 24, weight: .black))
                            .foregroundColor(.white)

                        Text(mode == "signup" ? "Acesse o maior ecossistema jurídico do Brasil." : (mode == "forgot" ? "Digite seu e-mail para receber instruções." : "Entre para acessar seus cadernos e Vade Mecum."))
                            .font(.system(size: 14))
                            .foregroundColor(Color(hex: "#A1A1AA"))
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 20)
                    }

                    // Segmented Picker (Entrar / Criar Conta)
                    if mode != "forgot" {
                        HStack(spacing: 0) {
                            Button(action: {
                                UIImpactFeedbackGenerator(style: .selection).impactOccurred()
                                mode = "login"
                            }) {
                                Text("Entrar")
                                    .font(.system(size: 14, weight: .bold))
                                    .foregroundColor(.white)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 10)
                                    .background(mode == "login" ? Color(hex: "#9333EA") : Color.clear)
                                    .cornerRadius(12)
                            }

                            Button(action: {
                                UIImpactFeedbackGenerator(style: .selection).impactOccurred()
                                mode = "signup"
                            }) {
                                Text("Criar Conta")
                                    .font(.system(size: 14, weight: .bold))
                                    .foregroundColor(.white)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 10)
                                    .background(mode == "signup" ? Color(hex: "#9333EA") : Color.clear)
                                    .cornerRadius(12)
                            }
                        }
                        .padding(4)
                        .background(Color(hex: "#18181B"))
                        .cornerRadius(16)
                        .padding(.horizontal, 24)
                    }

                    // Erro / Sucesso Banners
                    if let err = errorMessage {
                        Text(err)
                            .font(.system(size: 13))
                            .foregroundColor(Color(hex: "#FCA5A5"))
                            .padding()
                            .frame(maxWidth: .infinity)
                            .background(Color(hex: "#EF4444").opacity(0.2))
                            .cornerRadius(12)
                            .padding(.horizontal, 24)
                    }

                    if let suc = successMessage {
                        Text(suc)
                            .font(.system(size: 13))
                            .foregroundColor(Color(hex: "#6EE7B7"))
                            .padding()
                            .frame(maxWidth: .infinity)
                            .background(Color(hex: "#10B981").opacity(0.2))
                            .cornerRadius(12)
                            .padding(.horizontal, 24)
                    }

                    // Form Fields
                    VStack(spacing: 14) {
                        if mode == "signup" {
                            HStack(spacing: 12) {
                                Image(systemName: "person.fill")
                                    .foregroundColor(Color(hex: "#A1A1AA"))
                                TextField("Nome Completo", text: $name)
                                    .foregroundColor(.white)
                                    .autocapitalization(.words)
                            }
                            .padding(.horizontal, 16)
                            .padding(.vertical, 14)
                            .background(Color(hex: "#18181B"))
                            .cornerRadius(14)
                            .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color(hex: "#3F3F46"), lineWidth: 1))
                        }

                        HStack(spacing: 12) {
                            Image(systemName: "envelope.fill")
                                .foregroundColor(Color(hex: "#A1A1AA"))
                            TextField("Seu E-mail", text: $email)
                                .foregroundColor(.white)
                                .keyboardType(.emailAddress)
                                .autocapitalization(.none)
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 14)
                        .background(Color(hex: "#18181B"))
                        .cornerRadius(14)
                        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color(hex: "#3F3F46"), lineWidth: 1))

                        if mode != "forgot" {
                            HStack(spacing: 12) {
                                Image(systemName: "lock.fill")
                                    .foregroundColor(Color(hex: "#A1A1AA"))
                                if showPassword {
                                    TextField("Sua Senha", text: $password)
                                        .foregroundColor(.white)
                                } else {
                                    SecureField("Sua Senha", text: $password)
                                        .foregroundColor(.white)
                                }
                                Button(action: { showPassword.toggle() }) {
                                    Image(systemName: showPassword ? "eye.slash.fill" : "eye.fill")
                                        .foregroundColor(Color(hex: "#A1A1AA"))
                                }
                            }
                            .padding(.horizontal, 16)
                            .padding(.vertical, 14)
                            .background(Color(hex: "#18181B"))
                            .cornerRadius(14)
                            .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color(hex: "#3F3F46"), lineWidth: 1))

                            if mode == "login" {
                                HStack {
                                    Spacer()
                                    Button(action: { mode = "forgot" }) {
                                        Text("Esqueceu sua senha?")
                                            .font(.system(size: 12, weight: .semibold))
                                            .foregroundColor(Color(hex: "#F59E0B"))
                                    }
                                }
                            }
                        }
                    }
                    .padding(.horizontal, 24)

                    // Action Button
                    Button(action: { executarAuth() }) {
                        HStack {
                            if isLoading {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                            } else {
                                Text(mode == "signup" ? "Cadastrar Gratuitamente" : (mode == "forgot" ? "Enviar Link de Recuperação" : "Entrar na Conta"))
                                    .font(.system(size: 16, weight: .black))
                                    .foregroundColor(.white)
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 54)
                        .background(Color(hex: "#9333EA"))
                        .cornerRadius(16)
                    }
                    .disabled(isLoading)
                    .padding(.horizontal, 24)
                    .padding(.top, 10)

                    if mode == "forgot" {
                        Button(action: { mode = "login" }) {
                            Text("Voltar para o Login")
                                .font(.system(size: 14, weight: .bold))
                                .foregroundColor(.white)
                        }
                        .padding(.top, 8)
                    }

                    // Footer
                    Text("Ao continuar, você concorda com os Termos de Uso e Política de Privacidade do Direito Prime.")
                        .font(.system(size: 11))
                        .foregroundColor(Color(hex: "#71717A"))
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 32)
                        .padding(.top, 20)
                }
                .padding(.bottom, 40)
            }
        }
    }

    private func executarAuth() {
        if email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            errorMessage = "Digite seu e-mail"
            return
        }
        if mode != "forgot" && password.isEmpty {
            errorMessage = "Digite sua senha"
            return
        }
        if mode == "signup" && name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            errorMessage = "Digite seu nome"
            return
        }

        errorMessage = nil
        successMessage = nil
        isLoading = true
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()

        guard let endpoint = URL(string: mode == "signup" ? "\(supabaseUrl)/auth/v1/signup" : (mode == "forgot" ? "\(supabaseUrl)/auth/v1/recover" : "\(supabaseUrl)/auth/v1/token?grant_type=password")) else {
            isLoading = false
            return
        }

        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(supabaseAnonKey, forHTTPHeaderField: "apikey")

        var dict: [String: Any] = ["email": email.trimmingCharacters(in: .whitespacesAndNewlines)]
        if mode != "forgot" {
            dict["password"] = password
        }
        if mode == "signup" {
            dict["data"] = ["display_name": name.trimmingCharacters(in: .whitespacesAndNewlines)]
        }

        request.httpBody = try? JSONSerialization.data(withJSONObject: dict)

        URLSession.shared.dataTask(with: request) { data, response, error in
            DispatchQueue.main.async {
                self.isLoading = false
                if let error = error {
                    self.errorMessage = "Falha de conexão: \(error.localizedDescription)"
                    return
                }

                guard let data = data, let httpResponse = response as? HTTPURLResponse else {
                    self.errorMessage = "Erro inesperado do servidor"
                    return
                }

                if (200...299).contains(httpResponse.statusCode) {
                    if self.mode == "forgot" {
                        self.successMessage = "E-mail de recuperação enviado com sucesso!"
                    } else {
                        let jsonStr = String(data: data, encoding: .utf8) ?? "{}"
                        self.onSuccess(jsonStr)
                    }
                } else {
                    if let errJson = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                       let desc = errJson["error_description"] as? String ?? errJson["msg"] as? String {
                        self.errorMessage = desc
                    } else {
                        self.errorMessage = "Erro na autenticação. Verifique os dados."
                    }
                }
            }
        }.resume()
    }
}
