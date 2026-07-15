#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# Super Work service agreement (Lao), 1 page. Lao->Phetsarath, Latin->Helvetica.
import os
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.lib.units import mm

FONT_DIR = os.path.join(os.path.dirname(__file__), "fonts")
REG, BOLD = "Phetsarath", "Phetsarath-Bold"
pdfmetrics.registerFont(TTFont(REG, os.path.join(FONT_DIR, "Phetsarath-Regular.ttf")))
try:
    pdfmetrics.registerFont(TTFont(BOLD, os.path.join(FONT_DIR, "Phetsarath-Bold.ttf")))
except Exception:
    BOLD = REG

OUT = os.path.join(os.path.dirname(__file__), "public", "super-work-agreement.pdf")
W, H = A4
LEFT, RIGHT = 25 * mm, W - 25 * mm


def is_lao(ch):
    return "຀" <= ch <= "໿"


def _segs(text):
    out, cur, curlao = [], "", None
    for ch in text:
        lao = is_lao(ch)
        if curlao is None or lao == curlao:
            cur += ch; curlao = lao
        else:
            out.append((cur, curlao)); cur, curlao = ch, lao
    if cur:
        out.append((cur, curlao))
    return out


def _fonts(bold):
    return (BOLD if bold else REG), ("Helvetica-Bold" if bold else "Helvetica")


def measure(text, size, bold=False):
    laoF, latF = _fonts(bold)
    return sum(stringWidth(s, laoF if isl else latF, size) for s, isl in _segs(text))


def main():
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    c = canvas.Canvas(OUT, pagesize=A4)

    def draw(x, y, text, size, bold=False, color=(0, 0, 0)):
        laoF, latF = _fonts(bold)
        c.setFillColorRGB(*color)
        for s, isl in _segs(text):
            f = laoF if isl else latF
            c.setFont(f, size); c.drawString(x, y, s); x += stringWidth(s, f, size)

    def center(y, text, size, bold=False):
        draw(W / 2 - measure(text, size, bold) / 2, y, text, size, bold)

    def wrap(text, size, max_w, bold=False):
        words, lines, cur = text.split(" "), [], ""
        for w in words:
            t = (cur + " " + w).strip()
            if measure(t, size, bold) <= max_w:
                cur = t
            else:
                if cur:
                    lines.append(cur)
                cur = w
        if cur:
            lines.append(cur)
        return lines

    y = H - 24 * mm
    center(y, "ສັນຍາການໃຫ້ບໍລິການ", 17, True); y -= 7 * mm
    center(y, "ໂຄງການລະບົບ Super Work", 13, True); y -= 6 * mm
    center(y, "ເລກທີ: 042-A/AIDC.2026 · ນະຄອນຫຼວງວຽງຈັນ, ວັນທີ 15 ກໍລະກົດ 2026", 10); y -= 12 * mm

    draw(LEFT, y, "ສັນຍາສະບັບນີ້ ເຮັດຂຶ້ນລະຫວ່າງ:", 11.5, True); y -= 8 * mm
    for it in [
        "ຝ່າຍ ກ (ຜູ້ໃຫ້ບໍລິການ):  ບໍລິສັດ At AIDC Tech Sole Co., Ltd.",
        "ຝ່າຍ ຂ (ຜູ້ຮັບບໍລິການ):  ...................................................................",
    ]:
        draw(LEFT, y, it, 11.5); y -= 7 * mm
    y -= 4 * mm

    clauses = [
        ("ຂໍ້ 1. ຂອບເຂດການໃຫ້ບໍລິການ",
         "ຝ່າຍ ກ ຕົກລົງໃຫ້ບໍລິການຕິດຕັ້ງ, ຝຶກອົບຮົມ ແລະ ບຳລຸງຮັກສາ ລະບົບ Super Work ແກ່ຝ່າຍ ຂ ຕາມຂອບເຂດທີ່ໄດ້ຕົກລົງກັນ."),
        ("ຂໍ້ 2. ໄລຍະເວລາ",
         "ສັນຍານີ້ມີຜົນບັງຄັບໃຊ້ ເປັນເວລາ 12 ເດືອນ ນັບແຕ່ວັນທີ ທັງສອງຝ່າຍ ໄດ້ລົງລາຍເຊັນ."),
        ("ຂໍ້ 3. ຄ່າບໍລິການ ແລະ ການຊຳລະ",
         "ຝ່າຍ ຂ ຕົກລົງຊຳລະຄ່າບໍລິການ ຕາມໃບແຈ້ງໜີ້ ພາຍໃນ 30 ວັນ ນັບແຕ່ວັນທີ່ໄດ້ຮັບການບໍລິການ."),
        ("ຂໍ້ 4. ການຮັກສາຄວາມລັບ",
         "ທັງສອງຝ່າຍ ຕ້ອງຮັກສາຄວາມລັບ ຂອງຂໍ້ມູນ ທີ່ໄດ້ຮັບຮູ້ ຈາກການປະຕິບັດສັນຍາ."),
    ]
    for head, para in clauses:
        draw(LEFT, y, head, 11.5, True); y -= 6.5 * mm
        for ln in wrap(para, 11, RIGHT - LEFT):
            draw(LEFT, y, ln, 11); y -= 6 * mm
        y -= 3 * mm

    # ── signature blocks (2 ຝ່າຍ) ──
    y -= 6 * mm
    colL, colR = LEFT + 22 * mm, RIGHT - 22 * mm
    draw(colL - measure("ຝ່າຍ ກ (ຜູ້ໃຫ້ບໍລິການ)", 11, True) / 2, y, "ຝ່າຍ ກ (ຜູ້ໃຫ້ບໍລິການ)", 11, True)
    draw(colR - measure("ຝ່າຍ ຂ (ຜູ້ຮັບບໍລິການ)", 11, True) / 2, y, "ຝ່າຍ ຂ (ຜູ້ຮັບບໍລິການ)", 11, True)
    y -= 24 * mm
    for cx in (colL, colR):
        draw(cx - measure("( ............................ )", 11) / 2, y, "( ............................ )", 11)
    y -= 6 * mm
    draw(colL - measure("Mr. PHEUTSAPHA PHOUMMASAK", 10.5, True) / 2, y, "Mr. PHEUTSAPHA PHOUMMASAK", 10.5, True)
    draw(colR - measure("...............................", 10.5) / 2, y, "...............................", 10.5)

    center(15 * mm, "At AIDC Tech Sole Co., Ltd.  ·  Tel: 020-5989-0088  ·  www.aidctech.la", 8.5)
    c.showPage(); c.save()
    print("wrote", OUT, os.path.getsize(OUT), "bytes")


if __name__ == "__main__":
    main()
