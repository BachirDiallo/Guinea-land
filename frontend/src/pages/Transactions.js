import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  Receipt, 
  Plus,
  ArrowRight,
  House,
  User,
  Calendar
} from '@phosphor-icons/react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Transactions() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await fetch(`${API}/transactions`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
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
    <div className="min-h-screen bg-background" data-testid="transactions-page">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black mb-2">{t('transactions.title')}</h1>
              <p className="text-primary-foreground/80">
                Historique de vos transactions foncières
              </p>
            </div>
            <Button 
              className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-brutal-sm gap-2"
              asChild
            >
              <Link to="/transactions/new">
                <Plus className="w-5 h-5" />
                {t('transactions.new')}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {transactions.length === 0 ? (
          <div className="bg-card border border-border p-12 text-center">
            <Receipt className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Aucune transaction</h2>
            <p className="text-muted-foreground mb-6">
              Vous n'avez pas encore de transactions enregistrées
            </p>
            <Button asChild>
              <Link to="/listings">
                Explorer les terrains disponibles
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((txn) => (
              <div 
                key={txn.transaction_id}
                className="bg-card border border-border p-6 card-hover-lift"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Land Info */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary flex items-center justify-center flex-shrink-0">
                      <House className="w-6 h-6 text-primary-foreground" weight="duotone" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{txn.land_title || 'Terrain'}</h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(txn.transaction_date).toLocaleDateString('fr-FR')}
                        </span>
                        <span>ID: {txn.transaction_id}</span>
                      </div>
                    </div>
                  </div>

                  {/* Parties */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground uppercase mb-1">{t('transactions.seller')}</div>
                      <div className="font-medium">{txn.seller_name}</div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-accent" />
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground uppercase mb-1">{t('transactions.buyer')}</div>
                      <div className="font-medium">{txn.buyer_name}</div>
                    </div>
                  </div>

                  {/* Price & Status */}
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground uppercase mb-1">{t('transactions.price')}</div>
                      <div className="text-xl font-black text-accent">{txn.price?.toLocaleString()} GNF</div>
                    </div>
                    <Badge className="bg-green-600 text-white">
                      {txn.status === 'completed' ? 'Complété' : txn.status}
                    </Badge>
                  </div>
                </div>

                {/* Notes */}
                {txn.notes && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">{txn.notes}</p>
                  </div>
                )}

                {/* View Details */}
                <div className="mt-4 pt-4 border-t border-border flex justify-end">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/lands/${txn.land_id}`}>
                      Voir le terrain
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
