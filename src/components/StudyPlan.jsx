import React, { useState, useEffect } from 'react';
import { planDeEstudios } from '../data/planDeEstudios';
import '../StudyPlan.css'; // Let's use a separate CSS file for simplicity

const StudyPlan = () => {
    const [progress, setProgress] = useState(() => {
        const saved = localStorage.getItem('studyPlanProgress');
        return saved ? JSON.parse(saved) : {};
    });

    useEffect(() => {
        localStorage.setItem('studyPlanProgress', JSON.stringify(progress));
    }, [progress]);

    const handleSubjectClick = (id, e) => {
        e.preventDefault();
        const subject = planDeEstudios.find(s => s.id === id);
        if (!subject) return;

        // Prevent changing state if the subject is blocked
        if (checkAvailability(subject) === 'bloqueada') {
            return;
        }

        setProgress(prev => {
            const current = prev[id];
            let nextState = null;
            
            if (!current || current === 'habilitada') {
                nextState = 'regular';
            } else if (current === 'regular') {
                nextState = 'aprobada';
            } else if (current === 'aprobada') {
                nextState = null;
            }

            const newProgress = { ...prev };
            if (nextState) {
                newProgress[id] = nextState;
            } else {
                delete newProgress[id];
            }
            return newProgress;
        });
    };

    const checkAvailability = (subject) => {
        if (progress[subject.id]) return progress[subject.id];

        const checkReqs = (reqs) => {
            if (!reqs || reqs.length === 0) return true;
            return reqs.every(req => {
                const userState = progress[req.id];
                if (req.state === 'aprobada' && userState !== 'aprobada') return false;
                if (req.state === 'regular' && userState !== 'regular' && userState !== 'aprobada') return false;
                return true;
            });
        }

        const canCursar = checkReqs(subject.requirements.cursar);
        if (canCursar) return 'habilitada';
        return 'bloqueada';
    }

    // Helper to generate tooltip text for missing requirements
    const getMissingReqsText = (subject) => {
        if (!subject.requirements || !subject.requirements.cursar) return null;

        const missingReqs = subject.requirements.cursar.filter(req => {
            const userState = progress[req.id];
            if (req.state === 'aprobada' && userState !== 'aprobada') return true;
            if (req.state === 'regular' && userState !== 'regular' && userState !== 'aprobada') return true;
            return false;
        });

        if (missingReqs.length === 0) return null;

        return (
            <div className="tooltip-content">
                <strong>Para cursar necesitas:</strong>
                <ul>
                    {missingReqs.map((req, index) => {
                        const reqSubject = planDeEstudios.find(s => s.id === req.id);
                        return (
                            <li key={index}>
                                {reqSubject ? reqSubject.name : `Materia ${req.id}`} - {req.state === 'aprobada' ? 'Aprobada' : 'Regular'}
                            </li>
                        )
                    })}
                </ul>
            </div>
        );
    }

    const years = [1, 2, 3, 4, 5];

    return (
        <div className="study-plan-container">
            <div className="study-plan-header">
                <h2>Plan de Estudios Interactivo</h2>
                <p>Licenciatura en Análisis y Gestión de Datos</p>
            </div>

            <div className="study-legend">
                <div className="legend-item"><span className="dot aprobada"></span> Aprobada</div>
                <div className="legend-item"><span className="dot regular"></span> Regular</div>
                <div className="legend-item"><span className="dot habilitada"></span> Habilitada (para cursar)</div>
                <div className="legend-item"><span className="dot bloqueada"></span> Bloqueada</div>
            </div>

            <div className="study-grid">
                {years.map(year => (
                    <div key={year} className="study-year">
                        <div className="year-title">Año {year}</div>
                        <div className="study-terms">
                            {[1, 2].map(term => {
                                const subjects = planDeEstudios.filter(s => s.year === year && s.term === term);
                                if (subjects.length === 0) return null;
                                return (
                                    <div key={term} className="study-term">
                                        <div className="term-title">Cuatrimestre {term}</div>
                                        <div className="subjects-list">
                                            {subjects.map(s => {
                                                const status = checkAvailability(s);
                                                return (
                                                    <div
                                                        key={s.id}
                                                        className={`subject-card status-${status}`}
                                                        onClick={(e) => handleSubjectClick(s.id, e)}
                                                    >
                                                        <div className="subject-id-badge">{s.id}</div>
                                                        <div className="subject-name">{s.name}</div>

                                                        {s.link && (
                                                            <div className="subject-link-container" title={`Haz clic para ir al plan de estudios de ${s.name}`}>
                                                                <a
                                                                    href={s.link}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="subject-link-btn"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                                                        <polyline points="15 3 21 3 21 9"></polyline>
                                                                        <line x1="10" y1="14" x2="21" y2="3"></line>
                                                                    </svg>
                                                                </a>
                                                            </div>
                                                        )}

                                                        {status === 'bloqueada' && (
                                                            <div className="subject-tooltip">
                                                                {getMissingReqsText(s)}
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StudyPlan;
