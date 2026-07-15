# e-Signature App — AIDC Tech

Mockup ແອັບເຊັນເອກະສານ ດິຈິຕໍລ (prototype) ສຳລັບ AIDC Tech Sole Co., Ltd.
ພາສາ: ລາວ · React + Vite

## ໂມດູນຫຼັກ

| ໂມດູນ | ລາຍລະອຽດ |
|---|---|
| **My e-Signature** | ສ້າງຄຳຂໍລົງນາມ → ວາງຊ່ອງລາຍເຊັນ → ສົ່ງ → ລົງນາມ (ວາດ / LANIT digital signature) |
| **Approval** | ສູນອະນຸມັດ 8 ໝວດ: ຂໍລາຍເຊັນ · ຄະແນນ Workboard · ໂອທີ · ລາພັກ · ວຽກນອກສະຖານທີ · ຈອງ · ຄວາມຮູ້ |

## ຄວາມສາມາດ

- ເປີດ PDF ຈິງ (pdfjs-dist) ຂະໜາດ A4 ພ້ອມ QR ແລະ ວັນທີ ທຸກໜ້າ
- ລາຍເຊັນ: ວາດເອງ / LANIT verified stamp — ບັນທຶກລົງເອກະສານຈິງ (ຍ້າຍ · ປັບຂະໜາດ · ລຶບໄດ້)
- Flow ຄົບ: ສ້າງ → ລົງນາມ → ອະນຸມັດ / ປະຕິເສດ (ພ້ອມເຫດຜົນ) → ຍົກເລີກ → ແຈ້ງເຕືອນ
- ຄວາມຄິດເຫັນ: ຕອບກັບ · @mention · ແນບຮູບ/ວິດີໂອ/ໄຟລ໌ ພ້ອມ preview
- ສະຫຼັບຜູ້ໃຊ້ (demo) ເພື່ອທົດສອບ flow ທັງສອງຝ່າຍ

## ເລີ່ມໃຊ້ງານ

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # ສ້າງ dist/ ສຳລັບ deploy
```

## ໂຄງສ້າງ

```
src/
├── App.jsx              # state ກາງ + handler ທັງໝົດ (docs, notis, points)
├── styles.css           # style ທັງໝົດ
├── flow/                # ຂັ້ນຕອນສ້າງຄຳຂໍ + ໜ້າລົງນາມ
│   ├── shared.jsx       # Icon · DIRECTORY · ResultPopup · ReasonModal · LanitStamp
│   ├── PdfViewer.jsx    # render PDF + ຊ່ອງລາຍເຊັນ
│   ├── SignScreen.jsx   # ໜ້າລົງນາມ
│   └── Step1–Step3      # ຂໍ້ມູນ → ວາງລາຍເຊັນ → ກວດ/ສົ່ງ
├── home/
│   ├── HomeScreen.jsx   # ໜ້າຫຼັກ + ສູນອະນຸມັດ
│   ├── DocDetail.jsx    # ລາຍລະອຽດເອກະສານ
│   ├── PointsRequest.jsx
│   └── data.js          # ຂໍ້ມູນ demo
public/                  # PDF ຕົວຢ່າງ
fonts/                   # Phetsarath (ຟອນລາວ)
```

> ໝາຍເຫດ: ນີ້ແມ່ນ prototype — ຂໍ້ມູນເກັບໃນ state ຂອງ browser, ຍັງບໍ່ມີ backend, refresh ແລ້ວຈະກັບຄືນຄ່າເລີ່ມຕົ້ນ.
