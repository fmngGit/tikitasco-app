import { useEffect, useState } from 'react';
import { fetchLocations, deleteLocation, getDriveImageUrl, type Location } from '../services/api';
import { AddLocationModal } from '../components/AddLocationModal';
import { ImageLightbox } from '../components/ImageLightbox';
import { useAuth } from '../context/AuthContext';
import { MapPin, Plus, Edit2, Trash2, Search, Map, Check, Home, CloudSun, ChevronDown, ChevronUp, Phone, Mail, FileText } from 'lucide-react';

const LocationCard = ({ 
  loc, 
  token, 
  onEdit, 
  onDelete, 
  setLightboxImages, 
  setLightboxIndex 
}: {
  loc: Location,
  token: string | null,
  onEdit: (l: Location) => void,
  onDelete: (id: string) => void,
  setLightboxImages: (imgs: string[]) => void,
  setLightboxIndex: (idx: number) => void
}) => {
  const [expanded, setExpanded] = useState(false);
  const hasExtraInfo = Boolean(loc.Telefone || loc.Email || loc.Notas);

  const getGoogleMapsEmbedUrl = (query: string) => {
    const q = encodeURIComponent(query);
    return `https://maps.google.com/maps?q=${q}&t=&z=13&ie=UTF8&iwloc=&output=embed`;
  };

  return (
    <div className="glass-panel" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      
      {/* CABEÇALHO DO CARTÃO */}
      <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>{loc.Nome}</h3>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '0.2rem 0.6rem', borderRadius: '8px' }}>
            {loc.PrecoHora.toFixed(2)}€<span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>/h</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {loc.TipoPiso && (
            <span style={{ fontSize: '0.75rem', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', padding: '0.25rem 0.6rem', borderRadius: '20px', fontWeight: 600 }}>
              {loc.TipoPiso}
            </span>
          )}
          {loc.TipoFutebol && (
            <span style={{ fontSize: '0.75rem', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', padding: '0.25rem 0.6rem', borderRadius: '20px', fontWeight: 600 }}>
              Futebol {loc.TipoFutebol}
            </span>
          )}
        </div>
      </div>

      {/* DETALHES (PREÇOS EXTRA E CONDIÇÕES) */}
      <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: loc.Indoor === 1 ? '#3b82f6' : 'var(--text-main)', fontSize: '0.85rem' }}>
            {loc.Indoor === 1 ? <Home size={16} /> : <CloudSun size={16} />}
            <span style={{ fontWeight: 600 }}>{loc.Indoor === 1 ? 'Coberto (Indoor)' : 'Ar Livre (Outdoor)'}</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: loc.Balnearios === 1 ? '#10b981' : 'var(--text-muted)', fontSize: '0.85rem' }}>
            <Check size={16} style={{ opacity: loc.Balnearios === 1 ? 1 : 0.3 }} />
            <span style={{ fontWeight: loc.Balnearios === 1 ? 600 : 400, textDecoration: loc.Balnearios === 1 ? 'none' : 'line-through' }}>Balneários</span>
          </div>
        </div>

        {((loc.PrecoBola !== undefined && loc.PrecoBola !== null) || (loc.PrecoColetes !== undefined && loc.PrecoColetes !== null)) && (
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', fontSize: '0.85rem' }}>
            <div style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Extras (Opcional):</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {(loc.PrecoBola !== undefined && loc.PrecoBola !== null) && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>⚽ Aluguer Bola:</span>
                  <strong style={{ color: '#f59e0b' }}>{loc.PrecoBola === 0 ? 'Grátis' : `${loc.PrecoBola.toFixed(2)}€`}</strong>
                </div>
              )}
              {(loc.PrecoColetes !== undefined && loc.PrecoColetes !== null) && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>🎽 Aluguer Coletes:</span>
                  <strong style={{ color: '#f59e0b' }}>{loc.PrecoColetes === 0 ? 'Grátis' : `${loc.PrecoColetes.toFixed(2)}€`}</strong>
                </div>
              )}
            </div>
          </div>
        )}

        {/* INFORMAÇÃO EXTRA EXPANSÍVEL (Contactos e Notas) */}
        {hasExtraInfo && (
          <div style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', overflow: 'hidden' }}>
            <button 
              onClick={() => setExpanded(!expanded)}
              style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', border: 'none', color: 'var(--text-main)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
            >
              Contactos e Notas
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {expanded && (
              <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {loc.Telefone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Phone size={14} style={{ color: 'var(--primary)' }} />
                    <a href={`tel:${loc.Telefone}`} style={{ color: 'var(--text-main)', textDecoration: 'none' }}>{loc.Telefone}</a>
                  </div>
                )}
                {loc.Email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Mail size={14} style={{ color: 'var(--primary)' }} />
                    <a href={`mailto:${loc.Email}`} style={{ color: 'var(--text-main)', textDecoration: 'none' }}>{loc.Email}</a>
                  </div>
                )}
                {loc.Notas && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginTop: (loc.Telefone || loc.Email) ? '0.5rem' : 0, paddingTop: (loc.Telefone || loc.Email) ? '0.5rem' : 0, borderTop: (loc.Telefone || loc.Email) ? '1px dashed rgba(255,255,255,0.1)' : 'none' }}>
                    <FileText size={14} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ color: 'var(--text-muted)' }}>{loc.Notas}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* FOTOS */}
        {loc.FotosUrl && loc.FotosUrl.trim() !== '' && (
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
            {loc.FotosUrl.split(',').filter(u => u.trim() !== '').map((url, idx, arr) => (
              <div 
                key={idx} 
                onClick={() => {
                  setLightboxImages(arr);
                  setLightboxIndex(idx);
                }}
                style={{ display: 'block', width: '60px', height: '60px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
              >
                <img src={getDriveImageUrl(url.trim())} alt={`Foto ${idx+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MAPA IFRAME */}
      <div style={{ height: '180px', width: '100%', background: '#111', position: 'relative' }}>
        <iframe 
          width="100%" 
          height="100%" 
          frameBorder="0" 
          scrolling="no" 
          marginHeight={0} 
          marginWidth={0} 
          src={getGoogleMapsEmbedUrl(loc.Morada || loc.Nome)}
          style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(80%) contrast(120%)' }}
        ></iframe>
        <a 
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.Morada || loc.Nome)}`} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'var(--primary)', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem', boxShadow: '0 4px 10px rgba(0,0,0,0.5)', textDecoration: 'none' }}
        >
          <Map size={14} /> Abrir GPS
        </a>
      </div>

      {/* BOTÕES DE AÇÃO */}
      {token && (
        <div style={{ padding: '1rem 1.5rem', background: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <button 
            className="btn-secondary" 
            onClick={() => onEdit(loc)}
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Edit2 size={14} /> Editar
          </button>
          <button 
            onClick={() => onDelete(loc.LocationID)}
            style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid var(--danger)', borderRadius: '8px', padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
          >
            <Trash2 size={14} /> Eliminar
          </button>
        </div>
      )}
    </div>
  );
};

export const Locations = () => {
  const { token } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  // Lightbox
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPiso, setFilterPiso] = useState('');
  const [filterIndoor, setFilterIndoor] = useState<string>('all'); // 'all', 'yes', 'no'
  const [filterBalnearios, setFilterBalnearios] = useState(false);
  
  // Ordenação
  const [sortBy, setSortBy] = useState<'preco' | 'alfabetica'>('alfabetica');

  const loadData = async () => {
    setLoading(true);
    const locs = await fetchLocations();
    setLocations(locs);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!token) return;
    if (confirm('Tens a certeza que queres eliminar este campo?')) {
      const res = await deleteLocation(token, id);
      if (res.success) {
        loadData();
      } else {
        alert(res.error || 'Erro ao apagar campo.');
      }
    }
  };

  // Filtragem e ordenação aplicadas aos dados
  const filteredLocations = locations
    .filter(loc => {
      // Pesquisa por nome ou morada
      const matchesSearch = loc.Nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            loc.Morada.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesPiso = filterPiso ? loc.TipoPiso === filterPiso : true;
      
      const matchesIndoor = filterIndoor === 'all' 
        ? true 
        : filterIndoor === 'yes' ? loc.Indoor === 1 : loc.Indoor === 0;
      
      const matchesBalnearios = filterBalnearios ? loc.Balnearios === 1 : true;

      return matchesSearch && matchesPiso && matchesIndoor && matchesBalnearios;
    })
    .sort((a, b) => {
      if (sortBy === 'preco') return a.PrecoHora - b.PrecoHora;
      return a.Nome.localeCompare(b.Nome);
    });

  const getPisoOptions = () => {
    const pisos = new Set(locations.map(l => l.TipoPiso).filter(Boolean));
    return Array.from(pisos) as string[];
  };

  if (loading) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>A carregar diretório de campos...</p>
      </div>
    );
  }

  return (
    <>
      <div className="container animate-fade-in" style={{ padding: '2rem 1.5rem', maxWidth: '1200px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h1 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <MapPin style={{ color: 'var(--primary)' }} size={28} />
            Campos / Locais de Jogo
          </h1>
          
          {token && (
            <button 
              className="btn-primary" 
              onClick={() => {
                setEditingLocation(null);
                setShowAddModal(true);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', fontSize: '0.9rem' }}
            >
              <Plus size={18} /> Adicionar Campo
            </button>
          )}
        </div>

        {/* BARRA DE FILTROS E PESQUISA */}
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: '1 1 200px', display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '0 0.75rem', border: '1px solid var(--border-color)' }}>
            <Search size={18} style={{ color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Pesquisar campo ou morada..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-main)' }}
            />
          </div>

          <div style={{ flex: '1 1 150px' }}>
            <select 
              value={filterPiso} 
              onChange={e => setFilterPiso(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
            >
              <option value="" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}>Qualquer Piso</option>
              {getPisoOptions().map(p => (
                <option key={p} value={p} style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}>{p}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: '1 1 150px' }}>
            <select 
              value={filterIndoor} 
              onChange={e => setFilterIndoor(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
            >
              <option value="all" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}>Qualquer Cobertura</option>
              <option value="yes" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}>Coberto (Indoor)</option>
              <option value="no" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}>Ar Livre (Outdoor)</option>
            </select>
          </div>

          <div style={{ flex: '1 1 150px' }}>
            <select 
              value={sortBy} 
              onChange={e => setSortBy(e.target.value as any)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
            >
              <option value="alfabetica" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}>Ordem Alfabética</option>
              <option value="preco" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}>Preço (Menor a Maior)</option>
            </select>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: filterBalnearios ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.05)', padding: '0.75rem 1rem', borderRadius: '8px', border: filterBalnearios ? '1px solid #10b981' : '1px solid var(--border-color)', transition: 'all 0.2s' }}>
            <input type="checkbox" checked={filterBalnearios} onChange={e => setFilterBalnearios(e.target.checked)} style={{ display: 'none' }} />
            <Check size={16} style={{ color: filterBalnearios ? '#10b981' : 'transparent' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: filterBalnearios ? '#10b981' : 'var(--text-main)' }}>Só c/ Balneários</span>
          </label>
        </div>

        {/* LISTAGEM DE CAMPOS */}
        {filteredLocations.length === 0 ? (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
            <MapPin size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem', opacity: 0.5 }} />
            <p style={{ color: 'var(--text-muted)' }}>Não foram encontrados campos com estes critérios.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
            {filteredLocations.map(loc => (
              <LocationCard 
                key={loc.LocationID} 
                loc={loc} 
                token={token} 
                onEdit={(l) => { setEditingLocation(l); setShowAddModal(true); }}
                onDelete={handleDelete}
                setLightboxImages={setLightboxImages}
                setLightboxIndex={setLightboxIndex}
              />
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddLocationModal 
          location={editingLocation}
          onClose={() => {
            setShowAddModal(false);
            setEditingLocation(null);
          }}
          onSuccess={() => {
            setShowAddModal(false);
            setEditingLocation(null);
            loadData();
          }}
        />
      )}

      {lightboxImages.length > 0 && (
        <ImageLightbox 
          images={lightboxImages} 
          initialIndex={lightboxIndex}
          onClose={() => setLightboxImages([])} 
        />
      )}
    </>
  );
};
