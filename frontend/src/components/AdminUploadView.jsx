import React, { useState } from 'react';
import {
  UploadCloud, FileText, CheckCircle2, AlertCircle, ArrowRight,
  Sparkles, RefreshCw, Layers, ShieldAlert, Cpu
} from 'lucide-react';
import { api } from '../api';

export default function AdminUploadView({ onUploadComplete, onNavigateToReview }) {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [resultStats, setResultStats] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const pipelineSteps = [
    'Uploading file...',
    'Parsing WhatsApp timestamps & senders...',
    'Identifying new messages vs. history...',
    'Running AI classification & semantic parsing...',
    'Detecting tasks & resolving relative deadlines...',
    'Checking duplicates & merging reminders...',
    'Publishing shared class intelligence...',
    'Complete!'
  ];

  const simulateStepProgress = async () => {
    for (let step = 0; step < pipelineSteps.length - 1; step++) {
      setCurrentStep(step);
      await new Promise(resolve => setTimeout(resolve, 260));
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setResultStats(null);

    try {
      simulateStepProgress();
      const res = await api.admin.uploadChat(file);
      setCurrentStep(pipelineSteps.length - 1);
      setResultStats(res);
      if (onUploadComplete) onUploadComplete();
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadSampleChat = async (sampleKey) => {
    setIsProcessing(true);
    setErrorMessage(null);
    setResultStats(null);

    try {
      simulateStepProgress();
      const res = await api.admin.loadSampleChat(sampleKey);
      setCurrentStep(pipelineSteps.length - 1);
      setResultStats(res);
      if (onUploadComplete) onUploadComplete();
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
          Upload & Ingest WhatsApp Chat
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Import raw WhatsApp exported .txt chats. Incremental updates automatically process only new messages.
        </p>
      </div>

      {/* 1-Click Demo Quick Loaders */}
      <div className="glass-panel" style={{
        padding: '20px 24px',
        background: 'rgba(99, 102, 241, 0.08)',
        border: '1px solid rgba(99, 102, 241, 0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#818cf8', fontWeight: 700, fontSize: '0.9rem' }}>
          <Sparkles size={16} /> 1-Click Demo Scenarios (Ready for Hackathon Judges)
        </div>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
          Test the exact real-world workflows without having to browse local files:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
          <button
            onClick={() => handleLoadSampleChat('v1')}
            disabled={isProcessing}
            className="btn btn-secondary"
            style={{
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '4px',
              textAlign: 'left'
            }}
          >
            <div style={{ fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
              ⚡ Scenario 1: Initial Class Chat (v1)
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Extracts Python assignment, AI workshop, project & timetable change
            </div>
          </button>

          <button
            onClick={() => handleLoadSampleChat('v2')}
            disabled={isProcessing}
            className="btn btn-secondary"
            style={{
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '4px',
              textAlign: 'left',
              border: '1px solid rgba(245, 158, 11, 0.3)'
            }}
          >
            <div style={{ fontWeight: 700, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px' }}>
              ⚡ Scenario 2: Incremental Update (v2)
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Detects new messages only, updates deadline to Saturday, zero duplicates
            </div>
          </button>

          <button
            onClick={() => handleLoadSampleChat('noise')}
            disabled={isProcessing}
            className="btn btn-secondary"
            style={{
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '4px',
              textAlign: 'left'
            }}
          >
            <div style={{ fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              ⚡ Scenario 3: High-Noise Chat
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Filters out emojis, banter & memes; extracts hidden urgent ML task
            </div>
          </button>
        </div>
      </div>

      {/* Manual Drag & Drop File Upload Form */}
      <form onSubmit={handleFileUpload} className="glass-panel" style={{ padding: '28px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '14px' }}>
          Or Browse Custom WhatsApp .txt File
        </h3>

        <div style={{
          border: '2px dashed rgba(255, 255, 255, 0.15)',
          borderRadius: '14px',
          padding: '36px 20px',
          textAlign: 'center',
          cursor: 'pointer',
          background: 'rgba(15, 23, 42, 0.5)',
          marginBottom: '20px'
        }}>
          <input
            type="file"
            id="chat-file-input"
            accept=".txt"
            onChange={(e) => setFile(e.target.files[0])}
            style={{ display: 'none' }}
          />
          <label htmlFor="chat-file-input" style={{ cursor: 'pointer', display: 'block' }}>
            <UploadCloud size={44} color="#6366f1" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', marginBottom: '4px' }}>
              {file ? file.name : 'Click to select WhatsApp Chat .txt export'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Supports WhatsApp export formats with timestamps, multiline messages, and attachments
            </div>
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            disabled={!file || isProcessing}
            className="btn btn-primary"
            style={{ padding: '10px 24px' }}
          >
            {isProcessing ? (
              <><RefreshCw size={16} className="animate-spin" /> Processing Chat...</>
            ) : (
              <><UploadCloud size={16} /> Process Chat Export</>
            )}
          </button>
        </div>
      </form>

      {/* Pipeline Progress Indicator */}
      {isProcessing && (
        <div className="glass-panel" style={{
          padding: '24px',
          background: 'rgba(15, 23, 42, 0.9)',
          border: '1px solid rgba(99, 102, 241, 0.4)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: '#818cf8', fontWeight: 700 }}>
            <Cpu size={18} /> ClassFlow Intelligence Pipeline Running
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pipelineSteps.map((step, idx) => {
              const isPast = idx < currentStep;
              const isCurrent = idx === currentStep;
              return (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '0.84rem',
                  color: isPast ? '#34d399' : isCurrent ? '#f8fafc' : 'var(--text-muted)',
                  fontWeight: isCurrent ? 700 : 500
                }}>
                  {isPast ? (
                    <CheckCircle2 size={16} color="#10b981" />
                  ) : isCurrent ? (
                    <div style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      border: '2px solid #818cf8',
                      borderTopColor: 'transparent',
                      animation: 'spin 1s linear infinite'
                    }} />
                  ) : (
                    <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                  )}
                  {step}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Error Notice */}
      {errorMessage && (
        <div style={{
          padding: '16px 20px',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '12px',
          color: '#f87171',
          fontSize: '0.88rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <AlertCircle size={20} />
          <div>
            <strong>Ingestion Error:</strong> {errorMessage}
          </div>
        </div>
      )}

      {/* Result Summary Breakdown (Prompt Section 19 requirement) */}
      {resultStats && (
        <div className="glass-panel" style={{
          padding: '24px',
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.35)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontWeight: 800, fontSize: '1.05rem', marginBottom: '14px' }}>
            <CheckCircle2 size={20} /> {resultStats.message || 'Chat Ingestion Completed Successfully'}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            background: 'rgba(15, 23, 42, 0.7)',
            padding: '18px',
            borderRadius: '12px',
            fontFamily: 'monospace',
            fontSize: '0.85rem'
          }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>File:</span><br />
              <strong style={{ color: '#f8fafc' }}>{resultStats.file_name}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Messages Found:</span><br />
              <strong style={{ color: '#38bdf8' }}>{resultStats.messages_found}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Already Processed:</span><br />
              <strong style={{ color: '#94a3b8' }}>{resultStats.already_processed}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>New Messages:</span><br />
              <strong style={{ color: '#34d399' }}>{resultStats.new_messages}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Tasks Detected:</span><br />
              <strong style={{ color: '#fbbf24' }}>{resultStats.tasks_detected}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Announcements:</span><br />
              <strong style={{ color: '#f472b6' }}>{resultStats.announcements_detected}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Duplicates Removed:</span><br />
              <strong style={{ color: '#a78bfa' }}>{resultStats.duplicates_removed}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Processing Status:</span><br />
              <strong style={{ color: '#34d399' }}>COMPLETED</strong>
            </div>
          </div>

          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              onClick={() => onNavigateToReview && onNavigateToReview()}
              className="btn btn-primary"
              style={{ fontWeight: 700, padding: '10px 20px', background: '#f59e0b', color: '#0f172a' }}
            >
              <Sparkles size={16} /> Review Extracted Items ({resultStats.items_extracted || (resultStats.tasks_detected + resultStats.announcements_detected)}) →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
