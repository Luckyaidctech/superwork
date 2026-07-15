#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# Super Work invitation letter (Lao), 2 pages.
# Lao glyphs -> Phetsarath ; Latin/digits -> Helvetica (Phetsarath has no Latin).
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

OUT = os.path.join(os.path.dirname(__file__), "public", "super-work-invitation.pdf")
W, H = A4
LEFT, RIGHT = 25 * mm, W - 25 * mm


def is_lao(ch):
    return "຀" <= ch <= "໿"


def _segs(text):
    out, cur, curlao = [], "", None
    for ch in text:
        lao = is_lao(ch)
        if curlao is None or lao == curlao:
            cur += ch
            curlao = lao
        else:
            out.append((cur, curlao))
            cur, curlao = ch, lao
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
            c.setFont(f, size)
            c.drawString(x, y, s)
            x += stringWidth(s, f, size)

    def center(y, text, size, bold=False, color=(0, 0, 0)):
        draw(W / 2 - measure(text, size, bold) / 2, y, text, size, bold, color)

    def right(rx, y, text, size, bold=False, color=(0, 0, 0)):
        draw(rx - measure(text, size, bold), y, text, size, bold, color)

    def wrap(text, size, max_w, bold=False):
        words, lines, cur = text.split(" "), [], ""
        for w in words:
            test = (cur + " " + w).strip()
            if measure(test, size, bold) <= max_w:
                cur = test
            else:
                if cur:
                    lines.append(cur)
                cur = w
        if cur:
            lines.append(cur)
        return lines

    # ══════════════ ໜ້າ 1 : ໜັງສືເຊີນ ══════════════
    y = H - 22 * mm
    center(y, "ສາທາລະນະລັດ ປະຊາທິປະໄຕ ປະຊາຊົນລາວ", 15, True); y -= 6 * mm
    center(y, "ສັນຕິພາບ ເອກະລາດ ປະຊາທິປະໄຕ ເອກະພາບ ວັດທະນະຖາວອນ", 12, True); y -= 3 * mm
    c.setStrokeColorRGB(0, 0, 0); c.setLineWidth(0.8)
    c.line(W / 2 - 48 * mm, y, W / 2 + 48 * mm, y); y -= 9 * mm

    draw(LEFT, y, "ບໍລິສັດ At AIDC Tech Sole Co., Ltd.", 12, True)
    right(RIGHT, y, "ນະຄອນຫຼວງວຽງຈັນ, ວັນທີ 15 ກໍລະກົດ 2026", 11); y -= 5.5 * mm
    draw(LEFT, y, "ນະຄອນຫຼວງວຽງຈັນ, ສປປ ລາວ", 10)
    right(RIGHT, y, "ເລກທີ: 042/AIDC.2026", 11); y -= 14 * mm

    center(y, "ໜັງສືເຊີນ", 17, True); y -= 8 * mm
    center(y, "ເຊີນເຂົ້າຮ່ວມງານເປີດໂຕໂຄງການ Super Work", 12.5, True); y -= 12 * mm

    draw(LEFT, y, "ຮຽນ: ທ່ານ ຫົວໜ້າ ແລະ ຜູ້ບໍລິຫານ ກະຊວງ ທີ່ກ່ຽວຂ້ອງ", 12, True); y -= 10 * mm
    body = [
        "ດ້ວຍ ບໍລິສັດ At AIDC Tech Sole Co., Ltd. ມີຄວາມຍິນດີ ແລະ ເປັນກຽດ ຂໍຮຽນເຊີນ ທ່ານ ເຂົ້າຮ່ວມ"
        " ງານເປີດໂຕໂຄງການ Super Work ຊຶ່ງເປັນໂຄງການລະບົບບໍລິຫານຈັດການວຽກ ແລະ ເອກະສານ"
        " ອິເລັກໂທຣນິກ ທີ່ພັດທະນາຂຶ້ນເພື່ອຍົກລະດັບປະສິດທິພາບ ການເຮັດວຽກ ຂອງພາກລັດ ແລະ ເອກະຊົນ.",
        "ງານດັ່ງກ່າວ ຈະໄດ້ຈັດຂຶ້ນ ໃນວັນທີ 25 ກໍລະກົດ 2026, ເວລາ 09:00 ໂມງ ເປັນຕົ້ນໄປ,"
        " ທີ່ ໂຮງແຮມ ແລນມາກ ນະຄອນຫຼວງວຽງຈັນ, ສປປ ລາວ. (ລາຍລະອຽດກຳນົດການ ຢູ່ໜ້າທີ 2)",
        "ດ້ວຍເຫດນີ້, ຈຶ່ງຮຽນເຊີນມາຍັງທ່ານ ດ້ວຍຄວາມນັບຖື ແລະ ຫວັງເປັນຢ່າງຍິ່ງວ່າ ຈະໄດ້ຮັບກຽດ"
        " ຈາກທ່ານ ເຂົ້າຮ່ວມງານໃນຄັ້ງນີ້.",
    ]
    for para in body:
        for ln in wrap(para, 11.5, RIGHT - LEFT):
            draw(LEFT, y, ln, 11.5); y -= 6.2 * mm
        y -= 3 * mm

    y -= 4 * mm
    cx = RIGHT - 32 * mm
    center2 = lambda yy, t, s, b=False: draw(cx - measure(t, s, b) / 2, yy, t, s, b)
    center2(y, "ຂໍສະແດງຄວາມນັບຖື", 11.5); y -= 8 * mm
    center2(y, "ຜູ້ອຳນວຍການໃຫຍ່", 11.5); y -= 24 * mm
    center2(y + 4 * mm, "( ................................. )", 11.5)
    center2(y - 2 * mm, "Mr. PHEUTSAPHA PHOUMMASAK", 11.5, True)

    center(15 * mm, "At AIDC Tech Sole Co., Ltd.  ·  Tel: 020-5989-0088  ·  www.aidctech.la  ·  ໜ້າ 1/2", 8.5, False, (.5, .5, .5))
    c.showPage()

    # ══════════════ ໜ້າ 2 : ກຳນົດການ ══════════════
    y = H - 24 * mm
    center(y, "ກຳນົດການງານເປີດໂຕໂຄງການ Super Work", 15, True); y -= 6.5 * mm
    center(y, "ວັນທີ 25 ກໍລະກົດ 2026 · ໂຮງແຮມ ແລນມາກ ນະຄອນຫຼວງວຽງຈັນ", 11); y -= 12 * mm

    agenda = [
        ("08:30 - 09:00", "ລົງທະບຽນ ແລະ ຮັບເອກະສານ"),
        ("09:00 - 09:15", "ພິທີກອນ ກ່າວເປີດງານ"),
        ("09:15 - 09:45", "ກ່າວຕ້ອນຮັບ ໂດຍ ຜູ້ອຳນວຍການໃຫຍ່"),
        ("09:45 - 10:30", "ນຳສະເໜີ ໂຄງການ Super Work ແລະ ວິໄສທັດ"),
        ("10:30 - 10:45", "ພັກເບຣກ / ຖ່າຍຮູບຮ່ວມກັນ"),
        ("10:45 - 11:30", "ສາທິດການນຳໃຊ້ລະບົບ ແລະ ຖາມ-ຕອບ"),
        ("11:30 - 12:00", "ພິທີກອນ ປິດງານ"),
        ("12:00 ໂມງ", "ຮ່ວມຮັບປະທານອາຫານທ່ຽງ"),
    ]
    for t, act in agenda:
        draw(LEFT, y, t, 11, True, (.13, .25, .71))
        draw(LEFT + 40 * mm, y, act, 11.5)
        c.setStrokeColorRGB(.9, .9, .93); c.setLineWidth(0.6)
        c.line(LEFT, y - 3 * mm, RIGHT, y - 3 * mm)
        y -= 9 * mm

    y -= 6 * mm
    draw(LEFT, y, "ຂໍ້ມູນ ແລະ ການຢືນຢັນເຂົ້າຮ່ວມ", 12.5, True); y -= 8 * mm
    for it in [
        "ສະຖານທີ່:  ຫ້ອງປະຊຸມໃຫຍ່ ຊັ້ນ 3, ໂຮງແຮມ ແລນມາກ ນະຄອນຫຼວງວຽງຈັນ",
        "ການແຕ່ງກາຍ:  ຊຸດສຸພາບ / ຊຸດທຳງານ",
        "ຢືນຢັນເຂົ້າຮ່ວມ (RSVP):  ພາຍໃນ ວັນທີ 20 ກໍລະກົດ 2026",
        "ຕິດຕໍ່ປະສານງານ:  ພະແນກ ຈັດຕັ້ງງານ · ໂທ 020-5989-0088",
        "ອີເມວ:  event@aidctech.la",
    ]:
        draw(LEFT, y, it, 11.5); y -= 7.5 * mm

    center(15 * mm, "At AIDC Tech Sole Co., Ltd.  ·  Tel: 020-5989-0088  ·  www.aidctech.la  ·  ໜ້າ 2/2", 8.5, False, (.5, .5, .5))
    c.showPage()
    c.save()
    print("wrote", OUT, os.path.getsize(OUT), "bytes")


if __name__ == "__main__":
    main()
