import { useMemo } from 'react'
import { Icon } from './shared.jsx'
import PdfViewer from './PdfViewer.jsx'
import { DocPageBody } from './DocSignatures.jsx'

const noop = () => {}

function NonPdfPreview({ file }) {
  const url = useMemo(() => { try { return URL.createObjectURL(file.file) } catch { return null } }, [file])
  if (!url) return <p className="muted" style={{ padding: 20 }}>ບໍ່ສາມາດເປີດເບິ່ງໄຟລ໌ນີ້</p>
  if ((file.file?.type || '').startsWith('image/')) return <img src={url} alt={file.name} style={{ width: '100%', borderRadius: 8 }} />
  return <iframe src={url} title={file.name} style={{ width: '100%', height: '78vh', border: 'none', borderRadius: 8, background: '#fff' }} />
}

export default function FilePreviewModal({ file, onClose }) {
  if (!file) return null
  const isPdf = file.file?.type === 'application/pdf' || /\.pdf$/i.test(file.name || '')
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet tall" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <b><Icon.eye /> <span className="modal-fname">{file.name}</span></b>
          <button className="icon-mini" onClick={onClose}><Icon.x /></button>
        </div>
        <div className="modal-body" style={{ position: 'relative' }}>
          {file.mockup ? (
            <div className="preview-doc">
              <div className="sign-page"><DocPageBody doc={file.mockDoc} file={file.mockFile} wm={file.mockDoc.status !== 'done'} /></div>
            </div>
          ) : file.imagePlaceholder ? (
            <div className="img-ph"><span className="img-ph-ic"><Icon.eye /></span><b>{file.name}</b><span>ຮູບພາບແນບ (ຕົວຢ່າງ preview)</span></div>
          ) : file.url ? (
            <iframe src={file.url} title={file.name} style={{ width: '100%', height: '78vh', border: 'none', borderRadius: 8, background: '#fff' }} />
          ) : isPdf ? (
            <PdfViewer files={[{ name: file.name, file: file.file, id: file.fileId, srcUrl: file.srcUrl }]} mode="preview" watermark={!!file.watermark} activeSignerId={null}
              placements={file.placements || []} signers={file.signers || []} pageFooter={{ date: file.footerDate, docId: file.docId }} onAdd={noop} onMove={noop} onRemove={noop} />
          ) : (
            <NonPdfPreview file={file} />
          )}
        </div>
      </div>
    </div>
  )
}
