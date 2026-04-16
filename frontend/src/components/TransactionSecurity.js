import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Vault,
  Handshake,
  Users,
  Files,
  CheckCircle,
  XCircle,
  Clock,
  Warning,
  CaretRight,
  Plus,
  Eye,
  Share,
  Download,
  Lock,
  ShieldCheck,
  Signature,
  FileText,
  Image,
  Receipt,
  IdentificationCard,
  MapTrifold,
  ArrowRight,
  User
} from '@phosphor-icons/react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Escrow Status Badge
const EscrowStatusBadge = ({ status }) => {
  const config = {
    created: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Créé' },
    funded: { bg: 'bg-green-100', text: 'text-green-700', label: 'Financé' },
    conditions_pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'En attente' },
    released: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Libéré' },
    disputed: { bg: 'bg-red-100', text: 'text-red-700', label: 'Litige' },
    cancelled: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Annulé' }
  };
  const c = config[status] || config.created;
  return (
    <span className={`${c.bg} ${c.text} text-xs px-2 py-0.5 rounded-full font-medium`}>
      {c.label}
    </span>
  );
};

// Escrow Card Component
export const EscrowCard = ({ landId, isOwner = false }) => {
  const { user } = useAuth();
  const [escrows, setEscrows] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newEscrow, setNewEscrow] = useState({
    buyer_id: '',
    amount: '',
    payment_method: 'mobile_money'
  });

  useEffect(() => {
    fetchEscrows();
  }, [landId]);

  const fetchEscrows = async () => {
    try {
      const res = await fetch(`${API}/lands/${landId}/escrows`, { credentials: 'include' });
      if (res.ok) {
        setEscrows(await res.json());
      }
    } catch (error) {
      console.error('Error fetching escrows:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEscrow = async () => {
    try {
      const res = await fetch(`${API}/escrow/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          land_id: landId,
          ...newEscrow,
          amount: parseFloat(newEscrow.amount)
        })
      });
      
      if (res.ok) {
        toast.success('Escrow créé avec succès');
        setShowCreate(false);
        fetchEscrows();
      } else {
        const data = await res.json();
        toast.error(data.detail || 'Erreur lors de la création');
      }
    } catch (error) {
      toast.error('Erreur de connexion');
    }
  };

  if (loading) return null;

  return (
    <div className="bg-card border border-border overflow-hidden" data-testid="escrow-card">
      <div className="bg-secondary/30 px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Vault className="w-5 h-5 text-primary" weight="fill" />
          <span className="font-semibold">Système Escrow</span>
        </div>
        {escrows?.active > 0 && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
            {escrows.active} actif(s)
          </span>
        )}
      </div>

      <div className="p-4">
        {escrows?.escrows?.length > 0 ? (
          <div className="space-y-3 mb-4">
            {escrows.escrows.map((escrow, idx) => (
              <div key={idx} className="border border-border rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    {escrow.escrow_id}
                  </span>
                  <EscrowStatusBadge status={escrow.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-accent">
                    {escrow.amount?.toLocaleString()} GNF
                  </span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {escrow.payment_method?.replace('_', ' ')}
                  </span>
                </div>
                {escrow.timeline?.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-border">
                    <div className="text-xs text-muted-foreground">
                      Dernière action: {escrow.timeline[escrow.timeline.length - 1]?.notes}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground text-sm mb-4">
            <Vault className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Aucun escrow actif</p>
            <p className="text-xs mt-1">L'escrow sécurise les transactions</p>
          </div>
        )}

        {isOwner && (
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button className="w-full" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Créer un Escrow
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un Escrow Sécurisé</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">ID Acheteur</label>
                  <Input
                    value={newEscrow.buyer_id}
                    onChange={(e) => setNewEscrow({ ...newEscrow, buyer_id: e.target.value })}
                    placeholder="user_xxxxx"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Montant (GNF)</label>
                  <Input
                    type="number"
                    value={newEscrow.amount}
                    onChange={(e) => setNewEscrow({ ...newEscrow, amount: e.target.value })}
                    placeholder="100000000"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Mode de paiement</label>
                  <Select 
                    value={newEscrow.payment_method} 
                    onValueChange={(v) => setNewEscrow({ ...newEscrow, payment_method: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mobile_money">Mobile Money</SelectItem>
                      <SelectItem value="bank_transfer">Virement Bancaire</SelectItem>
                      <SelectItem value="cash">Espèces</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button>
                <Button onClick={handleCreateEscrow}>Créer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

// Digital Witnesses Component
export const WitnessesCard = ({ landId, isOwner = false }) => {
  const [witnesses, setWitnesses] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [newWitness, setNewWitness] = useState({
    witness_name: '',
    witness_phone: '',
    witness_role: 'neighbor'
  });

  useEffect(() => {
    fetchWitnesses();
  }, [landId]);

  const fetchWitnesses = async () => {
    try {
      const res = await fetch(`${API}/lands/${landId}/witnesses`);
      if (res.ok) {
        setWitnesses(await res.json());
      }
    } catch (error) {
      console.error('Error fetching witnesses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteWitness = async () => {
    try {
      const res = await fetch(`${API}/witnesses/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ land_id: landId, ...newWitness })
      });
      
      if (res.ok) {
        const data = await res.json();
        toast.success(`Témoin invité. Code: ${data.invitation_code}`);
        setShowInvite(false);
        fetchWitnesses();
      } else {
        const data = await res.json();
        toast.error(data.detail || 'Erreur lors de l\'invitation');
      }
    } catch (error) {
      toast.error('Erreur de connexion');
    }
  };

  if (loading) return null;

  const roleLabels = {
    family_member: 'Membre de famille',
    neighbor: 'Voisin',
    chief: 'Chef de quartier',
    notable: 'Notable',
    neutral: 'Témoin neutre'
  };

  return (
    <div className="bg-card border border-border overflow-hidden" data-testid="witnesses-card">
      <div className="bg-secondary/30 px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Signature className="w-5 h-5 text-primary" weight="fill" />
          <span className="font-semibold">Témoins Numériques</span>
        </div>
        {witnesses?.signed_count > 0 && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
            {witnesses.signed_count} signé(s)
          </span>
        )}
      </div>

      <div className="p-4">
        {/* Credibility Score */}
        {witnesses?.total_witnesses > 0 && (
          <div className="flex items-center gap-3 p-3 bg-secondary/20 rounded mb-4">
            <div className="text-2xl font-bold text-primary">{witnesses.credibility_score}%</div>
            <div className="flex-1">
              <div className="text-sm font-medium">Score de crédibilité</div>
              <div className="text-xs text-muted-foreground">
                {witnesses.signed_count}/{witnesses.total_witnesses} témoins ont signé
              </div>
            </div>
          </div>
        )}

        {/* Witnesses List */}
        {witnesses?.witnesses?.length > 0 ? (
          <div className="space-y-2 mb-4">
            {witnesses.witnesses.map((witness, idx) => (
              <div key={idx} className="flex items-center gap-3 p-2 border border-border rounded">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  witness.status === 'signed' ? 'bg-green-100' : 
                  witness.status === 'declined' ? 'bg-red-100' : 'bg-yellow-100'
                }`}>
                  {witness.status === 'signed' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" weight="fill" />
                  ) : witness.status === 'declined' ? (
                    <XCircle className="w-5 h-5 text-red-600" weight="fill" />
                  ) : (
                    <Clock className="w-5 h-5 text-yellow-600" weight="fill" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{witness.witness_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {roleLabels[witness.witness_role] || witness.witness_role}
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  witness.status === 'signed' ? 'bg-green-100 text-green-700' :
                  witness.status === 'declined' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {witness.status === 'signed' ? 'Signé' : 
                   witness.status === 'declined' ? 'Décliné' : 'En attente'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground text-sm mb-4">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Aucun témoin enregistré</p>
            <p className="text-xs mt-1">Les témoins renforcent la légitimité de la transaction</p>
          </div>
        )}

        {isOwner && (
          <Dialog open={showInvite} onOpenChange={setShowInvite}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Inviter un Témoin
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Inviter un Témoin</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nom du témoin</label>
                  <Input
                    value={newWitness.witness_name}
                    onChange={(e) => setNewWitness({ ...newWitness, witness_name: e.target.value })}
                    placeholder="Mamadou Diallo"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Téléphone</label>
                  <Input
                    value={newWitness.witness_phone}
                    onChange={(e) => setNewWitness({ ...newWitness, witness_phone: e.target.value })}
                    placeholder="+224 XXX XXX XXX"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Rôle</label>
                  <Select 
                    value={newWitness.witness_role} 
                    onValueChange={(v) => setNewWitness({ ...newWitness, witness_role: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="neighbor">Voisin</SelectItem>
                      <SelectItem value="chief">Chef de quartier</SelectItem>
                      <SelectItem value="notable">Notable</SelectItem>
                      <SelectItem value="family_member">Membre de famille</SelectItem>
                      <SelectItem value="neutral">Témoin neutre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowInvite(false)}>Annuler</Button>
                <Button onClick={handleInviteWitness}>Inviter</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

// Document Vault Component
export const DocumentVaultCard = ({ landId, isOwner = false }) => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, [landId]);

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${API}/lands/${landId}/documents`, { credentials: 'include' });
      if (res.ok) {
        setDocuments(await res.json());
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  const typeIcons = {
    title_deed: FileText,
    survey_plan: MapTrifold,
    contract: Handshake,
    id_card: IdentificationCard,
    receipt: Receipt,
    photo: Image,
    other: Files
  };

  return (
    <div className="bg-card border border-border overflow-hidden" data-testid="document-vault-card">
      <div className="bg-secondary/30 px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-primary" weight="fill" />
          <span className="font-semibold">Coffre-fort Documents</span>
        </div>
        {documents?.total_documents > 0 && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
            {documents.total_documents} doc(s)
          </span>
        )}
      </div>

      <div className="p-4">
        {/* Stats */}
        {documents?.total_documents > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="text-center p-2 bg-blue-50 rounded">
              <div className="text-xl font-bold text-blue-600">{documents.total_documents}</div>
              <div className="text-xs text-blue-700">Total</div>
            </div>
            <div className="text-center p-2 bg-green-50 rounded">
              <div className="text-xl font-bold text-green-600">{documents.verified_count || 0}</div>
              <div className="text-xs text-green-700">Vérifiés</div>
            </div>
            <div className="text-center p-2 bg-yellow-50 rounded">
              <div className="text-xl font-bold text-yellow-600">{documents.official_count || 0}</div>
              <div className="text-xs text-yellow-700">Officiels</div>
            </div>
          </div>
        )}

        {/* Documents by Type */}
        {documents?.by_type && Object.keys(documents.by_type).length > 0 ? (
          <div className="space-y-2 mb-4">
            {Object.entries(documents.by_type).map(([type, docs]) => {
              const Icon = typeIcons[type] || Files;
              return (
                <div key={type} className="border border-border rounded p-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{type}</span>
                    <span className="text-xs text-muted-foreground">({docs.length})</span>
                  </div>
                  <div className="space-y-1">
                    {docs.slice(0, 3).map((doc, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs bg-secondary/20 rounded px-2 py-1">
                        <span className="line-clamp-1">{doc.title}</span>
                        <div className="flex items-center gap-1">
                          {doc.verified && (
                            <ShieldCheck className="w-3 h-3 text-green-600" weight="fill" />
                          )}
                          <Eye className="w-3 h-3 text-muted-foreground cursor-pointer hover:text-primary" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground text-sm mb-4">
            <Files className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Aucun document stocké</p>
            <p className="text-xs mt-1">Stockez vos documents en toute sécurité</p>
          </div>
        )}

        {isOwner && (
          <Button variant="outline" className="w-full" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un Document
          </Button>
        )}
      </div>
    </div>
  );
};

// Transaction Security Summary Component
export const TransactionSecuritySummary = ({ landId, isOwner = false }) => {
  return (
    <div className="bg-card border border-border overflow-hidden" data-testid="transaction-security-summary">
      <div className="bg-gradient-to-r from-primary to-primary/80 px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5" weight="fill" />
          <span className="font-semibold">Sécurité de Transaction</span>
        </div>
        <p className="text-xs text-white/80 mt-1">
          Protégez votre transaction avec nos outils de sécurité
        </p>
      </div>

      <div className="p-4 space-y-4">
        <EscrowCard landId={landId} isOwner={isOwner} />
        <WitnessesCard landId={landId} isOwner={isOwner} />
        <DocumentVaultCard landId={landId} isOwner={isOwner} />
      </div>
    </div>
  );
};

export default { EscrowCard, WitnessesCard, DocumentVaultCard, TransactionSecuritySummary };
