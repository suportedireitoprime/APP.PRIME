import SwiftUI

struct RadarItem: Identifiable, Hashable {
    let id: String
    let tipo_ato: String
    let numero_ato: String
    let ementa: String
    let dataPublicacao: String
}

struct Radar360View: View {
    var accessToken: String
    var initialItemsJson: String
    var onClose: () -> Void
    
    @State private var items: [RadarItem] = []
    @State private var selectedFilter: String = "Todos"
    
    let filters = ["Todos", "Lei", "Lei Complementar", "Decreto", "Medida Provisória"]
    
    var filteredItems: [RadarItem] {
        if selectedFilter == "Todos" {
            return items
        }
        return items.filter { $0.tipo_ato == selectedFilter }
    }
    
    var body: some View {
        ZStack {
            Color(red: 13/255, green: 13/255, blue: 13/255).edgesIgnoringSafeArea(.all)
            
            VStack(spacing: 0) {
                // Custom Navigation Bar
                HStack {
                    Button(action: onClose) {
                        HStack(spacing: 4) {
                            Image(systemName: "chevron.left")
                            Text("Voltar")
                        }
                        .foregroundColor(Color(red: 229/255, green: 57/255, blue: 53/255))
                        .font(.system(size: 16, weight: .semibold))
                    }
                    
                    Spacer()
                    
                    VStack(alignment: .center) {
                        Text("Radar de Leis")
                            .font(.system(size: 18, weight: .bold))
                            .foregroundColor(.white)
                        Text("Resenha diária do Planalto")
                            .font(.system(size: 12))
                            .foregroundColor(.gray)
                    }
                    .padding(.trailing, 40) // Balance title
                    
                    Spacer()
                }
                .padding(.horizontal)
                .padding(.vertical, 12)
                .background(Color(red: 30/255, green: 30/255, blue: 30/255))
                
                // Filters
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(filters, id: \.self) { filter in
                            Button(action: {
                                selectedFilter = filter
                            }) {
                                Text(filter)
                                    .font(.system(size: 14, weight: .medium))
                                    .padding(.horizontal, 16)
                                    .padding(.vertical, 8)
                                    .background(selectedFilter == filter ? Color(red: 229/255, green: 57/255, blue: 53/255) : Color(red: 42/255, green: 42/255, blue: 42/255))
                                    .foregroundColor(selectedFilter == filter ? .white : .gray)
                                    .cornerRadius(20)
                            }
                        }
                    }
                    .padding(.horizontal)
                    .padding(.vertical, 12)
                }
                
                HStack {
                    Text("\(filteredItems.count) atos encontrados")
                        .font(.system(size: 12))
                        .foregroundColor(.gray)
                    Spacer()
                }
                .padding(.horizontal)
                .padding(.bottom, 8)
                
                // List
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(filteredItems) { item in
                            VStack(alignment: .leading, spacing: 8) {
                                Text(item.tipo_ato)
                                    .font(.system(size: 10, weight: .bold))
                                    .foregroundColor(Color(red: 229/255, green: 57/255, blue: 53/255))
                                    .padding(.horizontal, 6)
                                    .padding(.vertical, 2)
                                    .background(Color(red: 229/255, green: 57/255, blue: 53/255).opacity(0.2))
                                    .cornerRadius(4)
                                
                                Text(item.numero_ato)
                                    .font(.system(size: 16, weight: .bold))
                                    .foregroundColor(.white)
                                
                                if !item.ementa.isEmpty {
                                    Text(item.ementa)
                                        .font(.system(size: 13))
                                        .foregroundColor(Color.gray)
                                        .lineLimit(3)
                                }
                            }
                            .padding()
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color(red: 30/255, green: 30/255, blue: 30/255))
                            .cornerRadius(12)
                        }
                    }
                    .padding(.horizontal)
                    .padding(.bottom, 20)
                }
            }
        }
        .onAppear {
            parseItems()
        }
    }
    
    private func parseItems() {
        guard let data = initialItemsJson.data(using: .utf8) else { return }
        do {
            if let jsonArray = try JSONSerialization.jsonObject(with: data, options: []) as? [[String: Any]] {
                var parsedItems: [RadarItem] = []
                for obj in jsonArray {
                    let item = RadarItem(
                        id: (obj["id"] as? String) ?? "",
                        tipo_ato: (obj["tipo_ato"] as? String) ?? "Outro",
                        numero_ato: (obj["numero_ato"] as? String) ?? "Sem número",
                        ementa: (obj["ementa"] as? String) ?? "",
                        dataPublicacao: (obj["data_publicacao"] as? String) ?? ""
                    )
                    parsedItems.append(item)
                }
                self.items = parsedItems
            }
        } catch {
            print("Failed to parse JSON: \(error)")
        }
    }
}
