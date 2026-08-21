import UIKit
import Capacitor
#if canImport(FBSDKCoreKit)
import FBSDKCoreKit
#endif
#if canImport(FirebaseCore)
import FirebaseCore
#endif
#if canImport(FirebaseAnalytics)
import FirebaseAnalytics
#endif

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        #if canImport(FirebaseCore)
        FirebaseApp.configure()
        #endif
        #if canImport(FBSDKCoreKit)
        _ = ApplicationDelegate.shared.application(application, didFinishLaunchingWithOptions: launchOptions)
        ApplicationDelegate.shared.initializeSDK()
        AppEvents.shared.activateApp()
        AppEvents.shared.logEvent(AppEvents.Name("PageView"))
        #endif
        return true
    }
    
    func applicationWillResignActive(_ application: UIApplication) {
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
    }

    func applicationWillTerminate(_ application: UIApplication) {
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        #if canImport(FBSDKCoreKit)
        if ApplicationDelegate.shared.application(app, open: url, options: options) {
            return true
        }
        #endif
        return false
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return false
    }
}
