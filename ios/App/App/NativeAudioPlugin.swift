import Foundation
import Capacitor
import AVFoundation
import MediaPlayer

@objc(NativeAudioPlugin)
public class NativeAudioPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "NativeAudioPlugin"
    public let jsName = "NativeAudio"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "prepare", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "play", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "pause", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "seek", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getProgress", returnType: CAPPluginReturnPromise)
    ]

    private var queuePlayer: AVQueuePlayer?
    private var introItem: AVPlayerItem?
    private var mainItem: AVPlayerItem?
    
    // Crossfade observer token
    private var timeObserverToken: Any?
    private var isFading = false

    override public func load() {
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default)
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            print("Failed to set audio session category: \(error)")
        }
        setupRemoteCommandCenter()
    }

    @objc func prepare(_ call: CAPPluginCall) {
        let introUrlStr = call.getString("introUrl")
        guard let mainUrlStr = call.getString("mainUrl"),
              let mainUrl = URL(string: mainUrlStr) else {
            call.reject("Invalid Main URL")
            return
        }

        let title = call.getString("title") ?? "Áudio"
        let author = call.getString("author") ?? "APP.PRIME"

        if let introUrlStr = introUrlStr, let introUrl = URL(string: introUrlStr) {
            introItem = AVPlayerItem(url: introUrl)
        } else {
            introItem = nil
        }
        
        mainItem = AVPlayerItem(url: mainUrl)

        if queuePlayer == nil {
            queuePlayer = AVQueuePlayer()
        } else {
            queuePlayer?.removeAllItems()
        }

        if let intro = introItem, let main = mainItem {
            queuePlayer?.insert(intro, after: nil)
            queuePlayer?.insert(main, after: intro)
        } else if let main = mainItem {
            queuePlayer?.insert(main, after: nil)
        }

        setupNowPlaying(title: title, author: author)

        call.resolve(["success": true])
    }

    @objc func play(_ call: CAPPluginCall) {
        queuePlayer?.play()
        updateNowPlayingPlaybackState()
        call.resolve()
    }

    @objc func pause(_ call: CAPPluginCall) {
        queuePlayer?.pause()
        updateNowPlayingPlaybackState()
        call.resolve()
    }

    @objc func seek(_ call: CAPPluginCall) {
        let time = call.getDouble("time") ?? 0
        
        guard let currentItem = queuePlayer?.currentItem else {
            call.resolve()
            return
        }

        // Simplesmente foca no item atual. (Para crossfade perfeito precisaria calcular se cai na intro ou no main)
        // Para simplificar, assumimos seek no item atual (que geralmente é o Main quando o usuário usa a barra)
        let cmTime = CMTime(seconds: time, preferredTimescale: 1000)
        currentItem.seek(to: cmTime, completionHandler: { _ in
            call.resolve()
        })
    }

    @objc func stop(_ call: CAPPluginCall) {
        queuePlayer?.pause()
        queuePlayer?.removeAllItems()
        MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
        call.resolve()
    }

    @objc func getProgress(_ call: CAPPluginCall) {
        let currentTime = queuePlayer?.currentTime().seconds ?? 0
        let duration = queuePlayer?.currentItem?.duration.seconds ?? 0
        let isPlaying = queuePlayer?.rate != 0
        let currentItem = queuePlayer?.currentItem
        let trackIndex = (currentItem == introItem && introItem != nil) ? 0 : 1

        call.resolve([
            "currentTime": currentTime.isNaN ? 0 : currentTime,
            "duration": duration.isNaN ? 0 : duration,
            "isPlaying": isPlaying,
            "trackIndex": trackIndex
        ])
    }

    private func setupNowPlaying(title: String, author: String) {
        var nowPlayingInfo = [String: Any]()
        nowPlayingInfo[MPMediaItemPropertyTitle] = title
        nowPlayingInfo[MPMediaItemPropertyArtist] = author
        MPNowPlayingInfoCenter.default().nowPlayingInfo = nowPlayingInfo
    }

    private func updateNowPlayingPlaybackState() {
        var nowPlayingInfo = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? [String: Any]()
        let isPlaying = queuePlayer?.rate != 0
        let currentTime = queuePlayer?.currentTime().seconds ?? 0
        let duration = queuePlayer?.currentItem?.duration.seconds ?? 0
        
        nowPlayingInfo[MPNowPlayingInfoPropertyElapsedPlaybackTime] = currentTime
        nowPlayingInfo[MPMediaItemPropertyPlaybackDuration] = duration
        nowPlayingInfo[MPNowPlayingInfoPropertyPlaybackRate] = isPlaying ? 1.0 : 0.0
        
        MPNowPlayingInfoCenter.default().nowPlayingInfo = nowPlayingInfo
    }

    private func setupRemoteCommandCenter() {
        let commandCenter = MPRemoteCommandCenter.shared()

        commandCenter.playCommand.addTarget { [weak self] event in
            self?.queuePlayer?.play()
            self?.updateNowPlayingPlaybackState()
            return .success
        }

        commandCenter.pauseCommand.addTarget { [weak self] event in
            self?.queuePlayer?.pause()
            self?.updateNowPlayingPlaybackState()
            return .success
        }
    }
}
