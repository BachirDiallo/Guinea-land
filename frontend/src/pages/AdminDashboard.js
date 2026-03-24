import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { 
  ShieldCheck, 
  House, 
  Users, 
  Receipt, 
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  Warning
} from '@phosphor-icons/react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [pendingLands, setPendingLands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLand, setSelectedLand] = useState(null);
  const [actionDialog, setActionDialog] = useState({ open: false, type: null, land: null });
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [statsRes, landsRes] = await Promise.all([
        fetch(`${API}/admin/dashboard`, { credentials: 'include' }),
        fetch(`${API}/admin/lands/pending`, { credentials: 'include' })
      ]);

      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
      if (landsRes.ok) {
        setPendingLands(await landsRes.json());
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (landId) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/admin/lands/${landId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notes: '' })
      });

      if (res.ok) {
        toast.success('Terrain vérifié avec succès!');
        fetchData();
        setActionDialog({ open: false, type: null, land: null });
      } else {
        throw new Error('Verification failed');
      }
    } catch (error) {
      toast.error('Erreur lors de la vérification');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (landId) => {
    if (!rejectReason.trim()) {
      toast.error('Veuillez fournir une raison de rejet');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`${API}/admin/lands/${landId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: rejectReason })
      });

      if (res.ok) {
        toast.success('Terrain rejeté');
        fetchData();
        setActionDialog({ open: false, type: null, land: null });
        setRejectReason('');
      } else {
        throw new Error('Rejection failed');
      }
    } catch (error) {
      toast.error('Erreur lors du rejet');
    } finally {
      setActionLoading(false);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Warning className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Accès Refusé</h1>
          <p className="text-muted-foreground">Cette page est réservée aux administrateurs.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="admin-dashboard">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-10 h-10" weight="duotone" />
            <div>
              <h1 className="text-3xl font-black">Administration</h1>
              <p className="text-primary-foreground/80">Tableau de bord administrateur</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-card border border-border p-6 shadow-brutal-sm">
            <Users className="w-8 h-8 text-primary mb-3" weight="duotone" />
            <div className="text-3xl font-black">{stats?.total_users || 0}</div>
            <div className="text-sm text-muted-foreground">Utilisateurs</div>
          </div>
          <div className="bg-card border border-border p-6 shadow-brutal-sm">
            <House className="w-8 h-8 text-primary mb-3" weight="duotone" />
            <div className="text-3xl font-black">{stats?.total_lands || 0}</div>
            <div className="text-sm text-muted-foreground">Terrains</div>
          </div>
          <div className="bg-card border border-border p-6 shadow-brutal-sm">
            <Clock className="w-8 h-8 text-yellow-500 mb-3" weight="duotone" />
            <div className="text-3xl font-black">{stats?.pending_verification || 0}</div>
            <div className="text-sm text-muted-foreground">En attente</div>
          </div>
          <div className="bg-card border border-border p-6 shadow-brutal-sm">
            <CheckCircle className="w-8 h-8 text-green-600 mb-3" weight="duotone" />
            <div className="text-3xl font-black">{stats?.verified_lands || 0}</div>
            <div className="text-sm text-muted-foreground">Vérifiés</div>
          </div>
          <div className="bg-card border border-border p-6 shadow-brutal-sm">
            <Receipt className="w-8 h-8 text-accent mb-3" weight="duotone" />
            <div className="text-3xl font-black">{stats?.total_transactions || 0}</div>
            <div className="text-sm text-muted-foreground">Transactions</div>
          </div>
        </div>

        {/* User Stats */}
        {stats?.user_stats && (
          <div className="mb-8 bg-card border border-border p-6">
            <h2 className="font-bold mb-4">Répartition des utilisateurs</h2>
            <div className="flex flex-wrap gap-4">
              {Object.entries(stats.user_stats).map(([role, count]) => (
                <div key={role} className="px-4 py-2 bg-secondary">
                  <span className="font-bold capitalize">{role}</span>: {count}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending Verification */}
        <div className="bg-card border border-border">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-bold flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              Terrains en attente de vérification ({pendingLands.length})
            </h2>
          </div>

          {pendingLands.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-600" />
              <p>Aucun terrain en attente de vérification</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {pendingLands.map((land) => (
                <div key={land.land_id} className="p-4 hover:bg-secondary/50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{land.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {land.commune}, {land.region} • {land.size?.toLocaleString()} m²
                      </p>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge variant="outline">{land.land_type}</Badge>
                        <Badge className="bg-yellow-500 text-black">Non vérifié</Badge>
                      </div>
                      {land.owner && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">Propriétaire:</span>{' '}
                          <span className="font-medium">{land.owner.name}</span> ({land.owner.email})
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-accent">
                        {land.price?.toLocaleString()} GNF
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/lands/${land.land_id}`}>
                          <Eye className="w-4 h-4 mr-1" />
                          Voir
                        </Link>
                      </Button>
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => setActionDialog({ open: true, type: 'verify', land })}
                        data-testid={`verify-btn-${land.land_id}`}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Vérifier
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => setActionDialog({ open: true, type: 'reject', land })}
                        data-testid={`reject-btn-${land.land_id}`}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Rejeter
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Verify/Reject Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => !open && setActionDialog({ open: false, type: null, land: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === 'verify' ? 'Vérifier le terrain' : 'Rejeter le terrain'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.type === 'verify' 
                ? `Confirmez-vous la vérification de "${actionDialog.land?.title}" ?`
                : `Veuillez indiquer la raison du rejet de "${actionDialog.land?.title}".`
              }
            </DialogDescription>
          </DialogHeader>

          {actionDialog.type === 'reject' && (
            <Textarea
              placeholder="Raison du rejet..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              data-testid="reject-reason-input"
            />
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setActionDialog({ open: false, type: null, land: null })}
            >
              Annuler
            </Button>
            {actionDialog.type === 'verify' ? (
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => handleVerify(actionDialog.land?.land_id)}
                disabled={actionLoading}
                data-testid="confirm-verify-btn"
              >
                {actionLoading ? 'Vérification...' : 'Confirmer la vérification'}
              </Button>
            ) : (
              <Button 
                variant="destructive"
                onClick={() => handleReject(actionDialog.land?.land_id)}
                disabled={actionLoading}
                data-testid="confirm-reject-btn"
              >
                {actionLoading ? 'Rejet...' : 'Confirmer le rejet'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
