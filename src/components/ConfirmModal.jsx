import { useState } from 'react'

function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirmar', cancelText = 'Cancelar', type = 'default' }) {
    if (!isOpen) return null

    const getTypeStyles = () => {
        switch (type) {
            case 'danger':
                return { icon: '⚠️', confirmClass: 'btn-danger' }
            case 'success':
                return { icon: '📧', confirmClass: 'btn-success' }
            default:
                return { icon: '❓', confirmClass: 'btn-primary' }
        }
    }

    const { icon, confirmClass } = getTypeStyles()

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal confirm-modal" onClick={e => e.stopPropagation()}>
                <span className="modal-close" onClick={onCancel}>×</span>
                <div className="confirm-icon">{icon}</div>
                <h2>{title}</h2>
                <p className="confirm-message">{message}</p>
                <div className="modal-actions confirm-actions">
                    <button type="button" className="btn btn-secondary" onClick={onCancel}>
                        {cancelText}
                    </button>
                    <button type="button" className={`btn ${confirmClass}`} onClick={onConfirm}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ConfirmModal
