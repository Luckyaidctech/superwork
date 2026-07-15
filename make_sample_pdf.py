#!/usr/bin/env python3
"""Generate a minimal but valid 2-page PDF (no external libs)."""
import os

def make_pdf(path):
    objs = []

    # 1 Catalog, 2 Pages, 3+4 Page objects, 5+6 Content, 7 Font
    catalog = b"<< /Type /Catalog /Pages 2 0 R >>"
    pages = b"<< /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >>"

    def page(content_ref):
        return (b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 420 594] "
                b"/Resources << /Font << /F1 7 0 R >> >> /Contents %d 0 R >>" % content_ref)

    def content(lines):
        body = b"BT /F1 20 Tf 50 520 Td 24 TL "
        for i, ln in enumerate(lines):
            body += b"(%s) Tj T* " % ln.encode("latin-1", "replace")
        body += b"ET"
        return b"<< /Length %d >>\nstream\n%s\nendstream" % (len(body), body)

    c1 = content([
        "LAO PDR - CERTIFICATE (Page 1)",
        "Direct Foreign Investment",
        "Enterprise: HAIXIN AUTO IMPORT-EXPORT",
        "Registered Capital: 440,000,000 LAK",
        "",
        "This is a SAMPLE document for testing",
        "the E-Signature placement flow.",
        "",
        "Tap a signer, then tap here to place",
        "a signature field.",
    ])
    c2 = content([
        "CERTIFICATE (Page 2)",
        "",
        "Signatures:",
        "1) ____________________",
        "2) ____________________",
        "3) ____________________",
        "",
        "Date: __/__/____",
    ])
    font = b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"

    objects = [catalog, pages, page(5), page(6), c1, c2, font]

    out = bytearray()
    out += b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n"
    offsets = []
    for i, obj in enumerate(objects, start=1):
        offsets.append(len(out))
        out += b"%d 0 obj\n" % i
        out += obj
        out += b"\nendobj\n"

    xref_pos = len(out)
    n = len(objects) + 1
    out += b"xref\n0 %d\n" % n
    out += b"0000000000 65535 f \n"
    for off in offsets:
        out += b"%010d 00000 n \n" % off

    out += b"trailer\n<< /Size %d /Root 1 0 R >>\n" % n
    out += b"startxref\n%d\n%%%%EOF" % xref_pos

    with open(path, "wb") as f:
        f.write(out)
    print("wrote", path, len(out), "bytes")

if __name__ == "__main__":
    d = os.path.join(os.path.dirname(__file__), "public")
    os.makedirs(d, exist_ok=True)
    make_pdf(os.path.join(d, "sample.pdf"))
