"""
officer_portal/server.py
------------------------
Dedicated HTTP Server for the Government Officer Console running on http://localhost:3001
"""

import http.server
import socketserver
import os
import sys

PORT = 3001
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class OfficerHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Enable CORS and caching controls
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

def run_server():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("0.0.0.0", PORT), OfficerHTTPRequestHandler) as httpd:
        print(f"============================================================")
        print(f" Government of Maharashtra — MAITRI Officer Portal")
        print(f" Dedicated Officer Console running on: http://localhost:{PORT}")
        print(f" Connected Backend API: http://localhost:8000")
        print(f"============================================================")
        sys.stdout.flush()
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down officer portal server...")

if __name__ == "__main__":
    run_server()
