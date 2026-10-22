import Capacitor
import SwiftUI

@objc(NativeVideoaulasPlugin)
public class NativeVideoaulasPlugin: CAPPlugin {
    
    private var hubHostingController: UIHostingController<VideoaulasHubView>?
    private var playerHostingController: UIHostingController<VideoaulaPlayerView>?

    @objc func openHub(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self, let rootVC = self.bridge?.viewController else {
                call.reject("Unable to find root view controller")
                return
            }

            let hubView = VideoaulasHubView(
                onClose: { [weak self] in
                    self?.dismissHub()
                    self?.notifyListeners("onClose", data: [:])
                },
                onOpenVideo: { [weak self] aula in
                    self?.notifyListeners("onVideoSelected", data: [
                        "id": aula.id,
                        "videoId": aula.videoId,
                        "titulo": aula.titulo,
                        "area": aula.area
                    ])
                },
                onProgressUpdate: { [weak self] videoId, current, duracao, concluida in
                    self?.notifyListeners("onVideoProgress", data: [
                        "id": videoId,
                        "currentSeconds": current,
                        "durationSeconds": duracao,
                        "completed": concluida
                    ])
                }
            )

            let hostingVC = UIHostingController(rootView: hubView)
            hostingVC.modalPresentationStyle = .fullScreen
            self.hubHostingController = hostingVC
            rootVC.present(hostingVC, animated: true) {
                call.resolve(["success": true])
            }
        }
    }

    @objc func openVideo(_ call: CAPPluginCall) {
        let id = call.getString("id") ?? UUID().uuidString
        let videoId = call.getString("videoId") ?? "dQw4w9WgXcQ"
        let titulo = call.getString("titulo") ?? "Videoaula Prime"
        let area = call.getString("area") ?? "Direito"
        let duracao = call.getInt("duracaoSegundos") ?? 1800
        let descricao = call.getString("descricao") ?? ""

        let aula = NativeVideoaulaItem(
            id: id,
            videoId: videoId,
            titulo: titulo,
            area: area,
            duracaoSegundos: duracao,
            descricao: descricao
        )

        DispatchQueue.main.async { [weak self] in
            guard let self = self, let rootVC = self.bridge?.viewController else {
                call.reject("Unable to find root view controller")
                return
            }

            let playerView = VideoaulaPlayerView(
                aula: aula,
                playlist: [
                    aula,
                    NativeVideoaulaItem(id: "p2", videoId: videoId, titulo: "Aula 2 - Aplicação Prática e Jurisprudência", area: area, duracaoSegundos: 1600, descricao: "Estudos de casos reais dos tribunais."),
                    NativeVideoaulaItem(id: "p3", videoId: videoId, titulo: "Aula 3 - Resolução de Questões OAB & Concursos", area: area, duracaoSegundos: 1900, descricao: "Fixação e análise de pegadinhas frequentes.")
                ],
                onProgressUpdate: { [weak self] current, dur, completed in
                    self?.notifyListeners("onVideoProgress", data: [
                        "id": id,
                        "videoId": videoId,
                        "currentSeconds": current,
                        "durationSeconds": dur,
                        "completed": completed
                    ])
                },
                onClose: { [weak self] in
                    self?.dismissPlayer()
                    self?.notifyListeners("onClose", data: [:])
                }
            )

            let hostingVC = UIHostingController(rootView: playerView)
            hostingVC.modalPresentationStyle = .fullScreen
            self.playerHostingController = hostingVC
            rootVC.present(hostingVC, animated: true) {
                call.resolve(["success": true])
            }
        }
    }

    @objc func closeVideo(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            self?.dismissPlayer()
            self?.dismissHub()
            call.resolve(["success": true])
        }
    }

    private func dismissHub() {
        hubHostingController?.dismiss(animated: true) { [weak self] in
            self?.hubHostingController = nil
        }
    }

    private func dismissPlayer() {
        playerHostingController?.dismiss(animated: true) { [weak self] in
            self?.playerHostingController = nil
        }
    }
}
