import './ClipModal.css'

export function ClipModal({ clipUrl, onClose }: { clipUrl: string; onClose: () => void }) {
  return (
    <div className="clip-modal" onClick={onClose}>
      <div className="clip-modal__body" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="clip-modal__close" onClick={onClose}>닫기 ✕</button>
        <video className="clip-modal__video" src={clipUrl} controls autoPlay />
      </div>
    </div>
  )
}
