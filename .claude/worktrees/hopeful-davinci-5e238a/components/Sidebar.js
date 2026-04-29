'use client';
import { useState, useEffect } from 'react';
import { 
  ChevronRight, ChevronLeft,
  MessageCircle, Briefcase, Search,
  Heart, Bell, Compass, Plus
} from 'lucide-react';

export default function Sidebar({ activePage, onNavigate }) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sidebarExpanded');
    if (saved === 'true') setExpanded(true);
  }, []);

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    localStorage.setItem('sidebarExpanded', String(next));
  };

  const items = [
    { id: 'chats', icon: MessageCircle, label: 'Sohbetler', badge: 4 },
    { id: 'trips', icon: Briefcase, label: 'Geziler' },
    { id: 'explore', icon: Search, label: 'Keşfet' },
    { id: 'saved', icon: Heart, label: 'Kaydedilenler' },
    { id: 'updates', icon: Bell, label: 'Güncellemeler' },
    { id: 'inspiration', icon: Compass, label: 'İlham' },
    { id: 'create', icon: Plus, label: 'Oluştur' },
  ];

  return (
    <div style={{
      width: expanded ? 220 : 48,
      minWidth: expanded ? 220 : 48,
      height: '100%',
      borderRight: '1px solid rgba(0,0,0,.06)',
      background: '#fff',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.25s ease, min-width 0.25s ease',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      
      {/* LOGO SATIRI */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: expanded ? 'space-between' : 'center',
        padding: expanded ? '14px 16px' : '14px 0',
        cursor: 'pointer',
        minHeight: 48,
      }}>
        {/* Logo */}
        <div 
          onClick={() => window.location.reload()}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: 20, color: '#B8934A' }}>◈</span>
          {expanded && (
            <span style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: 16, fontWeight: 600,
              color: '#1A1916', whiteSpace: 'nowrap'
            }}>
              Atlas
            </span>
          )}
        </div>
        
        {/* Daralt/Genişlet butonu */}
        <div
          onClick={toggle}
          style={{
            cursor: 'pointer',
            color: '#A8A59E',
            display: 'flex',
            alignItems: 'center',
            marginLeft: expanded ? 0 : 0,
          }}
        >
          {expanded 
            ? <ChevronLeft size={16} /> 
            : <ChevronRight size={16} />
          }
        </div>
      </div>

      {/* MENÜ İTEMLERI */}
      <div style={{ flex: 1, padding: '4px 0' }}>
        {items.map(({ id, icon: Icon, label, badge }) => {
          const active = activePage === id;
          return (
            <div
              key={id}
              onClick={() => onNavigate?.(id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: expanded ? '10px 16px' : '10px 0',
                justifyContent: expanded ? 'flex-start' : 'center',
                cursor: 'pointer',
                background: active ? 'rgba(0,0,0,.04)' : 'transparent',
                borderRadius: 8,
                margin: '1px 6px',
                position: 'relative',
              }}
            >
              <Icon size={20} color={active ? '#1A1916' : '#6B6860'} 
                   strokeWidth={active ? 2 : 1.5} />
              {expanded && (
                <span style={{
                  fontSize: 14, fontFamily: 'DM Sans, sans-serif',
                  color: active ? '#1A1916' : '#6B6860',
                  fontWeight: active ? 500 : 400,
                  whiteSpace: 'nowrap',
                }}>
                  {label}
                </span>
              )}
              {badge && expanded && (
                <span style={{
                  marginLeft: 'auto',
                  background: '#1A1916', color: '#fff',
                  borderRadius: 999, padding: '1px 7px',
                  fontSize: 11, fontWeight: 600,
                }}>
                  {badge}
                </span>
              )}
              {badge && !expanded && (
                <span style={{
                  position: 'absolute', top: 6, right: 6,
                  background: '#1A1916', color: '#fff',
                  borderRadius: 999, padding: '0 4px',
                  fontSize: 10, fontWeight: 600, lineHeight: '16px',
                }}>
                  {badge}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* ALT NEW CHAT */}
      {expanded && (
        <div style={{ padding: '12px 10px' }}>
          <button style={{
            width: '100%', padding: '9px 0',
            background: 'rgba(0,0,0,.04)',
            border: '1px solid rgba(0,0,0,.08)',
            borderRadius: 20, cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 13, color: '#1A1916',
          }}>
            Yeni Sohbet
          </button>
        </div>
      )}
    </div>
  );
}
