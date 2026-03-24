import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { LandCard } from '../components/LandCard';
import { Button } from '../components/ui/button';
import { 
  House, 
  Receipt, 
  Plus, 
  ChartLine,
  MapPin,
  Users,
  TrendUp
} from '@phosphor-icons/react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [myLands, setMyLands] = useState([]);
  const [myTransactions, setMyTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch stats
      const statsRes = await fetch(`${API}/stats`, { credentials: 'include' });
      const statsData = await statsRes.json();
      setStats(statsData);

      // Fetch user's lands
      const landsRes = await fetch(`${API}/lands`, { credentials: 'include' });
      const landsData = await landsRes.json();
      // Filter lands owned by current user
      const userLands = landsData.filter(l => l.owner_id === user?.user_id);
      setMyLands(userLands);

      // Fetch user's transactions
      const txnRes = await fetch(`${API}/transactions`, { credentials: 'include' });
      if (txnRes.ok) {
        const txnData = await txnRes.json();
        setMyTransactions(txnData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="dashboard">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-black mb-2">
            {t('dashboard.welcome')}, {user?.name}!
          </h1>
          <p className="text-primary-foreground/80">
            {t('dashboard.overview')}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border p-6 shadow-brutal-sm">
            <House className="w-8 h-8 text-primary mb-3" weight="duotone" />
            <div className="text-3xl font-black">{myLands.length}</div>
            <div className="text-sm text-muted-foreground">{t('dashboard.my_lands')}</div>
          </div>
          <div className="bg-card border border-border p-6 shadow-brutal-sm">
            <Receipt className="w-8 h-8 text-accent mb-3" weight="duotone" />
            <div className="text-3xl font-black">{myTransactions.length}</div>
            <div className="text-sm text-muted-foreground">{t('dashboard.my_transactions')}</div>
          </div>
          <div className="bg-card border border-border p-6 shadow-brutal-sm">
            <MapPin className="w-8 h-8 text-primary mb-3" weight="duotone" />
            <div className="text-3xl font-black">{stats?.total_lands || 0}</div>
            <div className="text-sm text-muted-foreground">Total Terrains</div>
          </div>
          <div className="bg-card border border-border p-6 shadow-brutal-sm">
            <TrendUp className="w-8 h-8 text-accent mb-3" weight="duotone" />
            <div className="text-3xl font-black">{stats?.total_transactions || 0}</div>
            <div className="text-sm text-muted-foreground">Total Transactions</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Button className="h-auto py-6 flex-col gap-2 shadow-brutal-sm btn-hover-lift" asChild>
            <Link to="/lands/new">
              <Plus className="w-8 h-8" />
              <span className="font-bold">{t('dashboard.add_land')}</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-6 flex-col gap-2 border-2" asChild>
            <Link to="/map">
              <MapPin className="w-8 h-8" />
              <span className="font-bold">{t('nav.map')}</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-6 flex-col gap-2 border-2" asChild>
            <Link to="/transactions">
              <Receipt className="w-8 h-8" />
              <span className="font-bold">{t('nav.transactions')}</span>
            </Link>
          </Button>
        </div>

        {/* My Lands */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black">{t('dashboard.my_lands')}</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/lands/new">
                <Plus className="w-4 h-4 mr-2" />
                Ajouter
              </Link>
            </Button>
          </div>

          {myLands.length === 0 ? (
            <div className="bg-card border border-border p-8 text-center">
              <House className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">Vous n'avez pas encore de terrains enregistrés</p>
              <Button asChild>
                <Link to="/lands/new">Ajouter un terrain</Link>
              </Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myLands.slice(0, 3).map(land => (
                <LandCard key={land.land_id} land={land} />
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black">{t('dashboard.my_transactions')}</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/transactions">Voir tout</Link>
            </Button>
          </div>

          {myTransactions.length === 0 ? (
            <div className="bg-card border border-border p-8 text-center">
              <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucune transaction enregistrée</p>
            </div>
          ) : (
            <div className="bg-card border border-border overflow-hidden">
              <table className="w-full">
                <thead className="bg-secondary">
                  <tr>
                    <th className="text-left p-4 text-sm font-bold uppercase tracking-wide">Terrain</th>
                    <th className="text-left p-4 text-sm font-bold uppercase tracking-wide">Prix</th>
                    <th className="text-left p-4 text-sm font-bold uppercase tracking-wide hidden sm:table-cell">Date</th>
                    <th className="text-left p-4 text-sm font-bold uppercase tracking-wide hidden md:table-cell">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {myTransactions.slice(0, 5).map((txn) => (
                    <tr key={txn.transaction_id} className="border-t border-border">
                      <td className="p-4">
                        <div className="font-medium">{txn.land_title}</div>
                        <div className="text-sm text-muted-foreground">
                          {txn.buyer_id === user?.user_id ? 'Achat' : 'Vente'}
                        </div>
                      </td>
                      <td className="p-4 font-bold text-accent">{txn.price?.toLocaleString()} GNF</td>
                      <td className="p-4 text-muted-foreground hidden sm:table-cell">
                        {new Date(txn.transaction_date).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <span className="px-2 py-1 text-xs bg-green-600 text-white">
                          {txn.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
