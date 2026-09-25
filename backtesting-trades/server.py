import http.server
import socketserver
import os

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

if __name__ == '__main__':
    with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
        print(f"🌐 Serving Backtesting Dashboard at http://localhost:{PORT}")
        print(f"Press Ctrl+C to stop the server.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")
