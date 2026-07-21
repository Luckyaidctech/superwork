import { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import VerifyScreen from './flow/VerifyScreen.jsx'
// Noto Sans Lao ຝັງໃນ bundle — Lucky ຢືນຢັນ 18/07 ຄ່ຳ: font ມາດຕະຖານຂອງແອັບ = "Noto Sans Lao" ເທົ່ານັ້ນ
import '@fontsource/noto-sans-lao/400.css'
import '@fontsource/noto-sans-lao/500.css'
import '@fontsource/noto-sans-lao/600.css'
import '@fontsource/noto-sans-lao/700.css'
import '@fontsource/noto-sans-lao/800.css'
import './styles.css'

// iPhone 17 Pro Max device frame + status bar
function StatusBar() {
  return (
    <div className="status-bar">
      <span className="sb-time">9:41</span>
      <span className="sb-right">
        <svg viewBox="0 0 18 12" width="18" height="12" aria-hidden="true">
          <rect x="0" y="8" width="3" height="4" rx="1" fill="#fff" />
          <rect x="5" y="5" width="3" height="7" rx="1" fill="#fff" />
          <rect x="10" y="2.5" width="3" height="9.5" rx="1" fill="#fff" />
          <rect x="15" y="0" width="3" height="12" rx="1" fill="#fff" />
        </svg>
        <svg viewBox="0 0 16 12" width="17" height="12" aria-hidden="true">
          <path d="M8 1C11 1 13.7 2.1 15.7 4l-1.5 1.5A9 9 0 0 0 8 3.2 9 9 0 0 0 1.8 5.5L.3 4C2.3 2.1 5 1 8 1zm0 3.7c1.9 0 3.6.7 4.9 1.9l-1.5 1.5A5 5 0 0 0 8 6.8c-1.3 0-2.5.5-3.4 1.3L3.1 6.6A7 7 0 0 1 8 4.7zm0 3.6c.9 0 1.7.3 2.3.9L8 11.5 5.7 9.2c.6-.6 1.4-.9 2.3-.9z" fill="#fff" />
        </svg>
        <span className="sb-batt"><span className="sb-batt-fill" /></span>
      </span>
    </div>
  )
}

// ຂະໜາດ logical ຄົງທີ່ ຂອງ device (px) → scale ທັງກ້ອນໃຫ້ພໍດີ viewport
const DEVICE_W = 428
const DEVICE_H = 927

function Root() {
  useEffect(() => {
    const fit = () => {
      const margin = 24
      const k = Math.min(
        (window.innerWidth - margin) / DEVICE_W,
        (window.innerHeight - margin) / DEVICE_H,
        1.15,
      )
      document.documentElement.style.setProperty('--device-k', String(k))
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  return (
    <div className="stage">
      <div className="device-wrap">
        <div className="device">
          <div className="device-screen">
            <div className="dynamic-island" />
            <div className="phone">
              <StatusBar />
              <App />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const container = document.getElementById('root')
if (!container._reactRoot) container._reactRoot = ReactDOM.createRoot(container)
// ໜ້າກວດສອບເອກະສານ (E5, QR) — ບໍ່ຢູ່ໃນ device frame ເພາະເປັນໜ້າສາທารณะ ໃຜກໍ່ເປີດເບິ່ງໄດ້
// ⚠ Root (App) mount ຢູ່ນຳສະເໝີ (ເຊື່ອງໄວ້) ເພື່ອໃຫ້ useEffect snapshot localStorage ຮັນທັນທີ ບໍ່ວ່າຈະເປີດ URL ໃດກ່ອນກໍ່ຕາມ
//   ບໍ່ຕ້ອງເຂົ້າ "/" ກ່ອນອີກແລ້ວ — ເປີດ ?verify=xxx ກົງໆ ໄດ້ຂໍ້ມູນສົດສະເໝີ
const verifyId = new URLSearchParams(window.location.search).get('verify')
container._reactRoot.render(
  <>
    {verifyId && <VerifyScreen docId={verifyId} />}
    <div style={verifyId ? { display: 'none' } : undefined}><Root /></div>
  </>
)
