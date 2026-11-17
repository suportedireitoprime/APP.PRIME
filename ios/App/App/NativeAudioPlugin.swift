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
        CAPPluginMethod(name: "setSpeed", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getProgress", returnType: CAPPluginReturnPromise)
    ]

    private var queuePlayer: AVQueuePlayer?
    private var introItem: AVPlayerItem?
    private var mainItem: AVPlayerItem?
    private var currentSpeed: Float = 1.0
    private var timeObserverToken: Any?
    private var endObserverToken: Any?

    override public func load() {
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default, options: [.allowAirPlay, .allowBluetooth])
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
        currentSpeed = Float(call.getDouble("speed") ?? 1.0)

        cleanupObservers()

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

        setupObservers()
        setupNowPlaying(title: title, author: author)

        call.resolve(["success": true])
    }

    @objc func play(_ call: CAPPluginCall) {
        guard let player = queuePlayer else {
            call.resolve()
            return
        }
        player.play()
        player.rate = currentSpeed
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

        let cmTime = CMTime(seconds: time, preferredTimescale: 1000)
        currentItem.seek(to: cmTime, completionHandler: { [weak self] _ in
            self?.updateNowPlayingPlaybackState()
            call.resolve()
        })
    }

    @objc func setSpeed(_ call: CAPPluginCall) {
        let speed = Float(call.getDouble("speed") ?? 1.0)
        currentSpeed = speed
        if let player = queuePlayer, player.rate != 0 {
            player.rate = speed
        }
        call.resolve()
    }

    @objc func stop(_ call: CAPPluginCall) {
        cleanupObservers()
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

    private func setupObservers() {
        guard let player = queuePlayer else { return }

        // Observer a cada 1 segundo para sincronizar progresso com a interface
        let interval = CMTime(seconds: 1.0, preferredTimescale: CMTimeScale(NSEC_PER_SEC))
        timeObserverToken = player.addPeriodicTimeObserver(forInterval: interval, queue: .main) { [weak self] time in
            guard let self = self, let p = self.queuePlayer else { return }
            let cur = time.seconds
            let dur = p.currentItem?.duration.seconds ?? 0
            let isPlaying = p.rate != 0
            let currentItem = p.currentItem
            let trackIndex = (currentItem == self.introItem && self.introItem != nil) ? 0 : 1

            self.notifyListeners("onTimeUpdate", data: [
                "currentTime": cur.isNaN ? 0 : cur,
                "duration": dur.isNaN ? 0 : dur,
                "isPlaying": isPlaying,
                "trackIndex": trackIndex
            ])
        }

        // Observer para término da reprodução da faixa
        endObserverToken = NotificationCenter.default.addObserver(
            forName: .AVPlayerItemDidPlayToEndTime,
            object: nil,
            queue: .main
        ) { [weak self] notification in
            guard let self = self else { return }
            if let item = notification.object as? AVPlayerItem, item == self.mainItem {
                self.notifyListeners("onEnded", data: [:])
                self.updateNowPlayingPlaybackState()
            }
        }
    }

    private func cleanupObservers() {
        if let token = timeObserverToken {
            queuePlayer?.removeTimeObserver(token)
            timeObserverToken = nil
        }
        if let token = endObserverToken {
            NotificationCenter.default.removeObserver(token)
            endObserverToken = nil
        }
    }

    private func setupNowPlaying(title: String, author: String) {
        var nowPlayingInfo = [String: Any]()
        nowPlayingInfo[MPMediaItemPropertyTitle] = title
        nowPlayingInfo[MPMediaItemPropertyArtist] = author
        MPNowPlayingInfoCenter.default().nowPlayingInfo = nowPlayingInfo
    }

    private func updateNowPlayingPlaybackState() {
        var nowPlayingInfo = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? [String: Any]()
        let isPlaying = (queuePlayer?.rate ?? 0) != 0
        let currentTime = queuePlayer?.currentTime().seconds ?? 0
        let duration = queuePlayer?.currentItem?.duration.seconds ?? 0
        
        nowPlayingInfo[MPNowPlayingInfoPropertyElapsedPlaybackTime] = currentTime
        nowPlayingInfo[MPMediaItemPropertyPlaybackDuration] = duration
        nowPlayingInfo[MPNowPlayingInfoPropertyPlaybackRate] = isPlaying ? Double(currentSpeed) : 0.0
        
        MPNowPlayingInfoCenter.default().nowPlayingInfo = nowPlayingInfo
    }

    private func setupRemoteCommandCenter() {
        let commandCenter = MPRemoteCommandCenter.shared()

        commandCenter.playCommand.addTarget { [weak self] _ in
            guard let self = self, let player = self.queuePlayer else { return .commandFailed }
            player.play()
            player.rate = self.currentSpeed
            self.updateNowPlayingPlaybackState()
            self.notifyListeners("onRemoteAction", data: ["type": "play"])
            return .success
        }

        commandCenter.pauseCommand.addTarget { [weak self] _ in
            guard let self = self, let player = self.queuePlayer else { return .commandFailed }
            player.pause()
            self.updateNowPlayingPlaybackState()
            self.notifyListeners("onRemoteAction", data: ["type": "pause"])
            return .success
        }

        commandCenter.skipForwardCommand.preferredIntervals = [15]
        commandCenter.skipForwardCommand.addTarget { [weak self] _ in
            guard let self = self, let player = self.queuePlayer else { return .commandFailed }
            let current = player.currentTime().seconds
            let dur = player.currentItem?.duration.seconds ?? 0
            let target = min(current + 15, dur)
            player.seek(to: CMTime(seconds: target, preferredTimescale: 1000))
            self.updateNowPlayingPlaybackState()
            self.notifyListeners("onRemoteAction", data: ["type": "seek", "time": target])
            return .success
        }

        commandCenter.skipBackwardCommand.preferredIntervals = [15]
        commandCenter.skipBackwardCommand.addTarget { [weak self] _ in
            guard let self = self, let player = self.queuePlayer else { return .commandFailed }
            let current = player.currentTime().seconds
            let target = max(current - 15, 0)
            player.seek(to: CMTime(seconds: target, preferredTimescale: 1000))
            self.updateNowPlayingPlaybackState()
            self.notifyListeners("onRemoteAction", data: ["type": "seek", "time": target])
            return .success
        }
    }

    deinit {
        cleanupObservers()
    }
}
