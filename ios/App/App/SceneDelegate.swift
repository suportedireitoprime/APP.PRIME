import UIKit
import Capacitor

class MainViewController: CAPBridgeViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        disableScrollIndicators()
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        disableScrollIndicators()
    }

    private func disableScrollIndicators() {
        webView?.scrollView.showsVerticalScrollIndicator = false
        webView?.scrollView.showsHorizontalScrollIndicator = false
    }
}

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = MainViewController()
        window?.makeKeyAndVisible()
        
        setupNativeSplash()
    }

    private func setupNativeSplash() {
        guard let window = self.window else { return }

        let splashView = UIView(frame: window.bounds)
        splashView.backgroundColor = UIColor(red: 13/255.0, green: 13/255.0, blue: 13/255.0, alpha: 1.0)
        
        let logo = UIImageView(image: UIImage(named: "SplashIcon"))
        logo.contentMode = .scaleAspectFit
        logo.translatesAutoresizingMaskIntoConstraints = false
        logo.alpha = 0
        logo.transform = CGAffineTransform(scaleX: 0.5, y: 0.5)

        let title = UILabel()
        title.text = "Estudos Jurídicos"
        title.textColor = .white
        title.font = UIFont.italicSystemFont(ofSize: 36)
        title.translatesAutoresizingMaskIntoConstraints = false
        title.alpha = 0
        title.transform = CGAffineTransform(translationX: 0, y: 50)

        let subtitle = UILabel()
        subtitle.text = "USO PROFISSIONAL"
        subtitle.textColor = UIColor(white: 1.0, alpha: 0.9)
        subtitle.font = UIFont.boldSystemFont(ofSize: 12)
        subtitle.translatesAutoresizingMaskIntoConstraints = false
        subtitle.alpha = 0
        subtitle.transform = CGAffineTransform(translationX: 0, y: 50)

        splashView.addSubview(logo)
        splashView.addSubview(title)
        splashView.addSubview(subtitle)

        NSLayoutConstraint.activate([
            logo.centerXAnchor.constraint(equalTo: splashView.centerXAnchor),
            logo.centerYAnchor.constraint(equalTo: splashView.centerYAnchor, constant: -40),
            logo.widthAnchor.constraint(equalToConstant: 160),
            logo.heightAnchor.constraint(equalToConstant: 160),
            
            title.centerXAnchor.constraint(equalTo: splashView.centerXAnchor),
            title.topAnchor.constraint(equalTo: logo.bottomAnchor, constant: 16),
            
            subtitle.centerXAnchor.constraint(equalTo: splashView.centerXAnchor),
            subtitle.topAnchor.constraint(equalTo: title.bottomAnchor, constant: 8)
        ])

        window.addSubview(splashView)

        UIView.animate(withDuration: 0.5, delay: 0, usingSpringWithDamping: 0.8, initialSpringVelocity: 0.5, options: .curveEaseInOut, animations: {
            logo.alpha = 1
            logo.transform = CGAffineTransform(scaleX: 1.05, y: 1.05)
        })

        UIView.animate(withDuration: 0.5, delay: 0.3, options: .curveEaseOut, animations: {
            title.alpha = 1
            title.transform = .identity
        })

        UIView.animate(withDuration: 0.5, delay: 0.6, options: .curveEaseOut, animations: {
            subtitle.alpha = 1
            subtitle.transform = .identity
        })

        // Dismiss the splash view after animation completes (simulating 3s)
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.5) {
            UIView.animate(withDuration: 0.4, animations: {
                splashView.alpha = 0
            }) { _ in
                splashView.removeFromSuperview()
            }
        }
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    }
}
