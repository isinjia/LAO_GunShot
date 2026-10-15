"""Local static server: gzip for text assets, ETag revalidation (a reload only re-downloads files that changed)."""
import gzip
import http.server
import os
import sys

TEXT = ('.js', '.css', '.html', '.json', '.svg', '.webmanifest', '.txt')
_gz = {}  # (path, mtime, size) -> gzipped bytes


class Handler(http.server.SimpleHTTPRequestHandler):
    STATIC = ('/assets/', '/js/sd/', '/js/fx/', '/js/vendor/')

    def end_headers(self):
        # code and pages always revalidate (edits show up at once); bulky static media is cached for an hour
        p = self.path.split('?')[0]
        self.send_header("Cache-Control", "public, max-age=3600" if p.startswith(self.STATIC) else "no-cache")
        super().end_headers()

    def send_head(self):
        path = self.translate_path(self.path)
        if os.path.isdir(path) or not os.path.isfile(path):
            return super().send_head()
        st = os.stat(path)
        etag = '"%x-%x"' % (int(st.st_mtime * 1000), st.st_size)
        if self.headers.get("If-None-Match") == etag:
            self.send_response(304)
            self.send_header("ETag", etag)
            self.end_headers()
            return None
        ctype = self.guess_type(path)
        use_gz = path.lower().endswith(TEXT) and "gzip" in (self.headers.get("Accept-Encoding") or "")
        if use_gz:
            key = (path, st.st_mtime, st.st_size)
            body = _gz.get(key)
            if body is None:
                with open(path, "rb") as f:
                    body = gzip.compress(f.read(), 6)
                _gz[key] = body
            self.send_response(200)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Encoding", "gzip")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("ETag", etag)
            self.send_header("Vary", "Accept-Encoding")
            self.end_headers()
            from io import BytesIO
            return BytesIO(body)
        f = open(path, "rb")
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(st.st_size))
        self.send_header("ETag", etag)
        self.end_headers()
        return f

    def do_PUT(self):
        # dev-only: lets tools/lab/fbxdump.html save converted FBX data
        name = os.path.basename(self.path)
        if not self.path.startswith("/tools/lab/out/") or not name.endswith(".json"):
            self.send_error(403)
            return
        data = self.rfile.read(int(self.headers["Content-Length"]))
        os.makedirs("tools/lab/out", exist_ok=True)
        with open(os.path.join("tools/lab/out", name), "wb") as f:
            f.write(data)
        self.send_response(204)
        self.end_headers()

    def log_message(self, *a):
        pass


if __name__ == "__main__":
    os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    class Server(http.server.ThreadingHTTPServer):
        request_queue_size = 128  # the default backlog (5) refuses bursts of parallel asset requests
        daemon_threads = True
    Server(("127.0.0.1", port), Handler).serve_forever()
