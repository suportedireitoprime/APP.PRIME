import Foundation
import Capacitor
import UIKit
import PDFKit

@objc(NativePdfViewer)
public class NativePdfViewerPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "NativePdfViewerPlugin"
    public let jsName = "NativePdfViewer"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "openPdf", returnType: CAPPluginReturnPromise)
    ]

    private var pdfViewController: UIViewController?

    @objc func openPdf(_ call: CAPPluginCall) {
        guard let urlStr = call.getString("url"), !urlStr.isEmpty else {
            call.reject("URL do PDF não informada")
            return
        }

        let title = call.getString("title") ?? "Documento PDF"
        let initialPage = call.getInt("initialPage") ?? 1
        let isDarkMode = call.getBoolean("isDarkMode") ?? false

        DispatchQueue.main.async { [weak self] in
            guard let self = self, let rootVC = self.bridge?.viewController else {
                call.reject("View controller raiz não encontrado")
                return
            }

            let pdfVC = PdfReaderViewController(
                urlStr: urlStr,
                docTitle: title,
                initialPage: initialPage,
                isDarkMode: isDarkMode,
                onClose: { [weak self] in
                    self?.pdfViewController?.dismiss(animated: true) {
                        call.resolve(["success": true])
                    }
                }
            )

            let navVC = UINavigationController(rootViewController: pdfVC)
            navVC.modalPresentationStyle = .fullScreen
            navVC.navigationBar.barTintColor = isDarkMode ? UIColor(white: 0.08, alpha: 1.0) : .white
            navVC.navigationBar.tintColor = isDarkMode ? .white : .black
            navVC.navigationBar.titleTextAttributes = [
                .foregroundColor: isDarkMode ? UIColor.white : UIColor.black
            ]

            self.pdfViewController = navVC
            rootVC.present(navVC, animated: true, completion: nil)
        }
    }
}

class PdfReaderViewController: UIViewController {
    private let urlStr: String
    private let docTitle: String
    private let initialPage: Int
    private var isDarkMode: Bool
    private let onClose: () -> Void

    private var pdfView: PDFView!
    private var activityIndicator: UIActivityIndicatorView!

    init(urlStr: String, docTitle: String, initialPage: Int, isDarkMode: Bool, onClose: @escaping () -> Void) {
        self.urlStr = urlStr
        self.docTitle = docTitle
        self.initialPage = initialPage
        self.isDarkMode = isDarkMode
        self.onClose = onClose
        super.init(nibName: nil, bundle: nil)
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = isDarkMode ? UIColor(white: 0.05, alpha: 1.0) : UIColor(white: 0.95, alpha: 1.0)
        title = docTitle

        setupNavigationBar()
        setupPdfView()
        loadPdfDocument()
    }

    private func setupNavigationBar() {
        let backBtn = UIBarButtonItem(
            image: UIImage(systemName: "chevron.backward"),
            style: .plain,
            target: self,
            action: #selector(handleClose)
        )
        navigationItem.leftBarButtonItem = backBtn

        let modeBtn = UIBarButtonItem(
            image: UIImage(systemName: isDarkMode ? "sun.max.fill" : "moon.fill"),
            style: .plain,
            target: self,
            action: #selector(toggleDarkMode)
        )
        navigationItem.rightBarButtonItem = modeBtn
    }

    private func setupPdfView() {
        pdfView = PDFView(frame: view.bounds)
        pdfView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        pdfView.autoScales = true
        pdfView.displayMode = .singlePageContinuous
        pdfView.displayDirection = .vertical
        pdfView.backgroundColor = isDarkMode ? UIColor(white: 0.07, alpha: 1.0) : UIColor(white: 0.95, alpha: 1.0)
        view.addSubview(pdfView)

        activityIndicator = UIActivityIndicatorView(style: .large)
        activityIndicator.center = view.center
        activityIndicator.color = .systemYellow
        activityIndicator.hidesWhenStopped = true
        view.addSubview(activityIndicator)
    }

    private func loadPdfDocument() {
        activityIndicator.startAnimating()

        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            guard let self = self else { return }

            var localUrl: URL?
            if self.urlStr.hasPrefix("http://") || self.urlStr.hasPrefix("https://"),
               let remoteUrl = URL(string: self.urlStr) {
                let cacheFile = FileManager.default.temporaryDirectory
                    .appendingPathComponent("doc_\(self.urlStr.hashValue).pdf")

                if FileManager.default.fileExists(atPath: cacheFile.path) {
                    localUrl = cacheFile
                } else if let data = try? Data(contentsOf: remoteUrl) {
                    try? data.write(to: cacheFile)
                    localUrl = cacheFile
                }
            } else if let fileUrl = URL(string: self.urlStr) {
                localUrl = fileUrl
            } else {
                localUrl = URL(fileURLWithPath: self.urlStr)
            }

            guard let finalUrl = localUrl, let document = PDFDocument(url: finalUrl) else {
                DispatchQueue.main.async {
                    self.activityIndicator.stopAnimating()
                }
                return
            }

            DispatchQueue.main.async {
                self.activityIndicator.stopAnimating()
                self.pdfView.document = document
                if self.initialPage > 1, let page = document.page(at: self.initialPage - 1) {
                    self.pdfView.go(to: page)
                }
            }
        }
    }

    @objc private func handleClose() {
        onClose()
    }

    @objc private func toggleDarkMode() {
        isDarkMode = !isDarkMode
        view.backgroundColor = isDarkMode ? UIColor(white: 0.05, alpha: 1.0) : UIColor(white: 0.95, alpha: 1.0)
        pdfView.backgroundColor = isDarkMode ? UIColor(white: 0.07, alpha: 1.0) : UIColor(white: 0.95, alpha: 1.0)
        navigationItem.rightBarButtonItem?.image = UIImage(systemName: isDarkMode ? "sun.max.fill" : "moon.fill")
    }
}
